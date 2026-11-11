"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Doc = {
  id: string;
  doc_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

const typeLabels: Record<string, string> = {
  carte_electeur: "Carte d'électeur",
  passeport: "Passeport",
  permis_conduire: "Permis de conduire",
  carte_identite: "Carte d'identité",
};

const statusLabels: Record<string, string> = {
  pending: "En attente de vérification",
  approved: "Vérifié",
  rejected: "Refusé",
};

const MAX_SIZE = 5 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export default function VerificationPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState("carte_electeur");
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("identity_documents")
      .select("id, doc_type, status, rejection_reason, created_at")
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("Choisissez un fichier.");
      return;
    }
    const ext = extensions[file.type];
    if (!ext) {
      setMessage("Format accepté : photo JPG, PNG ou fichier PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage("Fichier trop volumineux (5 Mo maximum).");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("identity-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setBusy(false);
      setMessage("Envoi impossible : " + uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("identity_documents")
      .insert({ user_id: user.id, doc_type: docType, storage_path: path });

    if (insertError) {
      await supabase.storage.from("identity-documents").remove([path]);
      setBusy(false);
      setMessage("Enregistrement impossible : " + insertError.message);
      return;
    }

    setBusy(false);
    setFile(null);
    setInputKey((k) => k + 1);
    setMessage("Document envoyé. Il sera vérifié par l'équipe GOWINMALL.");
    load();
  }

  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "14px",
    marginTop: "8px",
    border: "1px solid #dce4df",
    borderRadius: "10px",
    boxSizing: "border-box",
    fontSize: "15px",
    background: "white",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f5",
        padding: "30px 15px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "auto",
          background: "white",
          padding: "28px 22px",
          borderRadius: "18px",
          boxShadow: "0 8px 35px #0000000d",
          boxSizing: "border-box",
        }}
      >        <a
          href="/dashboard"
          style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
        >
          ← Mon tableau de bord
        </a>
        <h1 style={{ color: "#087443", textAlign: "center", margin: 0 }}>
          GOWINMALL
        </h1>
        <h2 style={{ textAlign: "center", color: "#172d22" }}>
          Vérification d&apos;identité
        </h2>
        <p style={{ color: "#68766e", fontSize: "14px", lineHeight: 1.6 }}>
          Envoyez une pièce d&apos;identité lisible. Seuls vous et l&apos;équipe de
          vérification GOWINMALL pouvez la consulter.
        </p>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginTop: "16px", fontWeight: 600 }}>
            Type de pièce
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={fieldStyle}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", marginTop: "16px", fontWeight: 600 }}>
            Fichier (JPG, PNG ou PDF, 5 Mo maximum)
            <input
              key={inputKey}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={fieldStyle}
            />
          </label>

          {message && (
            <p
              role="status"
              style={{
                marginTop: "16px",
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
            disabled={busy}
            style={{
              width: "100%",
              padding: "16px",
              marginTop: "20px",
              background: "#087443",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Envoi en cours…" : "Envoyer le document"}
          </button>
        </form>

        {docs.length > 0 && (
          <div style={{ marginTop: "28px" }}>
            <h3 style={{ color: "#172d22" }}>Vos documents</h3>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  borderTop: "1px solid #e5ebe7",
                  padding: "12px 0",
                  fontSize: "14px",
                }}
              >
                <strong>{typeLabels[d.doc_type] ?? d.doc_type}</strong>
                <div style={{ color: "#68766e" }}>
                  {statusLabels[d.status] ?? d.status} ·{" "}
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </div>
                {d.status === "rejected" && d.rejection_reason && (
                  <div style={{ color: "#b3261e", marginTop: "4px" }}>
                    Motif : {d.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
      }
