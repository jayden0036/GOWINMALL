import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { orderCode, orderStatusLabels } from "@/lib/order-labels";
import { BORDER, card, formatDate, ghostButton, GREEN, h2, Kpi, MUTED, primaryButton, Shell, sub, sumByCurrency, TEXT } from "./ui";
import SettingsView from "./settings";
import type { IdentityDoc, Profile } from "./settings";

export const metadata = { title: "Mon compte | GOWINMALL" };
export const dynamic = "force-dynamic";

type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  offer_title: string;
  unit_amount: number;
  seller_amount: number | null;
  currency: string;
  status: string;
  payout_status: string;
  payout_reference: string | null;
  payout_paid_at: string | null;
  created_at: string;
};

type SearchParams = { section?: string; ok?: string; erreur?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { section, ok, erreur } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, docsRes, ordersRes, offersRes, payoutRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, post_name, phone, city, country, account_type, accepted_terms_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("identity_documents")
      .select("doc_type, status, rejection_reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, buyer_id, seller_id, offer_title, unit_amount, seller_amount, currency, status, payout_status, payout_reference, payout_paid_at, created_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("offers").select("id, status").eq("seller_id", user.id),
    supabase.from("seller_payout_details").select("method, account, holder_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = (profileRes.data ?? null) as Profile | null;
  const documents = (docsRes.data ?? []) as IdentityDoc[];
  const orders = (ordersRes.data ?? []) as Order[];
  const offers = (offersRes.data ?? []) as { id: string; status: string }[];
  const payout = (payoutRes.data ?? null) as { method: string; account: string; holder_name: string } | null;

  const approved = documents.some((d) => d.status === "approved");
  const latestDoc = documents[0];
  const identity: "ok" | "wait" | "bad" | "todo" = approved
    ? "ok"
    : latestDoc?.status === "pending"
      ? "wait"
      : latestDoc?.status === "rejected"
        ? "bad"
        : "todo";

  const emailConfirmed = Boolean(user.email_confirmed_at);
  const firstName = profile?.first_name?.trim() ?? "";
  const missing: string[] = [];
  if (!firstName) missing.push("prénom");
  if (!profile?.phone) missing.push("téléphone");
  if (!profile?.city) missing.push("ville");

  const purchases = orders.filter((o) => o.buyer_id === user.id);
  const sales = orders.filter((o) => o.seller_id === user.id);
  const isSeller = offers.length > 0 || sales.length > 0;

  if (section === "parametres") {
    return (
      <SettingsView
        profile={profile}
        email={user.email ?? ""}
        emailConfirmed={emailConfirmed}
        identity={identity}
        latestDoc={latestDoc}
        payout={payout}
        ok={ok}
        erreur={erreur}
      />
    );
  }

  const inProgress = purchases.filter((o) => ["pending_payment", "payment_declared", "paid"].includes(o.status));
  const completed = purchases.filter((o) => o.status === "completed");
  const paidPurchases = purchases.filter((o) => ["paid", "completed"].includes(o.status));
  const soldOrders = sales.filter((o) => ["paid", "completed"].includes(o.status));
  const toReceive = sales.filter((o) => o.payout_status === "due");
  const alreadyPaid = sales.filter((o) => o.payout_status === "paid");
  const publishedOffers = offers.filter((o) => o.status === "published").length;
  const payoutHistory = alreadyPaid
    .slice()
    .sort((a, b) => new Date(b.payout_paid_at ?? b.created_at).getTime() - new Date(a.payout_paid_at ?? a.created_at).getTime())
    .slice(0, 20);

  const tasks: { title: string; text: string; href?: string; cta?: string }[] = [];
  if (!emailConfirmed) {
    tasks.push({ title: "Confirmez votre adresse e-mail", text: `Un message de confirmation a été envoyé à ${user.email}.` });
  }
  if (missing.length > 0) {
    tasks.push({
      title: "Complétez votre profil",
      text: `À renseigner : ${missing.join(", ")}.`,
      href: "/dashboard?section=parametres",
      cta: "Compléter",
    });
  }
  if (identity === "todo" || identity === "bad") {
    tasks.push({
      title: identity === "bad" ? "Renvoyez un document d'identité" : "Faites vérifier votre identité",
      text: identity === "bad" ? "Votre dernier document a été refusé." : "Nécessaire pour publier des offres.",
      href: "/verification",
      cta: "Envoyer",
    });
  }
  if (identity === "wait") {
    tasks.push({ title: "Identité en cours de vérification", text: "Notre équipe examine votre document." });
  }
  if (isSeller && !payout) {
    tasks.push({
      title: "Ajoutez vos coordonnées de reversement",
      text: "Pour recevoir l'argent de vos ventes.",
      href: "/vendre/paiement",
      cta: "Ajouter",
    });
  }

  const recent = orders.slice(0, 5);

  return (
    <Shell active="apercu">
      <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>
        {firstName ? `Bonjour ${firstName}` : "Bonjour"}
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>Voici où en est votre activité sur GOWINMALL.</p>

      <section style={card}>
        <h2 style={h2}>À faire</h2>
        {tasks.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Tout est en ordre sur votre compte.</p>
        ) : (
          <div>
            {tasks.map((t, i) => (
              <div
                key={t.title}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                }}
              >
                <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
                  <strong style={{ color: TEXT }}>{t.title}</strong>
                  <div style={{ color: MUTED }}>{t.text}</div>
                </div>
                {t.href && t.cta && (
                  <a href={t.href} style={{ ...primaryButton, padding: "9px 14px", fontSize: "13px", flexShrink: 0 }}>
                    {t.cta}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 style={{ ...h2, margin: "20px 0 10px" }}>Mes achats</h2>
      <div className="kpis" style={{ marginBottom: "8px" }}>
        <Kpi label="Commandes en cours" value={inProgress.length} />
        <Kpi label="Achats terminés" value={completed.length} />
        <Kpi label="Total payé" value={sumByCurrency(paidPurchases.map((o) => ({ currency: o.currency, amount: Number(o.unit_amount) })))} />
      </div>

      {isSeller && (
        <>
          <h2 style={{ ...h2, margin: "20px 0 10px" }}>Mes ventes</h2>
          <div className="kpis" style={{ marginBottom: "8px" }}>
            <Kpi label="Offres publiées" value={publishedOffers} hint={`${offers.length} au total`} />
            <Kpi label="Ventes" value={soldOrders.length} />
            <Kpi
              label="À recevoir"
              value={sumByCurrency(toReceive.map((o) => ({ currency: o.currency, amount: Number(o.seller_amount ?? 0) })))}
            />
            <Kpi
              label="Déjà reversé"
              value={sumByCurrency(alreadyPaid.map((o) => ({ currency: o.currency, amount: Number(o.seller_amount ?? 0) })))}
            />
          </div>
          <section style={{ ...card, marginTop: "12px" }}>
            <h2 style={{ ...h2, marginBottom: "6px" }}>Historique des reversements</h2>
            {payoutHistory.length === 0 ? (
              <p style={{ ...sub, margin: 0 }}>Aucun reversement reçu pour le moment.</p>
            ) : (
              payoutHistory.map((o, i) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                    fontSize: "14px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: TEXT }}>{o.offer_title}</div>
                    <div style={{ color: MUTED, fontSize: "12px" }}>
                      {orderCode(o.id)} · reversé le {formatDate(o.payout_paid_at ?? o.created_at)}
                      {o.payout_reference ? ` · réf. ${o.payout_reference}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: GREEN, flexShrink: 0 }}>
                    {formatPrice(Number(o.seller_amount ?? 0), o.currency)}
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      <section style={{ ...card, marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ ...h2, margin: 0 }}>Dernières commandes</h2>
          {recent.length > 0 && (
            <a href="/commandes" style={{ color: GREEN, fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
              Tout voir
            </a>
          )}
        </div>
        {recent.length === 0 ? (
          <p style={{ ...sub, margin: "6px 0 14px" }}>Aucune commande pour le moment.</p>
        ) : (
          recent.map((o, i) => {
            const isPurchase = o.buyer_id === user.id;
            const amount = isPurchase ? Number(o.unit_amount) : Number(o.seller_amount ?? 0);
            return (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                  fontSize: "14px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: TEXT }}>{o.offer_title}</div>
                  <div style={{ color: MUTED, fontSize: "12px" }}>
                    {isPurchase ? "Achat" : "Vente"} · {orderCode(o.id)} · {formatDate(o.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: TEXT }}>{formatPrice(amount, o.currency)}</div>
                  <div style={{ color: MUTED, fontSize: "12px" }}>{orderStatusLabels[o.status] ?? o.status}</div>
                </div>
              </div>
            );
          })
        )}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
          <a href="/catalogue" style={ghostButton}>
            Parcourir le catalogue
          </a>
          <a href="/vendre" style={primaryButton}>
            Publier une offre
          </a>
        </div>
      </section>
    </Shell>
  );
                                  }
          
