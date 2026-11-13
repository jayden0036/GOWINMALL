import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice, formatRate, offerTypeLabels } from "@/lib/format";
import { orderCode, orderStatusLabels, payoutStatusLabels } from "@/lib/order-labels";
import OrderActions from "./order-actions";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 8px 35px #0000000d",
  marginBottom: "14px",
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderTop: "1px solid #e5ebe7",
  fontSize: "14px",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const isBuyer = order.buyer_id === user.id;
  const code = orderCode(order.id);

  let methods: { id: string; label: string; instructions: string }[] = [];
  if (isBuyer && order.status === "pending_payment") {
    const { data } = await supabase
      .from("platform_payment_methods")
      .select("id, label, instructions")
      .order("sort_order");
    methods = data ?? [];
  }

  let delivery = "";
  if (isBuyer && (order.status === "paid" || order.status === "completed")) {
    const { data } = await supabase
      .from("offer_delivery")
      .select("delivery_info")
      .eq("offer_id", order.offer_id)
      .maybeSingle();
    delivery = data?.delivery_info ?? "";
  }

  const isDigital = order.offer_type === "digital";

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "620px", margin: "auto", padding: "24px 15px" }}>
        <a href="/commandes" style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          ← Mes commandes
        </a>

        <div style={{ ...card, marginTop: "12px" }}>
          <div style={{ fontSize: "13px", color: "#68766e" }}>
            Commande {code} · {new Date(order.created_at).toLocaleDateString("fr-FR")}
          </div>
          <h1 style={{ margin: "6px 0", color: "#172d22", fontSize: "22px" }}>{order.offer_title}</h1>
          <div style={{ fontSize: "13px", color: "#68766e" }}>
            {offerTypeLabels[order.offer_type] ?? "Offre"}
          </div>
          <div style={{ display: "inline-block", marginTop: "12px", padding: "6px 12px", borderRadius: "999px", background: "#e8f5ed", color: "#087443", fontSize: "13px", fontWeight: 700 }}>
            {orderStatusLabels[order.status] ?? order.status}
          </div>
        </div>

        {isBuyer ? (
          <>
            <div style={card}>
              <div style={{ ...row, borderTop: "none" }}>
                <span>Prix</span>
                <strong>{formatPrice(order.unit_amount, order.currency)}</strong>
              </div>
            </div>

            {order.status === "pending_payment" && (
              <div style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: "17px", color: "#172d22" }}>Comment payer</h2>
                <p style={{ fontSize: "14px", color: "#68766e", lineHeight: 1.6, marginTop: 0 }}>
                  Vous payez <strong>GOWINMALL</strong>, pas directement le vendeur. Envoyez{" "}
                  <strong>{formatPrice(order.unit_amount, order.currency)}</strong> sur l&apos;un des moyens
                  ci-dessous, puis déclarez votre paiement avec la référence de la transaction.
                </p>
                {methods.length === 0 ? (
                  <div style={{ background: "#fff4df", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
                    Les moyens de paiement ne sont pas encore affichés. Revenez dans quelques instants ou
                    annulez la commande.
                  </div>
                ) : (
                  methods.map((m) => (
                    <div key={m.id} style={{ background: "#edf7f0", padding: "12px", borderRadius: "10px", marginBottom: "10px", fontSize: "14px", lineHeight: 1.5 }}>
                      <strong>{m.label}</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.instructions}</div>
                    </div>
                  ))
                )}
                <div style={{ fontSize: "13px", color: "#68766e", marginTop: "6px" }}>
                  Si l&apos;opérateur le permet, indiquez le code <strong>{code}</strong> comme motif.
                </div>
                <OrderActions orderId={order.id} status={order.status} offerType={order.offer_type} />
              </div>
            )}

            {order.status === "payment_declared" && (
              <div style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: "17px", color: "#172d22" }}>Paiement en vérification</h2>
                <p style={{ fontSize: "14px", color: "#68766e", lineHeight: 1.6, margin: 0 }}>
                  Vous avez déclaré votre paiement (référence : <strong>{order.payment_reference}</strong>).
                  L&apos;équipe GOWINMALL le vérifie. Revenez sur cette page : votre achat apparaîtra dès la
                  confirmation.
                </p>
              </div>
            )}

            {(order.status === "paid" || order.status === "completed") && (
              <div style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: "17px", color: "#172d22" }}>
                  {isDigital ? "Votre achat" : "Livraison"}
                </h2>
                {delivery ? (
                  <div style={{ background: "#edf7f0", padding: "12px", borderRadius: "10px", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {delivery}
                  </div>
                ) : (
                  <p style={{ fontSize: "14px", color: "#68766e", margin: 0 }}>
                    Le vendeur vous contactera pour la livraison.
                  </p>
                )}
                {order.status === "paid" && !isDigital && (
                  <>
                    <p style={{ fontSize: "13px", color: "#68766e", lineHeight: 1.6 }}>
                      Quand vous avez reçu votre achat, confirmez-le : GOWINMALL reversera alors le vendeur.
                    </p>
                    <OrderActions orderId={order.id} status={order.status} offerType={order.offer_type} />
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={card}>
            <h2 style={{ margin: "0 0 8px", fontSize: "17px", color: "#172d22" }}>Détail de la vente</h2>
            <div style={{ ...row, borderTop: "none" }}>
              <span>Prix payé par l&apos;acheteur</span>
              <strong>{formatPrice(order.unit_amount, order.currency)}</strong>
            </div>
            <div style={row}>
              <span>Commission GOWINMALL ({formatRate(order.commission_rate_bps ?? 0)})</span>
              <strong>− {formatPrice(order.commission_amount ?? 0, order.currency)}</strong>
            </div>
            <div style={row}>
              <span>Vous recevrez</span>
              <strong style={{ color: "#087443" }}>{formatPrice(order.seller_amount ?? 0, order.currency)}</strong>
            </div>
            <div style={row}>
              <span>Reversement</span>
              <strong>{payoutStatusLabels[order.payout_status] ?? order.payout_status}</strong>
            </div>
            {order.buyer_note && (
              <div style={{ ...row, flexDirection: "column" }}>
                <span style={{ color: "#68766e" }}>Message de l&apos;acheteur</span>
                <span style={{ whiteSpace: "pre-wrap" }}>{order.buyer_note}</span>
              </div>
            )}
            <p style={{ fontSize: "13px", color: "#68766e", lineHeight: 1.6, marginBottom: 0 }}>
              {order.status === "pending_payment" && "L'acheteur n'a pas encore payé."}
              {order.status === "payment_declared" && "L'acheteur a déclaré son paiement : GOWINMALL le vérifie."}
              {order.status === "paid" && !isDigital && "Paiement confirmé : livrez l'acheteur. Après sa confirmation de réception, GOWINMALL vous reverse."}
              {order.status === "paid" && isDigital && "Paiement confirmé : l'acheteur a accès à son achat. GOWINMALL vous reverse."}
              {order.status === "completed" && "Commande terminée."}
              {order.status === "cancelled" && "Commande annulée."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
      }
