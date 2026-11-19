import SiteHeader from "@/components/SiteHeader";
import OfferCover from "@/components/OfferCover";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, offerTypeLabels } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Catalogue | GOWINMALL",
  description: "Produits digitaux, produits physiques et services proposés par des vendeurs vérifiés.",
};

const DAY = 24 * 60 * 60 * 1000;

const filters: [string, string][] = [
  ["", "Tout"],
  ["digital", "Produits digitaux"],
  ["physical", "Produits physiques"],
  ["service", "Services"],
];

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type, q } = await searchParams;
  const active = type && offerTypeLabels[type] ? type : "";
  const search = (q ?? "").trim().slice(0, 60).replace(/[%_,()]/g, " ").trim();

  const supabase = await createClient();
  let query = supabase
    .from("offers")
    .select("id, title, description, offer_type, price_amount, currency, seller_name, seller_city, cover_path, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  if (active) query = query.eq("offer_type", active);
  if (search) query = query.ilike("title", `%${search}%`);
  const { data } = await query;
  const offers = data ?? [];
  const now = Date.now();

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "var(--font-dm-sans)" }}>
      <SiteHeader />

      <section style={{ background: "linear-gradient(135deg, #0f3d2e, #087443)", color: "white", padding: "28px 15px" }}>
        <div style={{ maxWidth: "980px", margin: "auto" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "26px" }}>Le catalogue GOWINMALL</h1>
          <p style={{ margin: "0 0 16px", opacity: 0.9, fontSize: "14px", lineHeight: 1.5 }}>
            Des offres de vendeurs dont l&apos;identité est vérifiée. Vous payez GOWINMALL, qui reverse le vendeur.
          </p>
          <form action="/catalogue" method="get" style={{ display: "flex", gap: "8px" }}>
            {active && <input type="hidden" name="type" value={active} />}
            <input
              name="q"
              defaultValue={search}
              placeholder="Rechercher une offre…"
              style={{ flex: 1, padding: "13px", border: "none", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box" }}
            />
            <button
              type="submit"
              style={{ padding: "13px 18px", background: "#f5a623", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "15px", cursor: "pointer" }}
            >
              Chercher
            </button>
          </form>
        </div>
      </section>

      <div style={{ maxWidth: "980px", margin: "auto", padding: "18px 15px 40px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {filters.map(([value, text]) => {
            const params = new URLSearchParams();
            if (value) params.set("type", value);
            if (search) params.set("q", search);
            const href = params.toString() ? `/catalogue?${params.toString()}` : "/catalogue";
            return (
              <a
                key={value}
                href={href}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  background: active === value ? "#087443" : "white",
                  color: active === value ? "white" : "#26352d",
                  border: "1px solid #dce4df",
                }}
              >
                {text}
              </a>
            );
          })}
        </div>

        {offers.length === 0 ? (
          <div style={{ background: "white", padding: "32px 20px", borderRadius: "16px", textAlign: "center", color: "#68766e" }}>
            <strong style={{ color: "#172d22" }}>
              {search ? `Aucune offre pour « ${search} ».` : "Aucune offre pour le moment."}
            </strong>
            <p style={{ fontSize: "14px" }}>Soyez parmi les premiers à vendre sur GOWINMALL.</p>
            <a href="/vendre" style={{ color: "#087443", fontWeight: 700 }}>Vendre sur GOWINMALL</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {offers.map((o) => {
              const isNew = now - new Date(o.created_at).getTime() < 7 * DAY;
              return (
                <a
                  key={o.id}
                  href={`/catalogue/${o.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                    borderRadius: "14px",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "#172d22",
                    boxShadow: "0 4px 18px #0000000f",
                    border: "1px solid #edf1ee",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <OfferCover id={o.id} title={o.title} type={o.offer_type} coverPath={o.cover_path} />
                    <span style={{ position: "absolute", top: "8px", left: "8px", background: "#ffffffee", color: "#26352d", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>
                      {offerTypeLabels[o.offer_type] ?? "Offre"}
                    </span>
                    {isNew && (
                      <span style={{ position: "absolute", top: "8px", right: "8px", background: "#f5a623", color: "white", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "999px" }}>
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        minHeight: "38px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {o.title}
                    </div>
                    <div style={{ fontSize: "19px", fontWeight: 800, color: "#087443" }}>
                      {formatPrice(o.price_amount, o.currency)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#68766e", lineHeight: 1.4 }}>
                      {o.seller_name || "Vendeur GOWINMALL"}
                      {o.seller_city ? ` · ${o.seller_city}` : ""}
                      <br />
                      <span style={{ color: "#087443", fontWeight: 700 }}>✓ Vendeur vérifié</span>
                    </div>
                    <div style={{ marginTop: "auto", textAlign: "center", padding: "9px", borderRadius: "8px", background: "#e8f5ed", color: "#087443", fontWeight: 700, fontSize: "13px" }}>
                      Voir l&apos;offre
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
      }
