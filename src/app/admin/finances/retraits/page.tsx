import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { CancelWithdrawalButton, WithdrawalForm } from "./withdrawal-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retraits de commission | GOWINMALL" };

const GREEN = "#126b52";
const AMBER = "#b18a35";
const MUTED = "#718078";
const BORDER = "#e5ebe7";

type Summary = { currency: string; earned: number; withdrawn: number; to_reverse: number };

type Withdrawal = {
  id: string;
  currency: string;
  amount: number;
  method: string;
  reference: string;
  note: string;
  withdrawn_at: string;
  created_at: string;
  cancelled_at: string | null;
};

const card: CSSProperties = { background: "white", borderRadius: "14px", padding: "18px" };

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

function Line({ label, value, color = "#172b25", strong }: { label: string; value: ReactNode; color?: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderTop: `1px solid ${BORDER}`, fontSize: "14px" }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color, fontWeight: strong ? 800 : 600 }}>{value}</span>
    </div>
  );
}

export default async function WithdrawalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (role !== "owner") redirect("/admin");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin");

  const [summaryRes, listRes] = await Promise.all([
    supabase.rpc("commission_summary"),
    supabase
      .from("commission_withdrawals")
      .select("id, currency, amount, method, reference, note, withdrawn_at, created_at, cancelled_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const summary = ((summaryRes.data ?? []) as Summary[]).map((s) => ({
    currency: s.currency,
    earned: Number(s.earned),
    withdrawn: Number(s.withdrawn),
    toReverse: Number(s.to_reverse),
  }));
  const withdrawals = (listRes.data ?? []) as Withdrawal[];

  const available: Record<string, number> = {};
  for (const s of summary) available[s.currency] = Math.max(0, s.earned - s.withdrawn);

  const hasActivity = summary.some((s) => s.earned > 0 || s.withdrawn > 0 || s.toReverse > 0);

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
      <div style={{ maxWidth: "960px", margin: "auto" }}>
        <div style={{ color: "white", marginBottom: "16px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800 }}>
            GOWIN <span style={{ color: "#f5a623" }}>ADMIN</span>
          </div>
          <div style={{ fontSize: "13px", color: "#9db3a8" }}>Retraits de commission</div>
        </div>

        <nav style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} aria-label="Administration">
          <Tab href="/admin" label="Vue d'ensemble" />
          <Tab href="/admin/finances" label="Finances" />
          <Tab href="/admin/finances/retraits" label="Retraits" active />
          <Tab href="/admin/statistiques" label="Statistiques" />
        </nav>

        <h2 style={{ color: "white", margin: "26px 0 10px", fontSize: "17px" }}>Ma commission</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {summary.map((s) => (
            <div key={s.currency} style={card}>
              <div style={{ fontWeight: 800, color: "#172b25", marginBottom: "6px" }}>
                {s.currency === "USD" ? "Dollars (USD)" : "Francs congolais (CDF)"}
              </div>
              <Line label="Commission acquise" value={formatPrice(s.earned, s.currency)} />
              <Line label="Déjà retirée" value={formatPrice(s.withdrawn, s.currency)} />
              <Line label="Disponible à retirer" value={formatPrice(available[s.currency] ?? 0, s.currency)} color={GREEN} strong />
              <Line label="À reverser aux vendeurs" value={formatPrice(s.toReverse, s.currency)} color={AMBER} />
            </div>
          ))}
        </div>
        <p style={{ color: "#9db3a8", fontSize: "13px", lineHeight: 1.6, margin: "12px 0 0" }}>
          La commission est acquise quand la commande est terminée. Ne retirez pas plus que le montant disponible : une partie de l&apos;argent de vos comptes appartient aux vendeurs.
          {!hasActivity && " Il n'y a pas encore de commission, les chiffres resteront à zéro jusqu'aux premières ventes terminées."}
        </p>

        <h2 style={{ color: "white", margin: "26px 0 10px", fontSize: "17px" }}>Enregistrer un retrait</h2>
        <div style={card}>
          <p style={{ margin: "0 0 14px", fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>
            Notez ici chaque somme que vous prenez sur vos comptes de réception. Le site refuse un montant supérieur à votre commission disponible.
          </p>
          <WithdrawalForm available={available} />
        </div>

        <h2 style={{ color: "white", margin: "26px 0 10px", fontSize: "17px" }}>Journal des retraits</h2>
        <div style={card}>
          {withdrawals.length === 0 ? (
            <div style={{ color: MUTED, fontSize: "14px" }}>Aucun retrait enregistré pour le moment.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "620px" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: MUTED }}>
                    <th style={{ padding: "8px" }}>Date</th>
                    <th style={{ padding: "8px" }}>Montant</th>
                    <th style={{ padding: "8px" }}>Moyen</th>
                    <th style={{ padding: "8px" }}>Référence et note</th>
                    <th style={{ padding: "8px" }} />
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => {
                    const cancelled = Boolean(w.cancelled_at);
                    return (
                      <tr key={w.id} style={{ borderTop: `1px solid ${BORDER}`, opacity: cancelled ? 0.55 : 1 }}>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{new Date(w.withdrawn_at).toLocaleDateString("fr-FR")}</td>
                        <td style={{ padding: "8px", fontWeight: 700, textDecoration: cancelled ? "line-through" : "none" }}>
                          {formatPrice(Number(w.amount), w.currency)}
                        </td>
                        <td style={{ padding: "8px" }}>{w.method || "—"}</td>
                        <td style={{ padding: "8px" }}>{[w.reference, w.note].filter(Boolean).join(" · ") || "—"}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          {cancelled ? (
                            <span style={{ fontSize: "12px", color: "#b3261e", fontWeight: 700 }}>
                              Annulé le {new Date(w.cancelled_at as string).toLocaleDateString("fr-FR")}
                            </span>
                          ) : (
                            <CancelWithdrawalButton id={w.id} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
  
