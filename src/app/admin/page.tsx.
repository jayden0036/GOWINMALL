"use client";

import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setMessage(
      "L'authentification administrateur doit encore être configurée."
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101b17",
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
          background: "#ffffff",
          borderRadius: "18px",
          padding: "35px 25px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#087443", marginBottom: "5px" }}>
            GOWINMALL
          </h1>

          <p style={{ color: "#b18a35", fontWeight: "bold" }}>
            GOWIN ADMIN
          </p>

          <h2 style={{ color: "#172d22", marginTop: "30px" }}>
            Espace propriétaire
          </h2>

          <p style={{ color: "#718078", fontSize: "14px" }}>
            Accès réservé à l'administration de GOWINMALL.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginTop: "25px",
              fontWeight: "bold",
            }}
          >
            Adresse e-mail administrateur
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse e-mail"
              required
              autoComplete="username"
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "block",
              marginTop: "20px",
              fontWeight: "bold",
            }}
          >
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              marginTop: "25px",
              background: "#087443",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Accéder à GOWIN ADMIN
          </button>

          {message && (
            <p
              role="status"
              style={{
                marginTop: "18px",
                padding: "12px",
                background: "#fff4df",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {message}
            </p>
          )}
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#8a958e",
            fontSize: "12px",
            marginTop: "30px",
          }}
        >
          GOWINMALL © 2026 — Accès sécurisé
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  border: "1px solid #dce4df",
  borderRadius: "9px",
  boxSizing: "border-box",
  fontSize: "15px",
};
