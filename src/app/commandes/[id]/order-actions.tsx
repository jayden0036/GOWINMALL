"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const primary: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  background: "#087443",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const secondary: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  background: "white",
  color: "#26352d",
  border: "1px solid #dce4df",
  borderRadius: "10px",
  fontSize: "14px",
  cursor: "pointer",
  marginTop: "10px",
};

export default function OrderActions({
  orderId,
  status,
  offerType,
}: {
  orderId: string;
  status: string;
  offerType: string | null;
}) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run(fn: "declare_payment" | "cancel_order" | "complete_order") {
    setMessage("");
    if (fn === "declare_payment" && reference.trim().length < 3) {
      setMessage("Entrez la référence de la transaction (reçue par SMS de l'opérateur).");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const args =
      fn === "declare_payment"
        ? { p_order_id: orderId, p_reference: reference.trim() }
        : { p_order_id: orderId };
    const { error } = await supabase.rpc(fn, args);
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: "14px" }}>
      {status === "pending_payment" && (
        <>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#26352d" }}>
            Référence de la transaction
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={120}
              placeholder="Ex. : code reçu par SMS après le paiement"
              style={{ display: "block", width: "100%", padding: "13px", marginTop: "7px", marginBottom: "12px", border: "1px solid #dce4df", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box" }}
            />
          </label>
          <button style={{ ...primary, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("declare_payment")}>
            J&apos;ai effectué le paiement
          </button>
          <button style={secondary} disabled={loading} onClick={() => run("cancel_order")}>
            Annuler la commande
          </button>
        </>
      )}

      {status === "paid" && offerType !== "digital" && (
        <button style={{ ...primary, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("complete_order")}>
          J&apos;ai bien reçu mon achat
        </button>
      )}

      {message && (
        <p role="status" style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
          {message}
        </p>
      )}
    </div>
  );
                         }
