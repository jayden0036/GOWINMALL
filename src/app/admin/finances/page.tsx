import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatRate, offerTypeLabels, payoutMethodLabels } from "@/lib/format";
import { orderCode, orderStatusLabels } from "@/lib/order-labels";
import { ConfirmButtons, FeeForm, PayoutButton } from "./finance-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finances | GOWINMALL Admin" };

type Order = {
  id: string;
  offer_title: string;
  buyer_id: string;
  seller_id: string;
  unit_amount: number;
  seller_amount: number | null;
  commission_amount: number | null;
  currency: string;
  status: string;
  payment_reference: string | null;
  payout_status: string;
  created_at: string;
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "12px",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
};

const sectionTitle: React.CSSProperties = {
  color: "white",
  margin: "24px 0 10px",
  fontSize: "17px",
};

const meta: React.CSSProperties = {
  fontSize: "13px",
  color: "#68766e",
  marginTop: "4px",
  lineHeight: 1.5,
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#101b17", padding: "18px 14px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

function Stat({ label, value, color = "#087443" }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ ...card, marginBottom: 0 }}>
      <div style={{ fontSize: "12px", color: "#718078" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

export default async function FinancesPage() {
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
        <div style={{ ...card, marginTop: "16px" }}>Les finances sont réservées aux administrateurs.</div>
      </Shell>
    );
  }
  const isOwner = role === "owner";

  await supabase.rpc("log_admin_action", { p_action: "consultation_finances" });

  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      "id, offer_title, buyer_id, seller_id, unit_amount, seller_amount, commission_amount, currency, status, payment_reference, payout_status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);
  const orders = (ordersData ?? []) as Order[];

  const ids = Array.from(new Set(orders.flatMap((o) => [o.buyer_id, o.seller_id])));
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .in("id", ids);
    (profs ?? []).forEach((p) => {
      const full = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur";
      names.set(p.id, p.phone ? `${full} (${p.phone})` : full);
    });
  }

  const payouts = new Map<string, { method: string; account: string; holder_name: string }>();
  if (isOwner && ids.length > 0) {
    const { data: details } = await supabase
      .from("seller_payout_details")
      .select("user_id, method, account, holder_name")
      .in("user_id", ids);
    (details ?? []).forEach((d) => payouts.set(d.user_id, d));
  }

  const { data: feesData } = await supabase
    .from("fee_schedule")
    .select("offer_type, rate_bps")
    .order("offer_type");
  const fees = feesData ?? [];

  const totals = new Map<string, { volume: number; commission: number; due: number; paid: number }>();
  for (const o of orders) {
    if (o.status !== "paid" && o.status !== "completed") continue;
    const t = totals.get(o.currency) ?? { volume: 0, commission: 0, due: 0, paid: 0 };
    t.volume += o.unit_amount;
    t.commission += o.commission_amount ?? 0;
    if (o.payout_status === "due") t.due += o.seller_amount ?? 0;
    if (o.payout_status === "paid") t.paid += o.seller_amount ?? 0;
    totals.set(o.currency, t);
  }
  const currencies = Array.from(totals.entries());

  const toConfirm = orders
    .filter((o) => o.status === "payment_declared" || o.status === "pending_payment")
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "payment_declared" ? -1 : 1));
  const dueList = orders.filter((o) => o.payout_status === "due");
  const recent = orders.slice(0, 15);

  return (
    <Shell>
      <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
        ← Retour à l&apos;administration
      </a>
      <div style={{ color: "white", fontSize: "22px", fontWeight: 800, margin: "10px 0 14px" }}>Finances</div>

      {currencies.length === 0 ? (
        <div style={card}>Aucune vente confirmée pour le moment.</div>
      ) : (
        currencies.map(([currency, t]) => (
          <div key={currency} style={{ marginBottom: "12px" }}>
            <div style={{ color: "#9db3a8", fontSize: "13px", marginBottom: "6px" }}>Devise : {currency}</div>
            <div style={grid}>
              <Stat label="Volume des ventes" value={formatPrice(t.volume, currency)} />
              <Stat label="Mes commissions" value={formatPrice(t.commission, currency)} />
              <Stat label="À reverser aux vendeurs" value={formatPrice(t.due, currency)} color="#b18a35" />
              <Stat label="Déjà reversé" value={formatPrice(t.paid, currency)} color="#718078" />
            </div>
          </div>
        ))
      )}

      <h3 style={sectionTitle}>Paiements à confirmer ({toConfirm.length})</h3>
      {toConfirm.length === 0 && <div style={card}>Aucun paiement en attente.</div>}
      {toConfirm.map((o) => (
        <div key={o.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <strong>{o.offer_title}</strong>
            <strong style={{ whiteSpace: "nowrap", color: "#087443" }}>{formatPrice(o.unit_amount, o.currency)}</strong>
          </div>
          <div style={meta}>
            {orderCode(o.id)} · {orderStatusLabels[o.status] ?? o.status} ·{" "}
            {new Date(o.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })}
          </div>
          <div style={meta}>Acheteur : {names.get(o.buyer_id) ?? "—"}</div>
          {o.payment_reference && (
            <div style={meta}>
              Référence déclarée : <strong>{o.payment_reference}</strong>
            </div>
          )}
          <ConfirmButtons
            orderId={o.id}
            amountLabel={formatPrice(o.unit_amount, o.currency)}
            declared={o.status === "payment_declared"}
          />
        </div>
      ))}

      <h3 style={sectionTitle}>Reversements à effectuer ({dueList.length})</h3>
      {dueList.length === 0 && <div style={card}>Aucun reversement dû.</div>}
      {dueList.map((o) => {
        const d = payouts.get(o.seller_id);
        return (
          <div key={o.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <strong>{o.offer_title}</strong>
              <strong style={{ whiteSpace: "nowrap", color: "#b18a35" }}>
                {formatPrice(o.seller_amount ?? 0, o.currency)}
              </strong>
            </div>
            <div style={meta}>
              {orderCode(o.id)} · prix {formatPrice(o.unit_amount, o.currency)} · commission retenue{" "}
              {formatPrice(o.commission_amount ?? 0, o.currency)}
            </div>
            <div style={meta}>Vendeur : {names.get(o.seller_id) ?? "—"}</div>
            <div style={meta}>
              {d ? (
                <>
                  Envoyer à : <strong>{payoutMethodLabels[d.method] ?? d.method}</strong> · {d.account} ·{" "}
                  {d.holder_name}
                </>
              ) : isOwner ? (
                "Le vendeur n'a pas renseigné ses coordonnées de reversement."
              ) : (
                "Coordonnées visibles par le propriétaire."
              )}
            </div>
            {isOwner && <PayoutButton orderId={o.id} amountLabel={formatPrice(o.seller_amount ?? 0, o.currency)} />}
          </div>
        );
      })}

      <h3 style={sectionTitle}>Taux de commission</h3>
      {fees.map((f) => (
        <div key={f.offer_type} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <strong>{offerTypeLabels[f.offer_type] ?? f.offer_type}</strong>
          {isOwner ? <FeeForm type={f.offer_type} bps={f.rate_bps} /> : <strong>{formatRate(f.rate_bps)}</strong>}
        </div>
      ))}
      <div style={{ color: "#9db3a8", fontSize: "12px" }}>
        Un nouveau taux s&apos;applique aux nouvelles commandes ; les commandes existantes gardent leur taux.
      </div>

      <h3 style={sectionTitle}>Dernières commandes</h3>
      {recent.length === 0 && <div style={card}>Aucune commande.</div>}
      {recent.map((o) => (
        <div key={o.id} style={{ ...card, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "14px" }}>
            <span>{o.offer_title}</span>
            <strong style={{ whiteSpace: "nowrap" }}>{formatPrice(o.unit_amount, o.currency)}</strong>
          </div>
          <div style={meta}>
            {orderCode(o.id)} · {orderStatusLabels[o.status] ?? o.status} ·{" "}
            {new Date(o.created_at).toLocaleDateString("fr-FR")}
          </div>
        </div>
      ))}
    </Shell>
  );
}
