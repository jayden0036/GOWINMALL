import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Opportunités | GOWINMALL",
  description:
    "Offres d'emploi, missions et stages publiés par des sources officielles, mises à jour régulièrement.",
};

const DAY = 24 * 60 * 60 * 1000;

const categoryLabels: Record<string, string> = {
  emploi: "Emploi",
  mission: "Mission",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

const sourceLabels: Record<string, string> = {
  reliefweb: "ReliefWeb",
};

const filters: [string, string][] = [
  ["", "Tout"],
  ["emploi", "Emplois"],
  ["mission", "Missions"],
  ["stage", "Stages"],
  ["freelance", "Freelance"],
];

type Opportunity = {
  id: string;
  source_key: string;
  title: string;
  company: string;
  location: string;
  country: string;
  is_remote: boolean;
  category: string;
  summary: string;
  url: string;
  posted_at: string | null;
  fetched_at: string;
};

function ago(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / DAY);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  return new Date(date).toLocaleDateString("fr-FR");
}

export default async function OpportunitesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;
  const active = categorie && categoryLabels[categorie] ? categorie : "";
  const search = (q ?? "").trim().slice(0, 60).replace(/[%_,()]/g, " ").trim();

  const supabase = await createClient();
  let query = supabase
    .from("opportunities")
    .select(
      "id, source_key, title, company, location, country, is_remote, category, summary, url, posted_at, fetched_at"
    )
    .eq("status", "active")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(60);
  if (active) query = query.eq("category", active);
  if (search) query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  const { data } = await query;
  const items = ((data ?? []) as Opportunity[]).filter((o) => /^https?:\/\//.test(o.url));
  const now = Date.now();

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "var(--font-dm-sans)" }}>
      <SiteHeader />

      <section style={{ background: "linear-gradient(135deg, #0f3d2e, #087443)", color: "white", padding: "28px 15px" }}>
        <div style={{ maxWidth: "980px", margin: "auto" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "26px" }}>Opportunités</h1>
          <p style={{ margin: "0 0 16px", opacity: 0.9, fontSize: "14px", lineHeight: 1.5 }}>
            Emplois, missions et stages publiés par des sources officielles. Chaque offre renvoie vers le site d&apos;origine.
          </p>
          <form action="/opportunites" method="get" style={{ display: "flex", gap: "8px" }}>
            {active && <input type="hidden" name="categorie" value={active} />}
            <input
              name="q"
              defaultValue={search}
              placeholder="Poste, organisation…"
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
        <div style={{ background: "#fff8e8", border: "1px solid #f3dfae", color: "#6b4e00", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>
          <strong>Prudence :</strong> un recruteur sérieux ne demande jamais d&apos;argent pour une candidature, un dossier ou une formation. Ne payez rien et ne donnez jamais vos codes ou pièces d&apos;identité par message.
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {filters.map(([value, text]) => {
            const params = new URLSearchParams();
            if (value) params.set("categorie", value);
            if (search) params.set("q", search);
            const href = params.toString() ? `/opportunites?${params.toString()}` : "/opportunites";
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

        {items.length === 0 ? (
          <div style={{ background: "white", padding: "32px 20px", borderRadius: "16px", textAlign: "center", color: "#68766e" }}>
            <strong style={{ color: "#172d22" }}>
              {search || active ? "Aucune opportunité ne correspond à cette recherche." : "Les premières opportunités arrivent bientôt."}
            </strong>
            <p style={{ fontSize: "14px", lineHeight: 1.5 }}>
              {search || active
                ? "Essayez un autre mot ou affichez toutes les catégories."
                : "Nous branchons des sources officielles, une par une, pour n'afficher que des offres fiables."}
            </p>
            {(search || active) && (
              <a href="/opportunites" style={{ color: "#087443", fontWeight: 700 }}>Tout afficher</a>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {items.map((o) => {
              const date = o.posted_at ?? o.fetched_at;
              const isNew = now - new Date(date).getTime() < 3 * DAY;
              const place = [o.location, o.country].filter(Boolean).join(", ");
              return (
                <article
                  key={o.id}
                  style={{ background: "white", borderRadius: "14px", padding: "16px", border: "1px solid #edf1ee", boxShadow: "0 4px 18px #0000000f" }}
                >
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ background: "#e8f5ed", color: "#087443", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px" }}>
                      {categoryLabels[o.category] ?? "Opportunité"}
                    </span>
                    {o.is_remote && (
                      <span style={{ background: "#eef2ff", color: "#3b4cca", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px" }}>
                        À distance
                      </span>
                    )}
                    {isNew && (
                      <span style={{ background: "#f5a623", color: "white", fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "999px" }}>
                        Nouveau
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "17px", lineHeight: 1.35, color: "#172d22" }}>{o.title}</h2>
                  <div style={{ fontSize: "13px", color: "#68766e", lineHeight: 1.5 }}>
                    {[o.company, place].filter(Boolean).join(" · ")}
                  </div>
                  {o.summary && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        color: "#26352d",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {o.summary}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#68766e" }}>
                      {ago(date)} · Source : {sourceLabels[o.source_key] ?? o.source_key}
                    </span>
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{ padding: "9px 14px", borderRadius: "8px", background: "#087443", color: "white", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
                    >
                      Voir l&apos;offre
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
