import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistiques | GOWINMALL Admin" };

const DAY = 24 * 60 * 60 * 1000;
const MAX_ROWS = 5000;

const accountLabels: Record<string, string> = {
  particulier: "Particulier",
  vendeur: "Vendeur",
  entreprise: "Entreprise",
  prestataire: "Prestataire de services",
  affilie: "Affilié",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "14px",
  padding: "20px",
  flex: "1 1 180px",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101b17",
        padding: "24px 16px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

function Stat({
  label,
  value,
  color = "#087443",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "13px", color: "#718078" }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("fr-CA", { timeZone: "Africa/Kinshasa" });
}

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (!role) redirect("/");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin");

  if (role !== "owner" && role !== "admin") {
    return (
      <Shell>
        <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
          ← Retour à l&apos;administration
        </a>
        <div style={{ ...cardStyle, marginTop: "16px" }}>
          Les statistiques sont réservées aux administrateurs.
        </div>
      </Shell>
    );
  }

  await supabase.rpc("log_admin_action", { p_action: "consultation_statistiques" });

  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const total = usersCount ?? 0;

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("created_at, account_type, city, phone")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  const rows = profileRows ?? [];

  const countDocs = async (status: string) => {
    const { count } = await supabase
      .from("identity_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    return count ?? 0;
  };
  const [pending, approved, rejected] = await Promise.all([
    countDocs("pending"),
    countDocs("approved"),
    countDocs("rejected"),
  ]);

  const { data: docUsers } = await supabase
    .from("identity_documents")
    .select("user_id")
    .limit(MAX_ROWS);
  const usersWithDocs = new Set((docUsers ?? []).map((d) => d.user_id)).size;
  const withoutDoc = Math.max(total - usersWithDocs, 0);

  const { data: audit } = await supabase
    .from("audit_log")
    .select("action, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const now = Date.now();
  const new7 = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * DAY).length;
  const new30 = rows.filter((r) => now - new Date(r.created_at).getTime() < 30 * DAY).length;
  const incomplete = rows.filter((r) => !r.phone || !r.city).length;

  const perDay = new Map<string, number>();
  for (const r of rows) {
    const key = dayKey(new Date(r.created_at));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    return {
      key: dayKey(d),
      label: d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Africa/Kinshasa",
      }),
      count: perDay.get(dayKey(d)) ?? 0,
    };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const byType = new Map<string, number>();
  const byCity = new Map<string, { label: string; n: number }>();
  for (const r of rows) {
    byType.set(r.account_type, (byType.get(r.account_type) ?? 0) + 1);
    const city = (r.city ?? "").trim();
    if (city) {
      const key = city.toLowerCase();
      const current = byCity.get(key);
      byCity.set(key, { label: current?.label ?? city, n: (current?.n ?? 0) + 1 });
    }
  }
  const typeList: [string, number][] = Array.from(byType.entries()).sort((a, b) => b[1] - a[1]);
  const cityList = Array.from(byCity.values()).sort((a, b) => b.n - a.n).slice(0, 5);

  const verifiedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;
  const salesCards = ["Ventes", "Chiffre d'affaires", "Commissions", "Retraits"];

  return (
    <Shell>
      <div style={{ marginBottom: "18px" }}>
        <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
          ← Retour à l&apos;administration
        </a>
        <div style={{ color: "white", fontSize: "22px", fontWeight: 800, marginTop: "10px" }}>
          Statistiques
        </div>
        {total > rows.length && (
          <div style={{ color: "#9db3a8", fontSize: "13px", marginTop: "4px" }}>
            Calculées sur les {MAX_ROWS} dernières inscriptions.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <Stat label="Inscrits" value={total} />
        <Stat label="Nouveaux (7 jours)" value={new7} />
        <Stat label="Nouveaux (30 jours)" value={new30} />
        <Stat label="Profils incomplets" value={incomplete} color="#b18a35" />
      </div>

      <div style={{ ...cardStyle, marginTop: "14px" }}>
        <h3 style={{ marginTop: 0, color: "#172d22" }}>Inscriptions : 14 derniers jours</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "130px" }}>
          {days.map((d) => (
            <div
              key={d.key}
              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}
            >
              <div style={{ fontSize: "11px", color: "#718078" }}>{d.count > 0 ? d.count : ""}</div>
              <div
                style={{
                  width: "100%",
                  height: `${Math.max((d.count / maxDay) * 100, d.count > 0 ? 6 : 2)}%`,
                  background: d.count > 0 ? "#087443" : "#e5ebe7",
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
          {days.map((d) => (
            <div key={d.key} style={{ flex: 1, textAlign: "center", fontSize: "9px", color: "#718078" }}>
              {d.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "14px" }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: "#172d22" }}>Types de compte</h3>
          {typeList.map(([type, n]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #e5ebe7", fontSize: "14px" }}>
              <span>{accountLabels[type] ?? type}</span>
              <strong>{n}</strong>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: "#172d22" }}>Villes principales</h3>
          {cityList.length === 0 && <div style={{ fontSize: "14px", color: "#718078" }}>Aucune ville renseignée.</div>}
          {cityList.map((c) => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #e5ebe7", fontSize: "14px" }}>
              <span>{c.label}</span>
              <strong>{c.n}</strong>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ color: "white", margin: "22px 0 10px" }}>Vérification d&apos;identité</h3>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <Stat label="En attente" value={pending} color="#b18a35" />
        <Stat label="Approuvés" value={approved} />
        <Stat label="Refusés" value={rejected} color="#b3261e" />
        <Stat label="Comptes sans pièce envoyée" value={withoutDoc} color="#718078" />
        <Stat label="Comptes vérifiés" value={`${verifiedPercent} %`} />
      </div>

      <h3 style={{ color: "white", margin: "22px 0 10px" }}>Ventes et revenus</h3>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        {salesCards.map((label) => (
          <div key={label} style={cardStyle}>
            <div style={{ fontSize: "13px", color: "#718078" }}>{label}</div>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#c3cdc8" }}>—</div>
            <div style={{ fontSize: "12px", color: "#718078" }}>
              Disponible dès que les ventes existeront.
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: "22px" }}>
        <h3 style={{ marginTop: 0, color: "#172d22" }}>Activité récente de l&apos;équipe</h3>
        {(audit ?? []).length === 0 && (
          <div style={{ fontSize: "14px", color: "#718078" }}>Aucune activité visible.</div>
        )}
        {(audit ?? []).map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderTop: "1px solid #e5ebe7", fontSize: "14px" }}>
            <span>{String(a.action).replace(/_/g, " ")}</span>
            <span style={{ color: "#718078", whiteSpace: "nowrap" }}>
              {new Date(a.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
    }
