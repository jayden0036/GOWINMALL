import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { commissionOf, formatPrice, formatRate } from "@/lib/format";
import { orderCode, orderStatusLabels } from "@/lib/order-labels";
import { missionStatusLabels } from "@/lib/mission-labels";
import { Badge, BORDER, card, formatDate, ghostButton, GREEN, h2, MUTED, primaryButton, Shell, sub, TEXT } from "../../dashboard/ui";
import { ApplyForm, ChooseButton, StepButton } from "./mission-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mission | GOWINMALL" };

type Mission = {
  id: string;
  client_id: string;
  worker_id: string | null;
  order_id: string | null;
  title: string;
  description: string;
  price_amount: number;
  currency: string;
  status: string;
  deadline_at: string | null;
  created_at: string;
};

type Applicant = { worker_id: string; display_name: string; city: string; message: string | null; status: string; created_at: string };

function Notice({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <section style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
        <strong style={{ color: TEXT }}>{title}</strong>
        <div style={{ color: MUTED }}>{text}</div>
      </div>
      {action}
    </section>
  );
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("missions")
    .select("id, client_id, worker_id, order_id, title, description, price_amount, currency, status, deadline_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const m = data as Mission;

  const isClient = m.client_id === user.id;
  const isWorker = m.worker_id === user.id;
  const visitor = !isClient && !isWorker;

  const [nameRes, feeRes, orderRes, applicantsRes, myAppRes, identityRes] = await Promise.all([
    supabase.rpc("get_mission_client_name", { p_mission_id: m.id }),
    supabase.from("fee_schedule").select("rate_bps").eq("offer_type", "service").maybeSingle(),
    m.order_id ? supabase.from("orders").select("id, status, seller_amount").eq("id", m.order_id).maybeSingle() : Promise.resolve({ data: null }),
    isClient && m.status === "open" ? supabase.rpc("get_mission_applicants", { p_mission_id: m.id }) : Promise.resolve({ data: [] }),
    visitor ? supabase.from("mission_applications").select("id").eq("mission_id", m.id).eq("worker_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    visitor ? supabase.from("identity_documents").select("status").eq("user_id", user.id).eq("status", "approved").limit(1) : Promise.resolve({ data: [] }),
  ]);

  const clientName = (nameRes.data as string | null) || "Un client GOWINMALL";
  const rateBps = (feeRes.data as { rate_bps: number } | null)?.rate_bps ?? 0;
  const order = orderRes.data as { id: string; status: string; seller_amount: number | null } | null;
  const applicants = ((applicantsRes.data ?? []) as Applicant[]).filter((a) => a.status !== "rejected");
  const alreadyApplied = Boolean(myAppRes.data);
  const verified = ((identityRes.data ?? []) as unknown[]).length > 0;
  const orderPaid = order?.status === "paid" || order?.status === "completed";
  const workerGets = order?.seller_amount ?? m.price_amount - commissionOf(m.price_amount, rateBps);

  return (
    <Shell active="missions">
      <a href="/missions" style={{ color: MUTED, fontSize: "13px", fontWeight: 600 }}>
        ← Retour aux missions
      </a>

      <section style={{ ...card, marginTop: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "22px", color: TEXT, minWidth: 0 }}>{m.title}</h1>
          <Badge tone={m.status === "completed" ? "ok" : m.status === "cancelled" ? "bad" : "wait"}>{missionStatusLabels[m.status] ?? m.status}</Badge>
        </div>
        <div style={{ margin: "6px 0 14px", fontSize: "13px", color: MUTED }}>
          Par {clientName} · publiée le {formatDate(m.created_at)}
          {m.deadline_at ? ` · à rendre pour le ${formatDate(m.deadline_at)}` : ""}
        </div>
        <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "12px", color: MUTED, fontWeight: 600 }}>Prix de la mission</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: TEXT }}>{formatPrice(m.price_amount, m.currency)}</div>
          </div>
          {!isClient && (
            <div>
              <div style={{ fontSize: "12px", color: MUTED, fontWeight: 600 }}>{isWorker ? "Vous recevrez" : "Le travailleur reçoit"}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: GREEN }}>{formatPrice(workerGets, m.currency)}</div>
              <div style={{ fontSize: "12px", color: MUTED }}>après la commission de {formatRate(rateBps)}</div>
            </div>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: TEXT, whiteSpace: "pre-wrap" }}>{m.description}</p>
      </section>

      {/* ---- Côté client ---- */}
      {isClient && m.status === "open" && (
        <section style={card}>
          <h2 style={h2}>Candidatures ({applicants.length})</h2>
          <p style={sub}>Choisissez la personne qui réalisera votre mission. Vous ne payez qu&apos;après ce choix.</p>
          {applicants.length === 0 ? (
            <p style={{ ...sub, margin: 0 }}>Personne n&apos;a encore postulé.</p>
          ) : (
            applicants.map((a, i) => (
              <div key={a.worker_id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}`, fontSize: "14px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: TEXT }}>
                    {a.display_name || "Candidat"}
                    {a.city ? <span style={{ color: MUTED, fontWeight: 500 }}> · {a.city}</span> : null}
                  </div>
                  {a.message && <div style={{ color: MUTED, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{a.message}</div>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <ChooseButton missionId={m.id} workerId={a.worker_id} name={a.display_name || "ce candidat"} />
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: "12px" }}>
            <StepButton missionId={m.id} fn="cancel_mission" label="Annuler la mission" confirmText="Annuler cette mission ?" ghost />
          </div>
        </section>
      )}

      {isClient && m.status === "assigned" && order && (
        orderPaid ? (
          <Notice title="Paiement confirmé" text="Le travailleur peut commencer. Vous serez prévenu dès qu'il livrera son travail." />
        ) : (
          <Notice
            title="Payez la commande pour lancer la mission"
            text={`Commande ${orderCode(order.id)} : ${orderStatusLabels[order.status] ?? order.status}. Le travailleur commence dès que GOWINMALL a confirmé votre paiement.`}
            action={
              <a href={`/commandes/${order.id}`} style={primaryButton}>
                Payer la commande
              </a>
            }
          />
        )
      )}

      {isClient && m.status === "delivered" && (
        <section style={card}>
          <h2 style={h2}>Le travail est livré</h2>
          <p style={sub}>Vérifiez le résultat avec le travailleur. En validant, vous confirmez que la mission est terminée et GOWINMALL pourra le payer.</p>
          <StepButton missionId={m.id} fn="validate_mission" label="Valider le travail" confirmText="Valider le travail ? Le travailleur pourra alors être payé." />
        </section>
      )}

      {/* ---- Côté travailleur ---- */}
      {isWorker && m.status === "assigned" && (
        orderPaid ? (
          <section style={card}>
            <h2 style={h2}>À vous de jouer</h2>
            <p style={sub}>Le client a payé. Réalisez la mission, puis signalez que vous avez livré. Échangez avec le client pour lui remettre votre travail.</p>
            <StepButton missionId={m.id} fn="deliver_mission" label="J'ai livré le travail" confirmText="Confirmer que vous avez livré le travail ?" />
          </section>
        ) : (
          <Notice title="En attente du paiement du client" text="Ne commencez pas avant la confirmation du paiement : vous recevrez une notification." />
        )
      )}
      {isWorker && m.status === "delivered" && <Notice title="Livré" text="Le client doit maintenant valider votre travail." />}
      {isWorker && m.status === "completed" && (
        <Notice
          title="Mission validée"
          text="Votre paiement est maintenant à recevoir : suivez-le dans votre portefeuille."
          action={
            <a href="/portefeuille" style={ghostButton}>
              Voir le portefeuille
            </a>
          }
        />
      )}

      {/* ---- Visiteur ---- */}
      {visitor && m.status === "open" && (
        <section style={card}>
          <h2 style={h2}>Postuler</h2>
          {alreadyApplied ? (
            <p style={{ ...sub, margin: 0 }}>Vous avez déjà postulé. Le client vous préviendra s&apos;il vous choisit.</p>
          ) : !verified ? (
            <>
              <p style={sub}>Vérifiez votre identité pour pouvoir postuler et recevoir votre paiement.</p>
              <a href="/verification" style={primaryButton}>
                Vérifier mon identité
              </a>
            </>
          ) : (
            <ApplyForm missionId={m.id} />
          )}
        </section>
      )}
    </Shell>
  );
}
