"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #dce4df",
  background: "white",
  color: "#26352d",
  fontSize: "13px",
  cursor: "pointer",
};

export default function OfferActions({
  offerId,
  status,
}: {
  offerId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function change(next: string) {
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("offers").update({ status: next }).eq("id", offerId);
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }

  if (status === "suspended") {
    return (
      <div style={{ fontSize: "13px", color: "#b3261e" }}>
        Suspendue par l&apos;équipe GOWINMALL.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {status !== "published" && (
          <button style={{ ...buttonStyle, background: "#087443", color: "white", border: "none" }} disabled={loading} onClick={() => change("published")}>
            Publier
          </button>
        )}
        {status === "published" && (
          <button style={buttonStyle} disabled={loading} onClick={() => change("draft")}>
            Retirer de la vente
          </button>
        )}
        {status !== "archived" && (
          <button style={buttonStyle} disabled={loading} onClick={() => change("archived")}>
            Archiver
          </button>
        )}
      </div>
      {message && (
        <div style={{ marginTop: "8px", padding: "10px", background: "#fff4df", borderRadius: "8px", fontSize: "13px" }}>
          {message}
        </div>
      )}
    </div>
  );
      }
