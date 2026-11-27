import SiteHeader from "@/components/SiteHeader";
import OfferCover from "@/components/OfferCover";
import SellerBadges, { VerifiedMark } from "@/components/SellerBadges";
import { createClient } from "@/lib/supabase/server";
import { getBadgesFor, type Badge } from "@/lib/badges";
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

const css = `
.cat-band { background: #0f3d2e; padding: 16px 15px 18px; }
.cat-wrap { max-width: 1100px; margin: 0 auto; }
.cat-sr { display: flex; border-radius: 10px; overflow: hidden; background: #fff; }
.cat-sr select { border: 0; background: #e8eee9; padding: 0 8px; font: 600 13px var(--font-dm-sans), sans-serif; color: #0b1f17; width: 78px; }
.cat-sr input { flex: 1; min-width: 0; border: 0; padding: 14px 12px; font: 400 15px var(--font-dm-sans), sans-serif; }
.cat-sr button { border: 0; background: #f5a623; color: #0b1f17; width: 52px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.cat-chips { display: flex; gap: 8px; overflow-x: auto; padding: 14px 0 4px; }
.cat-chips a { white-space: nowrap; padding: 9px 14px; border-radius: 999px; background: #fff; border: 1px solid #d9e2dc; font-weight: 600; font-size: 13px; color: #0b1f17; text-decoration: none; }
.cat-chips a.on { background: #087443; border-color: #087443; color: #fff; }
.cat-main { max-width: 1100px; margin: 0 auto; padding: 8px 15px 48px; }
.cat-h2 { margin: 18px 0 0; font-size: 19px; font-weight: 800; color: #0b1f17; }
.cat-rail { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x proximity; padding: 12px 8px 10px 0; }
.cat-rail .cd { width: 136px; flex: none; scroll-snap-align: start; }
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 24px 14px; padding: 14px 0 0; }
.cd { display: block; color: inherit; text-decoration: none; }
.cd:hover .cd-t { text-decoration: underline; }
.cd-new { position: absolute; top: 8px; right: -6px; background: #d93025; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 3px 0 0 3px; z-index: 1; }
.cd-t { font-weight: 700; font-size: 14px; line-height: 1.3; margin: 10px 0 3px; color: #0b1f17; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cd-s { font-size: 12px; color: #53665b; display: flex; gap: 4px; align-items: center; }
.cd-p { font-size: 20px; font-weight: 800; margin-top: 5px; color: #0b1f17; }
.cd-k { font-size: 11px; color: #53665b; margin-top: 2px; }
.cat-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: #53665b; margin-top: 8px; }
.cat-bar a { color: #087443; font-weight: 700; text-decoration: none; padding: 4px 0; }
@media (min-width: 700px) {
  .cat-grid { grid-template-columns: repeat(auto-fill, minmax(176px, 1fr)); gap: 28px 18px; }
  .cat-rail .cd { width: 168px; }
}
`;

type Offer = {
  id: string;
  seller_id: string;
  title: string;
  offer_type: string;
  price_amount: number;
  currency: string;
  seller_name: string | null;
  seller_city: string | null;
  cover_path: string | null;
  created_at: string;
};

