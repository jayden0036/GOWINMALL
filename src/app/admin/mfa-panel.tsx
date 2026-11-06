"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  marginTop: "18px",
  background: "#087443",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "bold",
};

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      style={{
        padding: "10px 16px",
        background: "transparent",
        color: "white",
        border: "1px solid #3d5a4e",
        borderRadius: "8px",
        fontWeight: "bold",
      }}
    >
      Déconnexion
    </button>
  );
}

export function MfaPanel({ mode }: { mode: "enroll" | "verify" }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "verify") return;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => {
        const factor = data?.totp?.[0];
        if (factor) setFactorId(factor.id);
        else setMessage("Aucun facteur 2FA trouvé. Reconnectez-vous.");
      });
  }, [mode]);

  async function startEnroll() {
    setBusy(true);
    setMessage("");
    const supabase = createClient();

    // Supprime les tentatives d'activation abandonnées
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const f of factors?.all ?? []) {
      if (f.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "GOWIN ADMIN",
    });
    setBusy(false);

    if (error || !data) {
      setMessage(
        "Impossible d'activer la 2FA : " + (error?.message ?? "erreur inconnue")
      );
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setMessage("");

    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (error) {
      setBusy(false);
      setMessage("Code incorrect ou expiré. Réessayez.");
      return;
    }
    router.refresh();
  }

  const codeForm = (
    <form onSubmit={confirm}>
      <label style={{ display: "block", marginTop: "18px", fontWeight: 600 }}>
        Code à 6 chiffres
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            marginTop: "8px",
            border: "1px solid #dce4df",
            borderRadius: "10px",
            boxSizing: "border-box",
            fontSize: "20px",
            letterSpacing: "6px",
            textAlign: "center",
          }}
        />
      </label>
      <button type="submit" disabled={busy || !factorId} style={buttonStyle}>
        {busy ? "Vérification…" : "Valider"}
      </button>
    </form>
  );

  return (
    <div
      style={{
        maxWidth: "430px",
        margin: "40px auto",
        background: "white",
        padding: "30px 24px",
        borderRadius: "18px",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ color: "#172d22", marginTop: 0 }}>
        Double authentification
      </h2>

      {mode === "verify" && (
        <>
          <p style={{ color: "#718078", fontSize: "14px", lineHeight: 1.6 }}>
            Entrez le code affiché dans votre application d&apos;authentification.
          </p>
          {codeForm}
        </>
      )}

      {mode === "enroll" && !qrCode && (
        <>
          <p style={{ color: "#718078", fontSize: "14px", lineHeight: 1.6 }}>
            L&apos;espace administrateur exige la double authentification. Installez
            une application comme Google Authenticator, puis activez-la ici.
          </p>
          <button onClick={startEnroll} disabled={busy} style={buttonStyle}>
            {busy ? "Préparation…" : "Activer la 2FA"}
          </button>
        </>
      )}

      {mode === "enroll" && qrCode && (
        <>
          <p style={{ color: "#718078", fontSize: "14px", lineHeight: 1.6 }}>
            Scannez ce code avec votre application, ou saisissez la clé
            ci-dessous, puis entrez le code à 6 chiffres affiché.
          </p>
          <img
            src={qrCode}
            alt="QR code de la double authentification"
            style={{ width: "200px", height: "200px", display: "block", margin: "auto" }}
          />
          <p
            style={{
              wordBreak: "break-all",
              fontSize: "13px",
              textAlign: "center",
              color: "#26352d",
            }}
          >
            {secret}
          </p>
          {codeForm}
        </>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#fff4df",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
      }
