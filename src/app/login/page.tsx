"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";
const callbackMessages: Record<string, string> = {
  link_expired: "Ce lien a expiré ou a déjà été utilisé. Si votre adresse est confirmée, connectez-vous ci-dessous.",
  session_exchange_failed: "Le lien a été ouvert sur un autre navigateur ou appareil. Si votre adresse est confirmée, connectez-vous ci-dessous.",
  not_confirmed: "Votre adresse e-mail n'est pas encore confirmée.",
  confirmation_failed: "La confirmation n'a pas pu être validée. Réessayez avec le lien reçu par e-mail.",
  missing_code: "Lien de confirmation incomplet.",
};
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
useEffect(() => {
  const reason = new URLSearchParams(window.location.search).get("error");
  if (reason) setMessage(callbackMessages[reason] ?? callbackMessages.confirmation_failed);
}, []);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(
        error.message.toLowerCase().includes("not confirmed")
          ? "Confirmez d'abord votre adresse e-mail grâce au message reçu."
          : "E-mail ou mot de passe incorrect."
      );
      return;
    }

    const { data: role } = await supabase.rpc("my_admin_role");
        router.push(role ? "/admin" : "/verification");
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "14px",
    marginTop: "8px",
    border: "1px solid #dce4df",
    borderRadius: "10px",
    boxSizing: "border-box",
    fontSize: "15px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "white",
          padding: "32px 24px",
          borderRadius: "18px",
          boxShadow: "0 8px 35px #0000000d",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ color: "#087443", textAlign: "center" }}>GOWINMALL</h1>
        <h2 style={{ textAlign: "center", color: "#172d22" }}>Connexion</h2>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginTop: "22px", fontWeight: 600 }}>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginTop: "18px", fontWeight: 600 }}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>
          <p style={{ textAlign: "right", fontSize: "14px", marginTop: "10px" }}>
            <a href="/mot-de-passe-oublie" style={{ color: "#087443" }}>Mot de passe oublié ?</a>
          </p>
          {message && (
            <p
              role="status"
              style={{
                marginTop: "18px",
                padding: "12px",
                background: "#fff4df",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              marginTop: "22px",
              background: "#087443",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <GoogleButton label="Continuer avec Google" />
        <p style={{ textAlign: "center", fontSize: "14px", marginTop: "22px" }}>
          Pas encore de compte ?{" "}
          <a href="/register" style={{ color: "#087443", fontWeight: 600 }}>
            Créer un compte
          </a>
        </p>
      </div>
    </main>
  );
          }