function Card({ o, badges, isNew }: { o: Offer; badges: Badge[]; isNew: boolean }) {
  return (
    <a href={`/catalogue/${o.id}`} className="cd">
      <div style={{ position: "relative" }}>
        <OfferCover id={o.id} title={o.title} coverPath={o.cover_path} />
        {isNew && <span className="cd-new">Nouveau</span>}
      </div>
      <div className="cd-t">{o.title}</div>
      <div className="cd-s">
        <VerifiedMark />
        <span>
          {o.seller_name || "Vendeur GOWINMALL"}
          {o.seller_city ? ` · ${o.seller_city}` : ""}
        </span>
      </div>
      {badges.length > 0 && (
        <div style={{ marginTop: "5px" }}>
          <SellerBadges badges={badges} compact />
        </div>
      )}
      <div className="cd-p">{formatPrice(o.price_amount, o.currency)}</div>
      <div className="cd-k">{o.offer_type === "digital" ? "Accès après paiement confirmé" : offerTypeLabels[o.offer_type] ?? "Offre"}</div>
    </a>
  );
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; tri?: string }>;
}) {
  const { type, q, tri } = await searchParams;
  const active = type && offerTypeLabels[type] ? type : "";
  const search = (q ?? "").trim().slice(0, 60).replace(/[%_,()]/g, " ").trim();
  const sort = tri === "az" ? "az" : "recent";

  const supabase = await createClient();
  let query = supabase
    .from("offers")
    .select("id, seller_id, title, offer_type, price_amount, currency, seller_name, seller_city, cover_path, created_at")
    .eq("status", "published")
    .limit(60);
  query = sort === "az" ? query.order("title", { ascending: true }) : query.order("created_at", { ascending: false });
  if (active) query = query.eq("offer_type", active);
  if (search) query = query.ilike("title", `%${search}%`);
  const { data } = await query;
  const offers = (data ?? []) as Offer[];
  const badgesBySeller = await getBadgesFor(supabase, offers.map((o) => o.seller_id));
  const now = Date.now();
  const isNew = (o: Offer) => now - new Date(o.created_at).getTime() < 7 * DAY;

  const link = (patch: { type?: string; tri?: string }) => {
    const params = new URLSearchParams();
    const t = patch.type !== undefined ? patch.type : active;
    const s = patch.tri !== undefined ? patch.tri : sort;
    if (t) params.set("type", t);
    if (search) params.set("q", search);
    if (s && s !== "recent") params.set("tri", s);
    return params.toString() ? `/catalogue?${params.toString()}` : "/catalogue";
  };

  const showRail = !search && !active && sort === "recent" && offers.length >= 4;

  return (
    <main style={{ minHeight: "100vh", background: "#f4f6f4", fontFamily: "var(--font-dm-sans)" }}>
      <style>{css}</style>
      <SiteHeader />

      <section className="cat-band">
        <div className="cat-wrap">
          <form action="/catalogue" method="get" className="cat-sr">
            <select name="type" defaultValue={active} aria-label="Catégorie">
              <option value="">Tout</option>
              <option value="digital">Digital</option>
              <option value="physical">Physique</option>
              <option value="service">Service</option>
            </select>
            <input name="q" defaultValue={search} placeholder="Rechercher une offre" aria-label="Rechercher une offre" />
            <button type="submit" aria-label="Chercher">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </form>
          <nav className="cat-chips" aria-label="Catégories">
            {filters.map(([value, text]) => (
              <a key={value} href={link({ type: value })} className={active === value ? "on" : undefined}>
                {text}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="cat-main">
        {offers.length === 0 ? (
          <div style={{ background: "white", padding: "32px 20px", borderRadius: "16px", textAlign: "center", color: "#53665b", marginTop: "18px" }}>
            <strong style={{ color: "#0b1f17" }}>{search ? `Aucune offre pour « ${search} ».` : "Aucune offre pour le moment."}</strong>
            <p style={{ fontSize: "14px" }}>Soyez parmi les premiers à vendre sur GOWINMALL.</p>
            <a href="/vendre" style={{ color: "#087443", fontWeight: 700 }}>Vendre sur GOWINMALL</a>
          </div>
        ) : (
          <>
            {showRail && (
              <>
                <h2 className="cat-h2">Nouveautés</h2>
                <div className="cat-rail">
                  {offers.slice(0, 8).map((o) => (
                    <Card key={o.id} o={o} badges={badgesBySeller.get(o.seller_id) ?? []} isNew={isNew(o)} />
                  ))}
                </div>
              </>
            )}
            <h2 className="cat-h2">{showRail ? "Tous les produits" : active ? offerTypeLabels[active] + "s" : "Le catalogue"}</h2>
            <div className="cat-bar">
              <span>
                {offers.length} résultat{offers.length > 1 ? "s" : ""}
              </span>
              <span>
                Trier : {sort === "recent" ? <strong style={{ color: "#0b1f17" }}>Nouveautés</strong> : <a href={link({ tri: "recent" })}>Nouveautés</a>}
                {" · "}
                {sort === "az" ? <strong style={{ color: "#0b1f17" }}>A à Z</strong> : <a href={link({ tri: "az" })}>A à Z</a>}
              </span>
            </div>
            <div className="cat-grid">
              {offers.map((o) => (
                <Card key={o.id} o={o} badges={badgesBySeller.get(o.seller_id) ?? []} isNew={isNew(o)} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
