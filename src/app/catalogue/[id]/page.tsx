import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice, offerTypeLabels } from "@/lib/format";
import BuyButton from "./buy-button";

export const dynamic = "force-dynamic";

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("id, seller_id, title, description, offer_type, price_amount, currency, seller_name, seller_city, status")
    .eq("id", id)
    .maybeSingle();
  if (!offer || offer.status !== "published") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = user?.id === offer.seller_id;

  let paymentOpen = true;
  if (user) {
    const { count } = await supabase
      .from("platform_payment_methods")
      .select("*", { count: "exact", head: true });
    paymentOpen = (count ?? 0) > 0;
  }

  const isDigital = offer.offer_type === "digital";

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "620px", margin: "auto", padding: "24px 15px" }}>
        <a href="/catalogue" style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          ← Catalogue
        </a>

        <div style={{ background: "white", padding: "22px 20px", borderRadius: "16px", boxShadow: "0 8px 35px #0000000d", margin: "12px 0 14px" }}>
          <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: "#eef2ef", color: "#68766e" }}>
            {offerTypeLabels[offer.offer_type] ?? "Offre"}
          </span>
          <h1 style={{ margin: "12px 0 6px", color: "#172d22", fontSize: "24px" }}>{offer.title}</h1>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#087443" }}>
            {formatPrice(offer.price_amount, offer.currency)}
          </div>
          <div style={{ fontSize: "13px", color: "#68766e", margin: "10px 0 16px" }}>
            Vendu par {offer.seller_name || "un vendeur GOWINMALL"}
            {offer.seller_city ? ` · ${offer.seller_city}` : ""}{" "}
            <span style={{ color: "#087443", fontWeight: 700 }}>✓ Vendeur vérifié</span>
          </div>
          <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#26352d", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {offer.description}
          </p>
        </div>

        <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 35px #0000000d", marginBottom: "14px" }}>
          {isOwn ? (
            <div style={{ fontSize: "14px" }}>
              C&apos;est votre offre.{" "}
              <a href="/vendre" style={{ color: "#087443", fontWeight: 700 }}>Gérer mes offres</a>
            </div>
          ) : !paymentOpen ? (
            <div style={{ background: "#fff4df", padding: "14px", borderRadius: "10px", fontSize: "14px", lineHeight: 1.6 }}>
              <strong>Les commandes ouvriront très bientôt.</strong> Revenez dans quelques jours.
            </div>
          ) : (
            <BuyButton offerId={offer.id} loggedIn={Boolean(user)} />
          )}
        </div>

        <div style={{ background: "#edf7f0", padding: "18px 20px", borderRadius: "16px", fontSize: "14px", lineHeight: 1.7 }}>
          <strong>Comment ça se passe</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            <li>Vous commandez, puis vous payez <strong>GOWINMALL</strong> (pas directement le vendeur).</li>
            <li>L&apos;équipe vérifie votre paiement.</li>
            <li>
              {isDigital
                ? "Vous accédez à votre achat sur la page de la commande."
                : "Le vendeur vous livre. Vous confirmez la réception, puis GOWINMALL reverse le vendeur."}
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
                         }
