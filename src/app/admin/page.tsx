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

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: "14px",
  padding: "14px 16px",
};

const sectionTitle: React.CSSProperties = {
  color: "white",
  margin: "22px 0 10px",
  fontSize: "17px",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101b17",
        padding: "18px 14px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "auto" }}>{children}</div>
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
    <div style={card}>
      <div style={{ fontSize: "12px", color: "#718078" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 800, color }}>{value}</div>
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
        <div style={{ ...card, marginTop: "16px" }}>
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

  const { data: docRowsData } = await supabase
    .from("identity_documents")
    .select("user_id, status")
    .limit(MAX_ROWS);
  const docRows = docRowsData ?? [];
  const usersWithDocs = new Set(docRows.map((d) => d.user_id)).size;
  const usersApproved = new Set(
    docRows.filter((d) => d.status === "approved").map((d) => d.user_id)
  ).size;
  const withoutDoc = Math.max(total - usersWithDocs, 0);

  const { data: audit } = await supabase
    .from("audit_log")
    .select("action, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

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
  const cityList = Array.from(byCity.values()).sort((a, b) => b.n - a.n).slice(0, 8);

  const verifiedPercent = total > 0 ? Math.round((usersApproved / total) * 100) : 0;

  const funnel: { label: string; value: number }[] = [
    { label: "Inscrits", value: total },
    { label: "Pièce d'identité envoyée", value: usersWithDocs },
    { label: "Identité vérifiée", value: usersApproved },
  ];

  const salesCards = ["Ventes", "Chiffre d'affaires", "Commissions", "Retraits"];

  return (
    <Shell>
      <div style={{ marginBottom: "14px" }}>
        <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
          ← Retour à l&apos;administration
        </a>
        <div style={{ color: "white", fontSize: "22px", fontWeight: 800, marginTop: "8px" }}>
          Statistiques
        </div>
        <div style={{ color: "#9db3a8", fontSize: "12px", marginTop: "2px" }}>
          Mis à jour le{" "}
          {new Date(now).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })}
          {total > rows.length ? ` · calculé sur les ${MAX_ROWS} dernières inscriptions` : ""}
        </div>
      </div>

      <div style={grid}>
        <Stat label="Inscrits" value={total} />
        <Stat label="Nouveaux (7 jours)" value={new7} />
        <Stat label="Nouveaux (30 jours)" value={new30} />
        <Stat label="Profils incomplets" value={incomplete} color="#b18a35" />
      </div>

      <div style={{ ...card, marginTop: "12px", overflow: "hidden" }}>
        <h3 style={{ margin: "0 0 12px", color: "#172d22", fontSize: "16px" }}>
          Inscriptions : 14 derniers jours
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "130px" }}>
          {days.map((d) => (
            <div
              key={d.key}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                height: "100%",
              }}
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
        <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
          {days.map((d, i) => (
            <div
              key={d.key}
              style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: "9px", color: "#718078" }}
            >
              {i % 3 === 0 || i === days.length - 1 ? d.label : ""}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...grid, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: "12px" }}>
        <div style={card}>
          <h3 style={{ margin: "0 0 8px", color: "#172d22", fontSize: "16px" }}>Parcours des inscrits</h3>
          {funnel.map((f) => {
            const pct = total > 0 ? Math.round((f.value / total) * 100) : 0;
            return (
              <div key={f.label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", gap: "8px" }}>
                  <span>{f.label}</span>
                  <strong>
                    {f.value} ({pct} %)
                  </strong>
                </div>
                <div style={{ background: "#e5ebe7", borderRadius: "999px", height: "8px", marginTop: "4px" }}>
                  <div style={{ width: `${pct}%`, background: "#087443", borderRadius: "999px", height: "8px" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={card}>
          <h3 style={{ margin: "0 0 8px", color: "#172d22", fontSize: "16px" }}>Types de compte</h3>
          {typeList.map(([type, n]) => (
            <div
              key={type}
              style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #e5ebe7", fontSize: "14px" }}
            >
              <span>{accountLabels[type] ?? type}</span>
              <strong>{n}</strong>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ margin: "0 0 8px", color: "#172d22", fontSize: "16px" }}>Villes</h3>
          {cityList.length === 0 && (
            <div style={{ fontSize: "14px", color: "#718078" }}>Aucune ville renseignée.</div>
          )}
          {cityList.map((c) => (
            <div
              key={c.label}
              style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #e5ebe7", fontSize: "14px" }}
            >
              <span>{c.label}</span>
              <strong>{c.n}</strong>
            </div>
          ))}
        </div>
      </div>

      <h3 style={sectionTitle}>Vérification d&apos;identité</h3>
      <div style={grid}>
        <Stat label="En attente" value={pending} color="#b18a35" />
        <Stat label="Approuvés" value={approved} />
        <Stat label="Refusés" value={rejected} color="#b3261e" />
        <Stat label="Sans pièce envoyée" value={withoutDoc} color="#718078" />
        <Stat label="Comptes vérifiés" value={`${verifiedPercent} %`} />
      </div>

      <h3 style={sectionTitle}>Ventes et revenus</h3>
      <div style={grid}>
        {salesCards.map((label) => (
          <div key={label} style={card}>
            <div style={{ fontSize: "12px", color: "#718078" }}>{label}</div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#c3cdc8" }}>—</div>
          </div>
        ))}
      </div>
      <div style={{ color: "#9db3a8", fontSize: "12px", marginTop: "8px" }}>
        Disponible dès que les ventes existeront.
      </div>

      <div style={{ ...card, marginTop: "22px" }}>
        <h3 style={{ margin: "0 0 8px", color: "#172d22", fontSize: "16px" }}>
          Activité récente de l&apos;équipe
        </h3>
        {(audit ?? []).length === 0 && (
          <div style={{ fontSize: "14px", color: "#718078" }}>Aucune activité visible.</div>
        )}
        {(audit ?? []).map((a, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderTop: "1px solid #e5ebe7", fontSize: "13px" }}
          >
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
