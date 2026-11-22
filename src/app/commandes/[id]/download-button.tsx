"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DownloadButton({
  orderId,
  used,
  max,
}: {
  orderId: string;
  used: number;
  max: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const left = Math.max(0, max - used);

  async function download() {
    setMessage("");
    setLoading(true);

    const { data, error } = await createClient().functions.invoke("download-product", {
      body: { order_id: orderId },
    });

    setLoading(false);

    let reason = "";
    if (error) {
      reason = "Le téléchargement a échoué. Réessayez dans un instant.";
      const response = (error as { context?: Response }).context;
      if (response && typeof response.json === "function") {
        const body = await response.json().catch(() => null);
        if (body && typeof body.error === "string") reason = body.error;
      }
    } else if (!data?.url) {
      reason = "Le téléchargement est indisponible pour le moment.";
    }

    if (reason) {
      setMessage(reason);
      router.refresh();
      return;
    }

    window.location.href = data.url;
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={loading || left <= 0}
        style={{
          width: "100%",
          padding: "15px",
          background: left <= 0 ? "#b9c7c0" : "#126b52",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: 700,
          fontSize: "16px",
          cursor: left <= 0 ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Préparation…" : "Télécharger mon fichier"}
      </button>

      <div style={{ fontSize: "13px", color: "#718078", marginTop: "10px", lineHeight: 1.6 }}>
        {left > 0
          ? `Il vous reste ${left} téléchargement${left > 1 ? "s" : ""} sur ${max}. Le lien ne fonctionne que quelques secondes.`
          : "Vous avez utilisé tous vos téléchargements. Si le fichier ne s'est pas téléchargé correctement, contactez GOWINMALL avec le code de votre commande."}
      </div>

      {message && (
        <div style={{ marginTop: "10px", padding: "10px 12px", background: "#fff4df", borderRadius: "10px", fontSize: "13px" }}>
          {message}
        </div>
      )}
    </div>
  );
}
