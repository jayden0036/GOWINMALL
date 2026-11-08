"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/nouveau-mot-de-passe`,
    });

    setLoading(false);
    if (error) {
      setMessage("Impossible d'envoyer l'e-mail pour le moment. Réessayez dans quelques minutes.");
      return;
    }
    setMessage("Si cette adresse correspond à un compte, un e-mail de réinitialisation vient d'être envoyé.");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "430px", background: "white", padding: "32px 24px", borderRadius: "18px", boxShadow: "0 8px 35px #0000000d", boxSizing: "border-box" }}>
        <h1 style={{ color: "#087443", textAlign: "center" }}>GOWINMALL</h1>
        <h2 style={{ textAlign: "center", color: "#172d22" }}>Mot de passe oublié</h2>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginTop: "22px", fontWeight: 600 }}>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: "14px", marginTop: "8px", border: "1px solid #dce4df", borderRadius: "10px", boxSizing: "border-box", fontSize: "15px" }}
            />
          </label>

          {message && (
            <p role="status" style={{ marginTop: "18px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "16px", marginTop: "22px", background: "#087443", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "14px", marginTop: "22px" }}>
          <a href="/login" style={{ color: "#087443", fontWeight: 600 }}>Retour à la connexion</a>
        </p>
      </div>
    </main>
  );
              }
