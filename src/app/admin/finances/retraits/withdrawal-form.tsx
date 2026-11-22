"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, parsePrice } from "@/lib/format";

const field: CSSProperties = {
  padding: "11px",
  border: "1px solid #d5ded9",
  borderRadius: "10px",
  fontSize: "15px",
  fontFamily: "inherit",
  boxSizing: "border-box",
  width: "100%",
  background: "white",
};

const label: CSSProperties = { fontSize: "13px", fontWeight: 600, color: "#26352d", marginBottom: "6px", display: "block" };

export function WithdrawalForm({ available }: { available: Record<string, number> }) {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const left = available[currency] ?? 0;

  async function submit() {
    setMessage("");
    setSaved(false);

    const value = parsePrice(amount, currency);
    if (value === null) {
      setMessage(currency === "USD" ? "Entrez un montant valide, par exemple 12,50." : "Entrez un montant entier en francs.");
      return;
    }
    if (value > left) {
      setMessage(`Le montant dépasse votre commission disponible (${formatPrice(left, currency)}).`);
      return;
    }
    if (!window.confirm(`Enregistrer un retrait de ${formatPrice(value, currency)} ?`)) return;

    setLoading(true);
    const { error } = await createClient().rpc("record_commission_withdrawal", {
      p_currency: currency,
      p_amount: value,
      p_method: method.trim(),
      p_reference: reference.trim(),
      p_note: note.trim(),
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    setAmount("");
    setReference("");
    setNote("");
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div>
          <label htmlFor="w-currency" style={label}>Devise</label>
          <select
            id="w-currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setSaved(false);
            }}
            style={field}
          >
            <option value="USD">Dollars (USD)</option>
            <option value="CDF">Francs congolais (CDF)</option>
          </select>
        </div>
        <div>
          <label htmlFor="w-amount" style={label}>Montant retiré</label>
          <input
            id="w-amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSaved(false);
            }}
            inputMode="decimal"
            placeholder={currency === "USD" ? "12,50" : "25000"}
            style={field}
          />
        </div>
        <div>
          <label htmlFor="w-method" style={label}>Moyen utilisé</label>
          <input id="w-method" value={method} onChange={(e) => setMethod(e.target.value)} maxLength={60} placeholder="M-Pesa, Airtel Money, banque…" style={field} />
        </div>
        <div>
          <label htmlFor="w-ref" style={label}>Référence (facultatif)</label>
          <input id="w-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} style={field} />
        </div>
      </div>
      <div style={{ marginTop: "12px" }}>
        <label htmlFor="w-note" style={label}>Note (facultatif)</label>
        <input id="w-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} style={field} />
      </div>

      <div style={{ fontSize: "13px", color: "#718078", margin: "12px 0" }}>
        Disponible en {currency} : <strong style={{ color: "#172b25" }}>{formatPrice(left, currency)}</strong>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || left <= 0}
        style={{
          padding: "12px 20px",
          background: left <= 0 ? "#b9c7c0" : "#126b52",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: 700,
          fontSize: "14px",
          cursor: left <= 0 ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {loading ? "Enregistrement…" : "Enregistrer le retrait"}
      </button>

      {saved && <div style={{ marginTop: "10px", color: "#126b52", fontWeight: 600, fontSize: "14px" }}>Retrait enregistré.</div>}
      {message && (
        <div style={{ marginTop: "10px", padding: "10px 12px", background: "#fff4df", borderRadius: "10px", fontSize: "13px" }}>{message}</div>
      )}
    </div>
  );
}

export function CancelWithdrawalButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function cancel() {
    if (!window.confirm("Annuler cette ligne ? Elle restera visible dans le journal, marquée annulée.")) return;
    setMessage("");
    setLoading(true);
    const { error } = await createClient().rpc("cancel_commission_withdrawal", { p_id: id });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancel}
        disabled={loading}
        style={{
          padding: "6px 10px",
          background: "white",
          color: "#26352d",
          border: "1px solid #d5ded9",
          borderRadius: "8px",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Annuler
      </button>
      {message && <div style={{ fontSize: "12px", color: "#b3261e", marginTop: "4px" }}>{message}</div>}
    </div>
  );
        }
      
