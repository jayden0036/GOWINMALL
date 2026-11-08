"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setState(data.user ? "ready" : "invalid"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Utilisez au moins 12 caractères.");
      return;
    }
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setMessage("Impossible de changer le mot de passe : " + error.message);
      return;
    }

    const { data: role } = await supabase.rpc("my_admin_role");
    router.push(role ? "/admin" : "/verification");
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", padding: "14px", marginTop: "8px",
    border: "1px solid #dce4df", borderRadius: "10px", boxSizing: "border-box", fontSize: "15px",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "430px", background: "white", padding: "32px 24px", borderRadius: "18px", boxShadow: "0 8px 35px #0000000d", boxSizing: "border-box" }}>
        <h1 style={{ color: "#087443", textAlign: "center" }}>GOWINMALL</h1>
        <h2 style={{ textAlign: "center", color: "#172d22" }}>Nouveau mot de passe</h2>

        {state === "loading" && <p style={{ textAlign: "center" }}>Chargement…</p>}

        {state === "invalid" && (
          <p style={{ textAlign: "center", fontSize: "14px" }}>
            Ce lien est invalide ou a expiré.{" "}
            <a href="/mot-de-passe-oublie" style={{ color: "#087443", fontWeight: 600 }}>Demander un nouveau lien</a>
          </p>
        )}

        {state === "ready" && (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginTop: "22px", fontWeight: 600 }}>
              Nouveau mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="12 caractères minimum" required style={inputStyle} />
            </label>

            <label style={{ display: "block", marginTop: "18px", fontWeight: 600 }}>
              Confirmer le mot de passe
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required style={inputStyle} />
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
              {loading ? "Enregistrement…" : "Changer le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
