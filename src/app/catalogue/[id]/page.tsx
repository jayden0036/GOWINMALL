import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import OfferCover from "@/components/OfferCover";
import { formatPrice, offerTypeLabels } from "@/lib/format";
import BuyButton from "./buy-button";

export const dynamic = "force-dynamic";

const benefits: Record<string, string[]> = {
  digital: [
    "Accès à votre achat dès que votre paiement est confirmé",
    "Vendeur dont l'identité est vérifiée",
    "Paiement par Mobile Money via GOWINMALL",
  ],
  physical: [
    "Livraison par le vendeur",
    "Le vendeur n'est payé qu'après votre confirmation de réception",
    "Vendeur dont l'identité est vérifiée",
  ],
  service: [
    "Le service est réalisé par le vendeur",
    "Le vendeur n'est payé qu'après votre confirmation",
    "Vendeur dont l'identité est vérifiée",
  ],
};

const box: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 8px 35px #0000000d",
  marginTop: "16px",
};

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("id, seller_id, title, description, offer_type, price_amount, currency, seller_name, seller_city, status, cover_path")
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
  const list = benefits[offer.offer_type] ?? benefits.digital;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "980px", margin: "auto", padding: "20px 15px 40px" }}>
        <div style={{ fontSize: "13px", color: "#68766e", marginBottom: "12px" }}>
          <a href="/catalogue" style={{ color: "#087443", fontWeight: 600, textDecoration: "none" }}>Catalogue</a>
          {" › "}
          {offerTypeLabels[offer.offer_type] ?? "Offre"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>
          <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 35px #0000001a" }}>
            <OfferCover id={offer.id} title={offer.title} type={offer.offer_type} coverPath={offer.cover_path} />
          </div>

          <div>
            <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: "#e8f5ed", color: "#087443", fontWeight: 700 }}>
              {offerTypeLabels[offer.offer_type] ?? "Offre"}
            </span>
            <h1 style={{ margin: "12px 0 6px", color: "#172d22", fontSize: "26px", lineHeight: 1.25 }}>{offer.title}</h1>
            <div style={{ fontSize: "13px", color: "#68766e" }}>
              Vendu par {offer.seller_name || "un vendeur GOWINMALL"}
              {offer.seller_city ? ` · ${offer.seller_city}` : ""}{" "}
              <span style={{ color: "#087443", fontWeight: 700 }}>✓ Vendeur vérifié</span>
            </div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#087443", margin: "14px 0 4px" }}>
              {formatPrice(offer.price_amount, offer.currency)}
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: "14px", lineHeight: 1.7, color: "#26352d" }}>
              {list.map((item) => (
                <li key={item}>
                  <span style={{ color: "#087443", fontWeight: 800 }}>✓</span> {item}
                </li>
              ))}
            </ul>

            <div style={box}>
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
          </div>
        </div>

        <div style={box}>
          <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: "#172d22" }}>À propos de cette offre</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#26352d", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {offer.description}
          </p>
        </div>

        <div style={{ ...box, background: "#edf7f0" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "16px", color: "#172d22" }}>Comment ça se passe</h2>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.8 }}>
            <li>Vous commandez, puis vous payez <strong>GOWINMALL</strong> (pas directement le vendeur).</li>
            <li>L&apos;équipe vérifie votre paiement.</li>
            <li>
              {isDigital
                ? "Vous accédez à votre achat sur la page de la commande."
                : "Le vendeur vous livre. Vous confirmez la réception, puis GOWINMALL reverse le vendeur."}
            </li>
          </ol>
          <div style={{ marginTop: "10px", fontSize: "13px" }}>
            <a href="/comment-ca-marche" style={{ color: "#087443", fontWeight: 700 }}>Voir le détail et les frais →</a>
          </div>
        </div>
      </div>
    </main>
  );
              }
