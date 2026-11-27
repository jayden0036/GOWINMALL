"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PayReward({ rewardId, amountLabel }: { rewardId: string; amountLabel: string }) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function pay() {
    if (!window.confirm(`Avez-vous bien envoyé ${amountLabel} à cet affilié ?`)) return;
    setMessage("");
    setLoading(true);
    const { error } = await createClient().rpc("mark_affiliate_reward_paid", { p_reward_id: rewardId, p_reference: reference.trim() });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={120}
          placeholder="Référence de votre envoi (facultatif)"
          style={{ flex: "1 1 200px", padding: "10px", border: "1px solid #dce4df", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
        />
        <button
          type="button"
          onClick={pay}
          disabled={loading}
          style={{ padding: "10px 14px", background: "#087443", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
        >
          Marquer comme versée
        </button>
      </div>
      {message && <div style={{ marginTop: "8px", padding: "10px", background: "#fff4df", borderRadius: "8px", fontSize: "13px" }}>{message}</div>}
    </div>
  );
}
