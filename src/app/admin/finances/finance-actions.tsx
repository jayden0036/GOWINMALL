"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const primary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#087443",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "13px",
  cursor: "pointer",
};

const secondary: React.CSSProperties = {
  padding: "10px 14px",
  background: "white",
  color: "#26352d",
  border: "1px solid #dce4df",
  borderRadius: "8px",
  fontSize: "13px",
  cursor: "pointer",
};

const input: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #dce4df",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

function useAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run(fn: string, args: Record<string, unknown>): Promise<boolean> {
    setMessage("");
    setLoading(true);
    const { error } = await createClient().rpc(fn, args);
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return false;
    }
    router.refresh();
    return true;
  }

  return { loading, message, setMessage, run };
}

function Message({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: "8px", padding: "10px", background: "#fff4df", borderRadius: "8px", fontSize: "13px" }}>
      {text}
    </div>
  );
}

export function ConfirmButtons({
  orderId,
  amountLabel,
  declared,
}: {
  orderId: string;
  amountLabel: string;
  declared: boolean;
}) {
  const { loading, message, run } = useAction();

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          style={primary}
          disabled={loading}
          onClick={() => {
            const warning = declared
              ? ""
              : "\n\nAttention : l'acheteur n'a pas encore déclaré son paiement.";
            if (
              window.confirm(
                `Confirmez-vous avoir bien reçu ${amountLabel} sur l'un des numéros GOWINMALL ?${warning}`
              )
            ) {
              run("confirm_payment", { p_order_id: orderId });
            }
          }}
        >
          Confirmer le paiement
        </button>
        <button
          style={secondary}
          disabled={loading}
          onClick={() => {
            if (window.confirm("Annuler cette commande ?")) {
              run("cancel_order", { p_order_id: orderId });
            }
          }}
        >
          Annuler la commande
        </button>
      </div>
      <Message text={message} />
    </div>
  );
}

export function PayoutButton({
  orderId,
  amountLabel,
}: {
  orderId: string;
  amountLabel: string;
}) {
  const { loading, message, run } = useAction();
  const [reference, setReference] = useState("");

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={120}
          placeholder="Référence de ton envoi (facultatif)"
          style={{ ...input, flex: "1 1 200px" }}
        />
        <button
          style={primary}
          disabled={loading}
          onClick={() => {
            if (window.confirm(`Avez-vous bien envoyé ${amountLabel} au vendeur ?`)) {
              run("mark_payout_paid", { p_order_id: orderId, p_reference: reference.trim() });
            }
          }}
        >
          Marquer comme reversé
        </button>
      </div>
      <Message text={message} />
    </div>
  );
}

export function FeeForm({ type, bps }: { type: string; bps: number }) {
  const { loading, message, setMessage, run } = useAction();
  const [value, setValue] = useState(String(bps / 100).replace(".", ","));
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaved(false);
    const percent = Number(value.replace(",", ".").trim());
    if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
      setMessage("Entrez un pourcentage entre 0 et 50.");
      return;
    }
    const ok = await run("set_fee_rate", { p_type: type, p_bps: Math.round(percent * 100) });
    if (ok) setSaved(true);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          inputMode="decimal"
          style={{ ...input, width: "80px" }}
        />
        <span style={{ fontSize: "14px" }}>%</span>
        <button style={primary} disabled={loading} onClick={save}>
          Enregistrer
        </button>
      </div>
      {saved && <div style={{ fontSize: "12px", color: "#087443", marginTop: "6px" }}>Enregistré.</div>}
      <Message text={message} />
    </div>
  );
                               }
