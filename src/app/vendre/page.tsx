import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, offerStatusLabels, offerTypeLabels } from "@/lib/format";
import { Badge, card, formatDate, GREEN, MUTED, primaryButton, Shell, TEXT } from "../dashboard/ui";
import OfferActions from "./offer-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes offres | GOWINMALL" };

type Offer = {
  id: string;
  title: string;
  offer_type: string;
  price_amount: number;
  currency: string;
  status: string;
  created_at: string;
};

const tones: Record<string, "ok" | "wait" | "bad" | "todo"> = {
  published: "ok",
  draft: "todo",
  suspended: "bad",
  archived: "todo",
};

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("offers")
    .select("id, title, offer_type, price_amount, currency, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const offers = (data ?? []) as Offer[];

  const files: Record<string, string> = {};
  if (offers.length > 0) {
    const { data: deliveries } = await supabase
      .from("offer_delivery")
      .select("offer_id, file_name")
      .in(
        "offer_id",
        offers.map((o) => o.id)
      );
    for (const d of (deliveries ?? []) as { offer_id: string; file_name: string | null }[]) {
      if (d.file_name) files[d.offer_id] = d.file_name;
    }
  }

  return (
    <Shell active="vendre">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Mes offres</h1>
          <p style={{ margin: 0, fontSize: "14px", color: MUTED }}>Publiez, retirez ou archivez vos offres.</p>
        </div>
        <a href="/vendre/nouvelle" style={primaryButton}>
          Nouvelle offre
        </a>
      </div>

      {offers.length === 0 ? (
        <section style={card}>
          <strong style={{ color: TEXT }}>Vous n&apos;avez pas encore d&apos;offre.</strong>
          <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.6, margin: "6px 0 0" }}>
            Créez votre première offre : un guide, une formation, un produit ou un service. Pour la publier, votre
            identité doit être vérifiée et vos coordonnées de reversement enregistrées (voir Paramètres).
          </p>
        </section>
      ) : (
        offers.map((o) => (
          <section key={o.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: TEXT, fontSize: "16px", lineHeight: 1.3 }}>{o.title}</div>
                <div style={{ fontSize: "12px", color: MUTED, marginTop: "3px" }}>
                  {offerTypeLabels[o.offer_type] ?? "Offre"} · créée le {formatDate(o.created_at)}
                </div>
              </div>
              <Badge tone={tones[o.status] ?? "todo"}>{offerStatusLabels[o.status] ?? o.status}</Badge>
            </div>

            <div style={{ fontSize: "20px", fontWeight: 800, color: GREEN, margin: "10px 0 4px" }}>
              {formatPrice(o.price_amount, o.currency)}
            </div>

            {files[o.id] && (
              <div style={{ fontSize: "13px", color: MUTED, marginBottom: "10px" }}>
                Fichier protégé : <strong style={{ color: TEXT }}>{files[o.id]}</strong> (3 téléchargements par achat)
              </div>
            )}

            <OfferActions offerId={o.id} status={o.status} />
          </section>
        ))
      )}
    </Shell>
  );
    }
          
