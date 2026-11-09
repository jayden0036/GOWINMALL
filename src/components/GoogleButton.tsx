"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export default function GoogleButton({
  label = "Continuer avec Google",
}: {
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClick() {
    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getSiteUrl()}/auth/callback?terms=1` },
    });

    if (error) {
      setLoading(false);
      setErrorMessage("Connexion avec Google impossible pour le moment.");
    }
  }

  return (
    <div style={{ marginTop: "22px" }}>
      <p style={{ textAlign: "center", color: "#68766e", fontSize: "13px", margin: "0 0 14px" }}>
        ou
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          background: "white",
          color: "#172d22",
          border: "1px solid #dce4df",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Redirection…" : label}
      </button>

      {errorMessage && (
        <p role="status" style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
          {errorMessage}
        </p>
      )}

      <p style={{ fontSize: "12px", color: "#68766e", textAlign: "center", marginTop: "12px", lineHeight: 1.5 }}>
        En continuant avec Google, vous acceptez les{" "}
        <a href="/conditions" target="_blank" rel="noopener noreferrer" style={{ color: "#087443" }}>
          conditions d&apos;utilisation
        </a>{" "}
        et la{" "}
        <a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#087443" }}>
          politique de confidentialité
        </a>
        .
      </p>
    </div>
  );
}
