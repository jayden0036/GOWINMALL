import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import OfferCover from "@/components/OfferCover";
import SellerBadges, { VerifiedMark } from "@/components/SellerBadges";
import { getBadgesFor } from "@/lib/badges";
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

const css = `
.fp { max-width: 1000px; margin: 0 auto; padding-bottom: 40px; }
.fp-bc { padding: 14px 15px 0; font-size: 13px; color: #53665b; }
.fp-bc a { color: #087443; font-weight: 700; text-decoration: none; }
.fp-grid { display: grid; grid-template-columns: 1fr; }
.fp-hero { background: #dfeee5; margin-top: 12px; padding: 26px 0 40px; display: flex; justify-content: center; }
.fp-cover { width: 190px; }
.fp-box { background: #fff; border-radius: 16px; margin: 16px 15px 0; padding: 20px; box-shadow: 0 6px 24px #0b1f170f; }
.fp-pull { margin-top: -22px; position: relative; }
.fp-tag { display: inline-block; background: #e0f0e8; color: #087443; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 999px; }
.fp-list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 9px; font-size: 14px; line-height: 1.45; color: #26352d; }
.fp-list li { display: flex; gap: 9px; align-items: flex-start; }
.fp-dl { display: grid; grid-template-columns: 120px 1fr; gap: 10px 8px; font-size: 14px; margin: 12px 0 0; }
.fp-dl dt { color: #53665b; }
.fp-dl dd { margin: 0; font-weight: 600; color: #0b1f17; }
.fp-st { display: flex; gap: 12px; margin-top: 14px; font-size: 14px; line-height: 1.5; color: #26352d; }
.fp-st span { flex: none; width: 28px; height: 28px; border-radius: 50%; background: #0f3d2e; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 13px; }
@media (min-width: 860px) {
  .fp-grid { grid-template-columns: 340px 1fr; gap: 28px; padding: 18px 15px 0; align-items: start; }
  .fp-hero { background: transparent; padding: 0; margin-top: 0; position: sticky; top: 16px; }
  .fp-cover { width: 100%; max-width: 320px; }
  .fp-box { margin: 0; }
  .fp-pull { margin-top: 0; }
  .fp-rest .fp-box { margin: 16px 15px 0; }
}
`;

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("id, seller_id, title, description, offer_type, price_amount, currency, seller_name, seller_city, status, cover_path, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!offer || offer.status !== "published") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = user?.id === offer.seller_id;

  let paymentOpen = true;
  if (user) {
    const { count } = await supabase.from("platform_payment_methods").select("*", { count: "exact", head: true });
    paymentOpen = (count ?? 0) > 0;
  }

  const badges = (await getBadgesFor(supabase, [offer.seller_id])).get(offer.seller_id) ?? [];
  const isDigital = offer.offer_type === "digital";
  const list = benefits[offer.offer_type] ?? benefits.digital;
  const typeLabel = offerTypeLabels[offer.offer_type] ?? "Offre";

  return (
    <main style={{ minHeight: "100vh", background: "#f4f6f4", fontFamily: "var(--font-dm-sans)" }}>
      <style>{css}</style>
      <SiteHeader />
      <div className="fp">
        <div className="fp-bc">
          <a href="/catalogue">Catalogue</a> › {typeLabel}
        </div>

        <div className="fp-grid">
          <div className="fp-hero">
            <div className="fp-cover">
              <OfferCover id={offer.id} title={offer.title} coverPath={offer.cover_path} />
            </div>
          </div>

          <div className="fp-box fp-pull">
            <span className="fp-tag">{typeLabel}</span>
            <h1 style={{ margin: "10px 0 6px", color: "#0b1f17", fontSize: "25px", lineHeight: 1.2 }}>{offer.title}</h1>
            <div style={{ fontSize: "13px", color: "#53665b", display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
              <VerifiedMark size={16} />
              <span>
                Vendu par {offer.seller_name || "un vendeur GOWINMALL"}
                {offer.seller_city ? ` · ${offer.seller_city}` : ""} · Vendeur vérifié
              </span>
            </div>
            {badges.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <SellerBadges badges={badges} />
              </div>
            )}
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#0b1f17", margin: "12px 0 2px" }}>{formatPrice(offer.price_amount, offer.currency)}</div>
            <div style={{ fontSize: "13px", color: "#53665b" }}>Vous payez GOWINMALL, qui reverse le vendeur.</div>

            <div style={{ marginTop: "16px" }}>
              {isOwn ? (
                <div style={{ fontSize: "14px" }}>
                  C&apos;est votre offre. <a href="/vendre" style={{ color: "#087443", fontWeight: 700 }}>Gérer mes offres</a>
                </div>
              ) : !paymentOpen ? (
                <div style={{ background: "#fff4df", padding: "14px", borderRadius: "10px", fontSize: "14px", lineHeight: 1.6 }}>
                  <strong>Les commandes ouvriront très bientôt.</strong> Revenez dans quelques jours.
                </div>
              ) : (
                <BuyButton offerId={offer.id} loggedIn={Boolean(user)} />
              )}
            </div>

            <ul className="fp-list">
              {list.map((item) => (
                <li key={item}>
                  <VerifiedMark size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="fp-rest">
          <div className="fp-box">
            <h2 style={{ margin: "0 0 10px", fontSize: "19px", color: "#0b1f17" }}>À propos de cette offre</h2>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#26352d", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{offer.description}</p>
          </div>

          <div className="fp-box">
            <h2 style={{ margin: 0, fontSize: "19px", color: "#0b1f17" }}>Détails</h2>
            <dl className="fp-dl">
              <dt>Type</dt>
              <dd>{typeLabel}</dd>
              <dt>Vendeur</dt>
              <dd>{offer.seller_name || "Vendeur GOWINMALL"}</dd>
              {offer.seller_city && (
                <>
                  <dt>Ville</dt>
                  <dd>{offer.seller_city}</dd>
                </>
              )}
              <dt>Mis en ligne</dt>
              <dd>{new Date(offer.created_at).toLocaleDateString("fr-FR")}</dd>
            </dl>
          </div>

          <div className="fp-box" style={{ background: "#e8f2ec" }}>
            <h2 style={{ margin: 0, fontSize: "19px", color: "#0b1f17" }}>Comment ça se passe</h2>
            <div className="fp-st">
              <span>1</span>
              <div>
                Vous commandez, puis vous payez <strong>GOWINMALL</strong>, pas directement le vendeur.
              </div>
            </div>
            <div className="fp-st">
              <span>2</span>
              <div>L&apos;équipe vérifie votre paiement.</div>
            </div>
            <div className="fp-st">
              <span>3</span>
              <div>
                {isDigital
                  ? "Vous accédez à votre achat sur la page de la commande."
                  : "Le vendeur vous livre. Vous confirmez la réception, puis GOWINMALL reverse le vendeur."}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "13px" }}>
              <a href="/comment-ca-marche" style={{ color: "#087443", fontWeight: 700, textDecoration: "none" }}>
                Voir le détail et les frais →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
