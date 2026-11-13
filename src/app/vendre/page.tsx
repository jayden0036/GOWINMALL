import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatRate, offerStatusLabels, offerTypeLabels } from "@/lib/format";
import OfferActions from "./offer-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendre | GOWINMALL" };

const card: React.CSSProperties = {
  background: "white",
  padding: "18px",
  borderRadius: "16px",
  boxShadow: "0 8px 35px #0000000d",
  marginBottom: "14px",
};

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: docs } = await supabase
    .from("identity_documents")
    .select("status")
    .eq("user_id", user.id);
  const verified = (docs ?? []).some((d) => d.status === "approved");

  const { data: payout } = await supabase
    .from("seller_payout_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const hasPayout = Boolean(payout);

  const { data: feesData } = await supabase.from("fee_schedule").select("offer_type, rate_bps");
  const fees = feesData ?? [];

  const { data: offersData } = await supabase
    .from("offers")
    .select("id, title, offer_type, price_amount, currency, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const offers = offersData ?? [];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", padding: "30px 15px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "640px", margin: "auto" }}>
        <a href="/dashboard" style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          ← Mon tableau de bord
        </a>
        <h1 style={{ color: "#087443", margin: "12px 0 4px" }}>Mes offres</h1>
        <p style={{ color: "#68766e", fontSize: "14px", marginTop: 0 }}>
          Vendez des produits digitaux, des produits physiques ou des services.
        </p>

        <div style={{ ...card, fontSize: "14px", lineHeight: 1.6 }}>
          <strong style={{ color: "#172d22" }}>Comment ça se passe quand vous vendez</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            <li>L&apos;acheteur paie <strong>GOWINMALL</strong> et déclare son paiement.</li>
            <li>L&apos;équipe confirme avoir reçu l&apos;argent.</li>
            <li>Produit digital : livré tout de suite. Produit physique ou service : l&apos;acheteur confirme la réception.</li>
            <li>GOWINMALL vous <strong>reverse le prix moins la commission</strong> sur vos coordonnées de reversement.</li>
          </ol>
          {fees.length > 0 && (
            <div style={{ marginTop: "10px", color: "#68766e" }}>
              Commission GOWINMALL :{" "}
              {fees.map((f) => `${offerTypeLabels[f.offer_type] ?? f.offer_type} ${formatRate(f.rate_bps)}`).join(" · ")}
            </div>
          )}
        </div>

        {!verified && (
          <div style={{ ...card, background: "#fff4df", fontSize: "14px", lineHeight: 1.5 }}>
            <strong>Identité non vérifiée.</strong> Vous pouvez préparer vos offres en brouillon, mais vous
            ne pourrez les publier qu&apos;après la vérification de votre identité.{" "}
            <a href="/verification" style={{ color: "#087443", fontWeight: 700 }}>
              Envoyer une pièce d&apos;identité
            </a>
          </div>
        )}

        {!hasPayout && (
          <div style={{ ...card, background: "#fff4df", fontSize: "14px", lineHeight: 1.5 }}>
            <strong>Où recevoir votre argent ?</strong> Indiquez vos coordonnées de reversement : elles sont
            nécessaires pour publier.{" "}
            <a href="/vendre/paiement" style={{ color: "#087443", fontWeight: 700 }}>
              Ajouter mes coordonnées
            </a>
          </div>
        )}

        {hasPayout && (
          <div style={{ fontSize: "13px", marginBottom: "12px" }}>
            <a href="/vendre/paiement" style={{ color: "#087443", fontWeight: 600 }}>
              Modifier mes coordonnées de reversement
            </a>
          </div>
        )}

        <a
          href="/vendre/nouvelle"
          style={{ display: "block", textAlign: "center", padding: "14px", background: "#087443", color: "white", borderRadius: "10px", fontWeight: "bold", textDecoration: "none", marginBottom: "18px" }}
        >
          + Nouvelle offre
        </a>

        {offers.length === 0 && (
          <div style={{ ...card, color: "#68766e", fontSize: "14px" }}>
            Vous n&apos;avez pas encore d&apos;offre.
          </div>
        )}

        {offers.map((o) => (
          <div key={o.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
              <div>
                <strong style={{ color: "#172d22" }}>{o.title}</strong>
                <div style={{ fontSize: "13px", color: "#68766e", marginTop: "2px" }}>
                  {offerTypeLabels[o.offer_type] ?? o.offer_type} · {formatPrice(o.price_amount, o.currency)}
                </div>
              </div>
              <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: o.status === "published" ? "#e8f5ed" : "#eef2ef", color: o.status === "published" ? "#087443" : "#68766e", whiteSpace: "nowrap" }}>
                {offerStatusLabels[o.status] ?? o.status}
              </span>
            </div>
            <div style={{ marginTop: "12px" }}>
              <OfferActions offerId={o.id} status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
          }
