import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { commissionOf, formatPrice, formatRate, offerTypeLabels } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Comment ça marche et tarifs | GOWINMALL",
  description: "Les étapes pour acheter et vendre sur GOWINMALL, et les frais appliqués.",
};

const card: React.CSSProperties = {
  background: "white",
  padding: "22px 20px",
  borderRadius: "16px",
  boxShadow: "0 8px 35px #0000000d",
  marginBottom: "16px",
};

const buyerSteps = [
  "Créez un compte (gratuit) et parcourez le catalogue.",
  "Cliquez sur « Commander » : une commande est créée.",
  "Payez GOWINMALL avec l'un des moyens indiqués, puis déclarez votre paiement avec la référence de la transaction.",
  "L'équipe vérifie votre paiement.",
  "Produit digital : vous accédez à votre achat sur la page de la commande. Produit physique ou service : le vendeur vous livre, vous confirmez la réception.",
];

const sellerSteps = [
  "Créez un compte et faites vérifier votre identité.",
  "Indiquez où recevoir votre argent (Mobile Money ou compte bancaire).",
  "Publiez votre offre : le détail des frais est affiché avant la publication.",
  "Quand un acheteur paie, GOWINMALL vérifie le paiement.",
  "GOWINMALL vous reverse le prix moins la commission : dès la confirmation pour un produit digital, après la confirmation de réception de l'acheteur pour un produit physique ou un service.",
];

const goodToKnow = [
  "Vous payez GOWINMALL, pas directement le vendeur.",
  "Les frais éventuels de l'opérateur Mobile Money (envoi, retrait) ne sont pas inclus dans les commissions ci-dessus.",
  "Le paiement est vérifié par l'équipe : un délai est possible avant la confirmation.",
  "Vous pouvez annuler une commande tant que vous n'avez pas déclaré votre paiement. Ensuite, contactez l'équipe.",
  "Les conditions complètes sont dans les conditions d'utilisation.",
];

export default async function HowItWorksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fee_schedule")
    .select("offer_type, rate_bps")
    .order("offer_type");
  const fees = data ?? [];
  const example = 10000; // 100 $ exprimé en cents

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "720px", margin: "auto", padding: "24px 15px" }}>
        <h1 style={{ color: "#087443", margin: "0 0 6px" }}>Comment ça marche</h1>
        <p style={{ color: "#68766e", fontSize: "15px", lineHeight: 1.6, marginTop: 0 }}>
          GOWINMALL met en relation acheteurs et vendeurs vérifiés. Voici les étapes et les frais, sans surprise.
        </p>

        <div style={card}>
          <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: "#172d22" }}>Pour acheter</h2>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.8, color: "#26352d" }}>
            {buyerSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        <div style={card}>
          <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: "#172d22" }}>Pour vendre</h2>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.8, color: "#26352d" }}>
            {sellerSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        <div style={card}>
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "#172d22" }}>Tarifs et commissions</h2>
          <p style={{ fontSize: "14px", color: "#68766e", marginTop: 0 }}>
            La commission est prélevée sur le prix de vente, payée par le vendeur. L&apos;acheteur paie le prix affiché.
          </p>
          {fees.map((f) => {
            const commission = commissionOf(example, f.rate_bps);
            return (
              <div key={f.offer_type} style={{ borderTop: "1px solid #e5ebe7", padding: "12px 0", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <strong>{offerTypeLabels[f.offer_type] ?? f.offer_type}</strong>
                  <strong style={{ color: "#087443" }}>{formatRate(f.rate_bps)}</strong>
                </div>
                <div style={{ color: "#68766e", marginTop: "4px" }}>
                  Exemple : pour une vente de {formatPrice(example, "USD")}, commission de{" "}
                  {formatPrice(commission, "USD")}, le vendeur reçoit {formatPrice(example - commission, "USD")}.
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: "12px", color: "#68766e", marginTop: "6px" }}>
            Ces tarifs peuvent évoluer ; le tarif appliqué à une commande est celui en vigueur au moment où elle est passée.
          </div>
        </div>

        <div style={{ ...card, background: "#edf7f0" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "18px", color: "#172d22" }}>Bon à savoir</h2>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.8, color: "#26352d" }}>
            {goodToKnow.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div style={{ marginTop: "12px", fontSize: "14px" }}>
            <a href="/conditions" style={{ color: "#087443", fontWeight: 700 }}>Conditions d&apos;utilisation</a>
            {" · "}
            <a href="/confidentialite" style={{ color: "#087443", fontWeight: 700 }}>Confidentialité</a>
          </div>
        </div>
      </div>
    </main>
  );
}
