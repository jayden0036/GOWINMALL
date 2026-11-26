import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { walletKindLabels, walletStateLabels } from "@/lib/mission-labels";
import { Badge, BORDER, card, formatDate, GREEN, h2, Kpi, MUTED, primaryButton, Shell, sub, TEXT } from "../dashboard/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portefeuille | GOWINMALL" };

type Wallet = {
  currency: string;
  pending: number;
  due: number;
  received: number;
  affiliate_due: number;
  affiliate_received: number;
};

type Item = {
  kind: string;
  title: string;
  amount: number;
  currency: string;
  state: string;
  reference: string | null;
  occurred_at: string;
};

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [walletRes, itemsRes, payoutRes] = await Promise.all([
    supabase.rpc("my_wallet"),
    supabase.rpc("my_wallet_items"),
    supabase.from("seller_payout_details").select("method").eq("user_id", user.id).maybeSingle(),
  ]);

  const wallets = ((walletRes.data ?? []) as Wallet[]).filter(
    (w) => w.pending + w.due + w.received + w.affiliate_due + w.affiliate_received > 0
  );
  const items = (itemsRes.data ?? []) as Item[];
  const hasPayout = Boolean(payoutRes.data);
  const tone = { en_attente: "wait", a_recevoir: "todo", recu: "ok" } as const;

  return (
    <Shell active="portefeuille">
      <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Portefeuille</h1>
      <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>
        Vos gains, calculés en direct à partir de vos ventes, missions et récompenses.
      </p>

      {!hasPayout && (
        <section style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            <strong style={{ color: TEXT }}>Ajoutez vos coordonnées de reversement</strong>
            <div style={{ color: MUTED }}>Sans elles, GOWINMALL ne peut pas vous envoyer votre argent.</div>
          </div>
          <a href="/vendre/paiement" style={primaryButton}>
            Ajouter
          </a>
        </section>
      )}

      {wallets.length === 0 ? (
        <section style={card}>
          <h2 style={h2}>Rien à afficher pour le moment</h2>
          <p style={{ ...sub, margin: 0 }}>
            Vos gains apparaîtront ici dès qu&apos;un client aura payé une vente ou une mission.
          </p>
        </section>
      ) : (
        wallets.map((w) => (
          <div key={w.currency} style={{ marginBottom: "10px" }}>
            <h2 style={{ ...h2, margin: "6px 0 10px" }}>{w.currency === "USD" ? "Dollars (USD)" : "Francs congolais (FC)"}</h2>
            <div className="kpis">
              <Kpi label="En attente" value={formatPrice(w.pending, w.currency)} hint="Le client a payé, le travail est à valider" />
              <Kpi label="À recevoir" value={formatPrice(w.due, w.currency)} hint="Validé : GOWINMALL doit vous l'envoyer" />
              <Kpi label="Déjà reçu" value={formatPrice(w.received, w.currency)} />
              {(w.affiliate_due > 0 || w.affiliate_received > 0) && (
                <>
                  <Kpi label="Affiliation à recevoir" value={formatPrice(w.affiliate_due, w.currency)} />
                  <Kpi label="Affiliation reçue" value={formatPrice(w.affiliate_received, w.currency)} />
                </>
              )}
            </div>
          </div>
        ))
      )}

      <section style={{ ...card, marginTop: "16px" }}>
        <h2 style={{ ...h2, marginBottom: "6px" }}>Détail</h2>
        {items.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Aucun mouvement pour le moment.</p>
        ) : (
          items.map((it, i) => (
            <div
              key={`${it.kind}-${it.occurred_at}-${i}`}
              style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}`, fontSize: "14px" }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: TEXT }}>{it.title}</div>
                <div style={{ color: MUTED, fontSize: "12px" }}>
                  {walletKindLabels[it.kind] ?? it.kind} · {formatDate(it.occurred_at)}
                  {it.reference ? ` · réf. ${it.reference}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: GREEN }}>{formatPrice(it.amount, it.currency)}</div>
                <Badge tone={tone[it.state as keyof typeof tone] ?? "todo"}>{walletStateLabels[it.state] ?? it.state}</Badge>
              </div>
            </div>
          ))
        )}
      </section>

      <p style={{ ...sub, marginTop: "8px" }}>
        Les reversements sont envoyés manuellement par l&apos;équipe GOWINMALL : un délai est possible entre la validation et la réception.
      </p>
    </Shell>
  );
}
