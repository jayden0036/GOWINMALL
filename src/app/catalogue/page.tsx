import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, offerTypeLabels } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Catalogue | GOWINMALL",
  description: "Produits digitaux, produits physiques et services proposés par des vendeurs vérifiés.",
};

const filters: [string, string][] = [
  ["", "Tout"],
  ["digital", "Produits digitaux"],
  ["physical", "Produits physiques"],
  ["service", "Services"],
];

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const active = type && offerTypeLabels[type] ? type : "";

  const supabase = await createClient();
  let query = supabase
    .from("offers")
    .select("id, title, description, offer_type, price_amount, currency, seller_name, seller_city")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  if (active) query = query.eq("offer_type", active);
  const { data } = await query;
  const offers = data ?? [];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "980px", margin: "auto", padding: "24px 15px" }}>
        <h1 style={{ color: "#087443", margin: "0 0 4px" }}>Catalogue</h1>
        <p style={{ color: "#68766e", fontSize: "14px", marginTop: 0 }}>
          Des offres de vendeurs dont l&apos;identité a été vérifiée. Vous payez GOWINMALL, qui reverse le vendeur.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0" }}>
          {filters.map(([value, text]) => (
            <a
              key={value}
              href={value ? `/catalogue?type=${value}` : "/catalogue"}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "14px",
                textDecoration: "none",
                background: active === value ? "#087443" : "white",
                color: active === value ? "white" : "#26352d",
                border: "1px solid #dce4df",
              }}
            >
              {text}
            </a>
          ))}
        </div>

        {offers.length === 0 ? (
          <div style={{ background: "white", padding: "28px 20px", borderRadius: "16px", textAlign: "center", color: "#68766e" }}>
            <strong style={{ color: "#172d22" }}>Aucune offre pour le moment.</strong>
            <p style={{ fontSize: "14px" }}>Soyez parmi les premiers à vendre sur GOWINMALL.</p>
            <a href="/vendre" style={{ color: "#087443", fontWeight: 700 }}>Vendre sur GOWINMALL</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {offers.map((o) => (
              <a
                key={o.id}
                href={`/catalogue/${o.id}`}
                style={{ display: "block", background: "white", padding: "18px", borderRadius: "16px", boxShadow: "0 8px 35px #0000000d", textDecoration: "none", color: "#172d22" }}
              >
                <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: "#eef2ef", color: "#68766e" }}>
                  {offerTypeLabels[o.offer_type] ?? "Offre"}
                </span>
                <h2 style={{ fontSize: "17px", margin: "12px 0 6px" }}>{o.title}</h2>
                <p style={{ fontSize: "13px", color: "#68766e", lineHeight: 1.5, margin: "0 0 12px" }}>
                  {o.description.length > 110 ? `${o.description.slice(0, 110)}…` : o.description}
                </p>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#087443" }}>
                  {formatPrice(o.price_amount, o.currency)}
                </div>
                <div style={{ fontSize: "12px", color: "#68766e", marginTop: "6px" }}>
                  {o.seller_name || "Vendeur GOWINMALL"}
                  {o.seller_city ? ` · ${o.seller_city}` : ""} · ✓ Vérifié
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
                        }
