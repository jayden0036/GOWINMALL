import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { MfaPanel, SignOutButton } from "./mfa-panel";
import { DocumentsPanel } from "./documents-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration | GOWINMALL" };

const GREEN = "#126b52";
const AMBER = "#b18a35";
const MUTED = "#718078";
const BORDER = "#e5ebe7";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  post_name: string;
  phone: string;
  city: string;
  account_type: string;
  created_at: string;
};

type OrderLine = {
  status: string;
  payout_status: string;
  currency: string;
  unit_amount: number;
  commission_amount: number | null;
  seller_amount: number | null;
};

type RewardLine = { amount: number; currency: string; status: string };

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  moderator: "Modérateur",
};

const accountLabels: Record<string, string> = {
  particulier: "Particulier",
  vendeur: "Vendeur",
  entreprise: "Entreprise",
  prestataire: "Prestataire",
  affilie: "Affilié",
};

const card: CSSProperties = {
  background: "white",
  borderRadius: "14px",
  padding: "18px",
};

const sectionTitle: CSSProperties = {
  color: "white",
  margin: "26px 0 10px",
  fontSize: "17px",
};

function Frame({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101b17",
        padding: "22px 16px 40px",
        fontFamily: "var(--font-dm-sans)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "auto" }}>{children}</div>
    </main>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      style={{
        padding: "9px 16px",
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        background: active ? "white" : "transparent",
        color: active ? "#101b17" : "#c5d4cc",
        border: active ? "1px solid white" : "1px solid #2c4137",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

function Kpi({ label, value, color = GREEN }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: "12px", color: MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 800, color, marginTop: "4px", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function sumLines(rows: { currency: string; amount: number }[]): string {
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.currency] = (totals[r.currency] ?? 0) + r.amount;
  const parts = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => formatPrice(amount, currency));
  return parts.length > 0 ? parts.join(" · ") : "0";
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (!role) redirect("/");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel !== "aal2") {
    return (
      <Frame>
        <MfaPanel mode={aal?.nextLevel === "aal2" ? "verify" : "enroll"} />
      </Frame>
    );
  }

  // Affichage seulement : la vraie protection des données est dans la base (RLS).
  const canViewUsers = role === "owner" || role === "admin";
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersRes, newUsersRes, docsRes, offersRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("identity_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("offers").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const pendingDocs = docsRes.count ?? 0;
  const publishedOffers = offersRes.count ?? 0;

  let recent: Row[] = [];
  let orders: OrderLine[] = [];
  let rewards: RewardLine[] = [];

  if (canViewUsers) {
    const [recentRes, ordersRes, rewardsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, post_name, phone, city, account_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("orders")
        .select("status, payout_status, currency, unit_amount, commission_amount, seller_amount")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("affiliate_rewards").select("amount, currency, status").neq("status", "cancelled").limit(1000),
    ]);
    recent = (recentRes.data ?? []) as Row[];
    orders = (ordersRes.data ?? []) as OrderLine[];
    rewards = (rewardsRes.data ?? []) as RewardLine[];

    await supabase.rpc("log_admin_action", {
      p_action: "consultation_liste_utilisateurs",
    });
  }

  const declared = orders.filter((o) => o.status === "payment_declared").length;
  const dueCount = orders.filter((o) => o.payout_status === "due").length;
  const confirmed = orders.filter((o) => o.status === "paid" || o.status === "completed");
  // Commission nette : ce que GOWINMALL garde après les récompenses d'affiliation
  const commission = sumLines([
    ...confirmed.map((o) => ({ currency: o.currency, amount: Number(o.commission_amount ?? 0) })),
    ...rewards.map((r) => ({ currency: r.currency, amount: -Number(r.amount) })),
  ]);
  const dueRewards = rewards.filter((r) => r.status === "due");
  const affiliateDue = sumLines(dueRewards.map((r) => ({ currency: r.currency, amount: Number(r.amount) })));
  const toPayOut = sumLines(
    orders.filter((o) => o.payout_status === "due").map((o) => ({ currency: o.currency, amount: Number(o.seller_amount ?? 0) }))
  );

  const todo: { label: string; count: number; href: string }[] = [
    { label: "Documents d'identité à vérifier", count: pendingDocs, href: "#identite" },
  ];
  if (canViewUsers) {
    todo.push({ label: "Paiements déclarés à confirmer", count: declared, href: "/admin/finances" });
    todo.push({ label: "Reversements à effectuer", count: dueCount, href: "/admin/finances" });
    todo.push({ label: "Récompenses d'affiliation à verser", count: dueRewards.length, href: "/admin/affiliation" });
  }
  const openTasks = todo.filter((t) => t.count > 0);

  return (
    <Frame>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          color: "white",
          marginBottom: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: 800 }}>
            GOWIN <span style={{ color: "#f5a623" }}>ADMIN</span>
          </div>
          <div style={{ fontSize: "13px", color: "#9db3a8" }}>
            {roleLabels[role as string] ?? role} · {user.email}
          </div>
        </div>
        <SignOutButton />
      </div>

      <nav style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} aria-label="Administration">
        <Tab href="/admin" label="Vue d'ensemble" active />
        <Tab href="/admin/finances" label="Finances" />
        {role === "owner" && <Tab href="/admin/finances/retraits" label="Retraits" />}
        <Tab href="/admin/statistiques" label="Statistiques" />
        {role === "owner" && <Tab href="/admin/badges" label="Badges" />}
        {role === "owner" && <Tab href="/admin/affiliation" label="Affiliation" />}
        {role === "owner" && <Tab href="/admin/annonces" label="Annonces" />}
        <Tab href="/" label="Retour au site" />
      </nav>

      <h2 style={sectionTitle}>À traiter</h2>
      <div style={card}>
        {openTasks.length === 0 ? (
          <div style={{ color: MUTED, fontSize: "14px" }}>Rien à traiter pour le moment.</div>
        ) : (
          openTasks.map((t, i) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "11px 0",
                borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                fontSize: "14px",
              }}
            >
              <span style={{ color: "#172b25", fontWeight: 600 }}>{t.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    background: "#fff4df",
                    color: "#9a6a12",
                    fontWeight: 800,
                    fontSize: "13px",
                    padding: "3px 11px",
                    borderRadius: "999px",
                  }}
                >
                  {t.count}
                </span>
                <a href={t.href} style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>
                  Ouvrir
                </a>
              </span>
            </div>
          ))
        )}
      </div>

      <h2 style={sectionTitle}>Chiffres clés</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
        <Kpi label="Inscrits" value={canViewUsers ? usersRes.count ?? 0 : "—"} />
        <Kpi label="Nouveaux (7 jours)" value={canViewUsers ? newUsersRes.count ?? 0 : "—"} />
        <Kpi label="Offres publiées" value={publishedOffers} />
        <Kpi label="Documents en attente" value={pendingDocs} color={AMBER} />
        {canViewUsers && <Kpi label="Commissions nettes" value={commission} />}
        {canViewUsers && <Kpi label="À reverser aux vendeurs" value={toPayOut} color={AMBER} />}
        {canViewUsers && <Kpi label="Affiliation à verser" value={affiliateDue} color={AMBER} />}
      </div>

      <div id="identite" style={{ scrollMarginTop: "16px" }}>
        <DocumentsPanel />
      </div>

      {canViewUsers && (
        <div id="utilisateurs" style={{ ...card, marginTop: "18px", scrollMarginTop: "16px" }}>
          <h3 style={{ marginTop: 0, color: "#172b25" }}>Dernières inscriptions</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "560px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: MUTED }}>
                  <th style={{ padding: "8px" }}>Nom</th>
                  <th style={{ padding: "8px" }}>Téléphone</th>
                  <th style={{ padding: "8px" }}>Ville</th>
                  <th style={{ padding: "8px" }}>Type</th>
                  <th style={{ padding: "8px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "8px" }}>
                      {[p.first_name, p.post_name, p.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td style={{ padding: "8px" }}>{p.phone}</td>
                    <td style={{ padding: "8px" }}>{p.city}</td>
                    <td style={{ padding: "8px" }}>{accountLabels[p.account_type] ?? p.account_type}</td>
                    <td style={{ padding: "8px" }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Frame>
  );
          }
    
