"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BuyButton({
  offerId,
  loggedIn,
}: {
  offerId: string;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleBuy() {
    setMessage("");
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("place_order", {
      p_offer_id: offerId,
      p_note: note.trim(),
    });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    router.push(`/commandes/${data}`);
  }

  return (
    <div>
      {loggedIn && (
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#26352d", marginBottom: "12px" }}>
          Message au vendeur (facultatif)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            style={{ display: "block", width: "100%", padding: "12px", marginTop: "6px", border: "1px solid #dce4df", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}
          />
        </label>
      )}
      <button
        onClick={handleBuy}
        disabled={loading}
        style={{ width: "100%", padding: "16px", background: "#087443", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
      >
        {loggedIn ? (loading ? "Création de la commande…" : "Commander") : "Se connecter pour commander"}
      </button>
      {message && (
        <p role="status" style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
          {message}
        </p>
      )}
    </div>
  );
          }
