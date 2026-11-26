import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { missionStatusLabels } from "@/lib/mission-labels";
import { Badge, BORDER, card, formatDate, ghostButton, h2, MUTED, primaryButton, Shell, sub, TEXT } from "../dashboard/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Missions | GOWINMALL" };

type Mission = {
  id: string;
  title: string;
  price_amount: number;
  currency: string;
  status: string;
  client_id: string;
  worker_id: string | null;
  created_at: string;
  deadline_at: string | null;
};

function Row({ m, first, role }: { m: Mission; first: boolean; role?: string }) {
  return (
    <a
      href={`/missions/${m.id}`}
      style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderTop: first ? "none" : `1px solid ${BORDER}`, fontSize: "14px", color: "inherit" }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: TEXT }}>{m.title}</div>
        <div style={{ color: MUTED, fontSize: "12px" }}>
          {role ? `${role} · ` : ""}Publiée le {formatDate(m.created_at)}
          {m.deadline_at ? ` · pour le ${formatDate(m.deadline_at)}` : ""}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: TEXT }}>{formatPrice(m.price_amount, m.currency)}</div>
        {role && <Badge tone={m.status === "completed" ? "ok" : m.status === "cancelled" ? "bad" : "wait"}>{missionStatusLabels[m.status] ?? m.status}</Badge>}
      </div>
    </a>
  );
}

export default async function MissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [missionsRes, identityRes] = await Promise.all([
    supabase
      .from("missions")
      .select("id, title, price_amount, currency, status, client_id, worker_id, created_at, deadline_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("identity_documents").select("status").eq("user_id", user.id).eq("status", "approved").limit(1),
  ]);

  const all = (missionsRes.data ?? []) as Mission[];
  const mine = all.filter((m) => m.client_id === user.id || m.worker_id === user.id);
  const open = all.filter((m) => m.status === "open" && m.client_id !== user.id);
  const verified = (identityRes.data ?? []).length > 0;

  return (
    <Shell active="missions">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Missions</h1>
          <p style={{ margin: 0, fontSize: "14px", color: MUTED }}>Trouvez du travail rémunéré, ou publiez une mission.</p>
        </div>
        <a href="/missions/nouvelle" style={primaryButton}>
          Publier une mission
        </a>
      </div>

      {!verified && (
        <section style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            <strong style={{ color: TEXT }}>Vérifiez votre identité pour postuler</strong>
            <div style={{ color: MUTED }}>C&apos;est nécessaire pour être choisi et recevoir votre paiement.</div>
          </div>
          <a href="/verification" style={ghostButton}>
            Vérifier
          </a>
        </section>
      )}

      <section style={card}>
        <h2 style={h2}>Missions ouvertes</h2>
        {open.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Aucune mission ouverte pour le moment.</p>
        ) : (
          open.map((m, i) => <Row key={m.id} m={m} first={i === 0} />)
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>Mes missions</h2>
        {mine.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Vous n&apos;avez encore ni publié ni reçu de mission.</p>
        ) : (
          mine.map((m, i) => <Row key={m.id} m={m} first={i === 0} role={m.client_id === user.id ? "Client" : "Travailleur"} />)
        )}
      </section>
    </Shell>
  );
}
