import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, payoutMethodLabels } from "@/lib/format";
import PayReward from "./reward-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliation | GOWINMALL Admin" };

type Reward = { id: string; referrer_id: string; order_id: string; amount: number; currency: string; status: string; reference: string | null; created_at: string; paid_at: string | null };

const card: React.CSSProperties = { background: "white", borderRadius: "14px", padding: "16px", marginBottom: "12px" };

function Frame({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#101b17", padding: "22px 16px 40px", fontFamily: "var(--font-dm-sans)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

function total(rows: Reward[]): string {
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.currency] = (totals[r.currency] ?? 0) + Number(r.amount);
  const parts = Object.entries(totals).map(([c, a]) => formatPrice(a, c));
  return parts.length > 0 ? parts.join(" · ") : "0";
}

export default async function AdminAffiliationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (!role) redirect("/");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin");

  const back = (
    <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
      ← Retour à l&apos;administration
    </a>
  );

  if (role !== "owner") {
    return (
      <Frame>
        {back}
        <div style={{ ...card, marginTop: "16px" }}>Le versement des récompenses est réservé au propriétaire.</div>
      </Frame>
    );
  }

  const { data } = await supabase
    .from("affiliate_rewards")
    .select("id, referrer_id, order_id, amount, currency, status, reference, created_at, paid_at")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(200);
  const rewards = (data ?? []) as Reward[];
  const due = rewards.filter((r) => r.status === "due");
  const paid = rewards.filter((r) => r.status === "paid");

  const ids = Array.from(new Set(rewards.map((r) => r.referrer_id)));
  const names = new Map<string, string>();
  const payouts = new Map<string, { method: string; account: string; holder_name: string }>();
  if (ids.length > 0) {
    const [profs, details] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, phone").in("id", ids),
      supabase.from("seller_payout_details").select("user_id, method, account, holder_name").in("user_id", ids),
    ]);
    (profs.data ?? []).forEach((p) => {
      const full = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur";
      names.set(p.id, p.phone ? `${full} (${p.phone})` : full);
    });
    (details.data ?? []).forEach((d) => payouts.set(d.user_id, d));
  }

  return (
    <Frame>
      {back}
      <h1 style={{ color: "white", fontSize: "24px", margin: "14px 0 6px" }}>Récompenses d&apos;affiliation</h1>
      <p style={{ color: "#9db3a8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 18px" }}>
        Chaque récompense est prise sur votre commission. Envoyez l&apos;argent à l&apos;affilié, puis marquez la récompense comme versée.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "12px" }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontSize: "12px", color: "#718078" }}>À verser</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#b18a35" }}>{total(due)}</div>
        </div>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontSize: "12px", color: "#718078" }}>Déjà versé</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#087443" }}>{total(paid)}</div>
        </div>
      </div>

      <h2 style={{ color: "white", fontSize: "17px", margin: "22px 0 10px" }}>À verser ({due.length})</h2>
      {due.length === 0 ? (
        <div style={card}>Aucune récompense à verser.</div>
      ) : (
        due.map((r) => {
          const p = payouts.get(r.referrer_id);
          return (
            <div key={r.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <strong style={{ color: "#172d22" }}>{names.get(r.referrer_id) ?? "Utilisateur"}</strong>
                <strong style={{ color: "#126b52" }}>{formatPrice(r.amount, r.currency)}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#68766e", marginTop: "4px", lineHeight: 1.5 }}>
                {p ? (
                  <>
                    Envoyer à : {payoutMethodLabels[p.method] ?? p.method} · {p.account} · {p.holder_name}
                  </>
                ) : (
                  "Cet affilié n'a pas encore enregistré ses coordonnées de reversement."
                )}
              </div>
              <PayReward rewardId={r.id} amountLabel={formatPrice(r.amount, r.currency)} />
            </div>
          );
        })
      )}

      <h2 style={{ color: "white", fontSize: "17px", margin: "22px 0 10px" }}>Déjà versées</h2>
      {paid.length === 0 ? (
        <div style={card}>Aucune récompense versée pour le moment.</div>
      ) : (
        paid.slice(0, 30).map((r) => (
          <div key={r.id} style={{ ...card, display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", fontSize: "14px" }}>
            <span>
              {names.get(r.referrer_id) ?? "Utilisateur"}
              {r.reference ? ` · réf. ${r.reference}` : ""}
            </span>
            <strong>{formatPrice(r.amount, r.currency)}</strong>
          </div>
        ))
      )}
    </Frame>
  );
}
