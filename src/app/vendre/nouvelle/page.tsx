"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { commissionOf, formatPrice, formatRate, parsePrice } from "@/lib/format";

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "13px",
  marginTop: "7px",
  border: "1px solid #dce4df",
  borderRadius: "10px",
  fontSize: "15px",
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  color: "#26352d",
  marginBottom: "16px",
  fontSize: "14px",
};

export default function NewOfferPage() {
  const router = useRouter();
  const [type, setType] = useState("digital");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [publish, setPublish] = useState(true);
  const [acceptedFees, setAcceptedFees] = useState(false);
  const [fees, setFees] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .from("fee_schedule")
      .select("offer_type, rate_bps")
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((f) => {
          map[f.offer_type] = f.rate_bps;
        });
        setFees(map);
      });
  }, []);

  const rate = fees[type];
  const amount = parsePrice(price, currency);
  const commission = amount !== null && rate !== undefined ? commissionOf(amount, rate) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (amount === null) {
      setMessage(
        currency === "USD"
          ? "Prix invalide : entrez un montant comme 12 ou 12,50."
          : "Prix invalide : entrez un nombre entier de francs, sans virgule."
      );
      return;
    }
    if (title.trim().length < 3) {
      setMessage("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    if (description.trim().length < 10) {
      setMessage("La description doit contenir au moins 10 caractères.");
      return;
    }
    if (type === "digital" && deliveryInfo.trim().length < 5) {
      setMessage("Indiquez ce que l'acheteur reçoit après paiement (par exemple un lien de téléchargement).");
      return;
    }
    if (!acceptedFees) {
      setMessage("Cochez la case pour confirmer que vous avez compris les frais.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: offer, error } = await supabase
      .from("offers")
      .insert({
        seller_id: user.id,
        offer_type: type,
        title: title.trim(),
        description: description.trim(),
        price_amount: amount,
        currency,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !offer) {
      setLoading(false);
      setMessage("Impossible d'enregistrer l'offre : " + (error?.message ?? "erreur inconnue"));
      return;
    }

    const { error: deliveryError } = await supabase
      .from("offer_delivery")
      .insert({ offer_id: offer.id, delivery_info: deliveryInfo.trim() });

    if (deliveryError) {
      setLoading(false);
      setMessage(
        "L'offre est enregistrée en brouillon, mais les informations de livraison n'ont pas pu l'être. Rouvrez-la depuis « Mes offres »."
      );
      return;
    }

    if (publish) {
      const { error: publishError } = await supabase
        .from("offers")
        .update({ status: "published" })
        .eq("id", offer.id);
      if (publishError) {
        setLoading(false);
        setMessage("Offre enregistrée en brouillon, mais pas publiée : " + publishError.message);
        return;
      }
    }

    router.push("/vendre");
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", padding: "30px 15px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "560px", margin: "auto", background: "white", padding: "26px 20px", borderRadius: "18px", boxShadow: "0 8px 35px #0000000d" }}>
        <a href="/vendre" style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          ← Mes offres
        </a>
        <h1 style={{ color: "#087443", margin: "12px 0 18px" }}>Nouvelle offre</h1>

        <form onSubmit={handleSubmit}>
          <label style={label}>
            Type d&apos;offre
            <select value={type} onChange={(e) => setType(e.target.value)} style={field}>
              <option value="digital">Produit digital (ebook, formation, fichier…)</option>
              <option value="physical">Produit physique</option>
              <option value="service">Service</option>
            </select>
          </label>

          <label style={label}>
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} style={field} placeholder="Ex. : Guide complet du SEO" required />
          </label>

          <label style={label}>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} rows={5} style={field} placeholder="Décrivez clairement ce que vous vendez." required />
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <label style={{ ...label, flex: 2 }}>
              Prix
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" style={field} placeholder={currency === "USD" ? "12,50" : "25000"} required />
            </label>
            <label style={{ ...label, flex: 1 }}>
              Devise
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={field}>
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
              </select>
            </label>
          </div>

          {amount !== null && commission !== null && rate !== undefined && (
            <div style={{ background: "#edf7f0", padding: "14px", borderRadius: "10px", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Prix payé par l&apos;acheteur</span>
                <strong>{formatPrice(amount, currency)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Commission GOWINMALL ({formatRate(rate)})</span>
                <strong>− {formatPrice(commission, currency)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cfe5d6", marginTop: "4px", paddingTop: "4px" }}>
                <span>Vous recevrez</span>
                <strong style={{ color: "#087443" }}>{formatPrice(amount - commission, currency)}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#68766e", marginTop: "6px" }}>
                Les frais éventuels de l&apos;opérateur Mobile Money ne sont pas inclus.
              </div>
            </div>
          )}

          <label style={label}>
            {type === "digital" ? "Ce que l'acheteur reçoit après paiement" : "Informations de livraison (facultatif)"}
            <textarea value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} maxLength={2000} rows={3} style={field} placeholder={type === "digital" ? "Ex. : lien de téléchargement, code d'accès…" : "Ex. : remise en main propre à Kinshasa, livraison sous 48 h…"} />
          </label>

          <label style={{ display: "flex", gap: "10px", fontSize: "14px", marginBottom: "12px" }}>
            <input type="checkbox" checked={acceptedFees} onChange={(e) => setAcceptedFees(e.target.checked)} />
            <span>
              J&apos;ai compris que GOWINMALL prélève {rate !== undefined ? formatRate(rate) : "une commission"} sur
              chaque vente de ce type.
            </span>
          </label>

          <label style={{ display: "flex", gap: "10px", fontSize: "14px", marginBottom: "18px" }}>
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            <span>Publier tout de suite (identité vérifiée et coordonnées de reversement requises)</span>
          </label>

          {message && (
            <p role="status" style={{ background: "#fff4df", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "16px", background: "#087443", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Enregistrement…" : "Enregistrer l'offre"}
          </button>
        </form>
      </div>
    </main>
  );
        }
