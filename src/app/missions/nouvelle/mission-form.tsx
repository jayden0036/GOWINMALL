"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { commissionOf, formatPrice, formatRate, parsePrice } from "@/lib/format";
import { GREEN, MUTED, primaryButton } from "../../dashboard/styles";

export default function MissionForm({ rateBps }: { rateBps: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const amount = parsePrice(price, currency);
  const commission = amount ? commissionOf(amount, rateBps) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (title.trim().length < 5) return setMessage("Donnez un titre d'au moins 5 caractères.");
    if (description.trim().length < 20) return setMessage("Décrivez la mission en au moins 20 caractères.");
    if (!amount) return setMessage(currency === "USD" ? "Entrez un prix valide, par exemple 25 ou 25,50." : "Entrez un prix valide en francs, sans virgule.");

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_mission", {
      p_title: title.trim(),
      p_description: description.trim(),
      p_price_amount: amount,
      p_currency: currency,
      p_deadline_at: deadline ? new Date(`${deadline}T23:59:00`).toISOString() : null,
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.push(`/missions/${data as string}`);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="title">Titre de la mission</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex. : Créer 3 affiches pour mon commerce" />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          rows={6}
          placeholder="Ce qu'il faut faire, le résultat attendu, le délai..."
          style={{ padding: "12px", border: "1px solid #d5ded9", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", width: "100%", resize: "vertical" }}
        />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="price">Prix proposé</label>
          <input id="price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder={currency === "USD" ? "25" : "20000"} />
        </div>
        <div className="field">
          <label htmlFor="currency">Devise</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: "12px", border: "1px solid #d5ded9", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", width: "100%", background: "white" }}>
            <option value="CDF">Francs congolais (FC)</option>
            <option value="USD">Dollars (USD)</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="deadline">Date limite (facultatif)</label>
        <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      {amount && (
        <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.5, margin: "0 0 14px" }}>
          Vous paierez <strong>{formatPrice(amount, currency)}</strong>. Après la commission de GOWINMALL ({formatRate(rateBps)}), le travailleur recevra{" "}
          <strong style={{ color: GREEN }}>{formatPrice(amount - commission, currency)}</strong>.
        </p>
      )}

      <button type="submit" disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Publication…" : "Publier la mission"}
      </button>
      {message && (
        <p role="status" style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
          {message}
        </p>
      )}
    </form>
  );
}
