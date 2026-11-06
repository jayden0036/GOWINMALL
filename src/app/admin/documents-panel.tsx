"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Doc = {
  id: string;
  user_id: string;
  doc_type: string;
  storage_path: string;
  created_at: string;
};

const typeLabels: Record<string, string> = {
  carte_electeur: "Carte d'électeur",
  passeport: "Passeport",
  permis_conduire: "Permis de conduire",
  carte_identite: "Carte d'identité",
};

export function DocumentsPanel() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<{ id: string; url: string } | null>(
    null
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("identity_documents")
      .select("id, user_id, doc_type, storage_path, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      setMessage("Impossible de charger les documents.");
      setLoading(false);
      return;
    }

    const list = (data ?? []) as Doc[];
    setDocs(list);

    // Les noms ne s'affichent que si le rôle a la permission de voir les utilisateurs
    const ids = Array.from(new Set(list.map((d) => d.user_id)));
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, post_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (profiles ?? []).forEach((p) => {
        map[p.id] = [p.first_name, p.post_name, p.last_name]
          .filter(Boolean)
          .join(" ");
      });
      setNames(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function view(doc: Doc) {
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("identity-documents")
      .createSignedUrl(doc.storage_path, 60);

    if (error || !data) {
      setMessage("Impossible d'ouvrir ce document.");
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "consultation_document_identite",
      p_target: doc.id,
    });
    setViewing({ id: doc.id, url: data.signedUrl });
  }

  async function decide(doc: Doc, status: "approved" | "rejected") {
    setMessage("");
    const reason = (reasons[doc.id] ?? "").trim();
    if (status === "rejected" && !reason) {
      setMessage("Indiquez un motif de refus.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("identity_documents")
      .update({
        status,
        rejection_reason: status === "rejected" ? reason : null,
      })
      .eq("id", doc.id);

    if (error) {
      setMessage("Action impossible : " + error.message);
      return;
    }

    await supabase.rpc("log_admin_action", {
      p_action:
        status === "approved" ? "document_identite_approuve" : "document_identite_refuse",
      p_target: doc.id,
    });
    setViewing(null);
    load();
  }

  const smallButton: React.CSSProperties = {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "14px",
    color: "white",
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "14px",
        padding: "20px",
        marginTop: "14px",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#172d22" }}>
        Documents d&apos;identité à vérifier
      </h3>

      {loading && <p style={{ color: "#718078" }}>Chargement…</p>}
      {!loading && docs.length === 0 && (
        <p style={{ color: "#718078", fontSize: "14px" }}>
          Aucun document en attente.
        </p>
      )}

      {docs.map((d) => (
        <div
          key={d.id}
          style={{ borderTop: "1px solid #e5ebe7", padding: "14px 0" }}
        >
          <div style={{ fontWeight: 700 }}>
            {names[d.user_id] || "Utilisateur " + d.user_id.slice(0, 8)}
          </div>
          <div style={{ fontSize: "13px", color: "#718078" }}>
            {typeLabels[d.doc_type] ?? d.doc_type} ·{" "}
            {new Date(d.created_at).toLocaleDateString("fr-FR")}
          </div>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => view(d)}
              style={{ ...smallButton, background: "#26352d" }}
            >
              Voir le document
            </button>
            {viewing?.id === d.id && (
              <a
                href={viewing.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: "12px",
                  color: "#087443",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                Ouvrir (valable 60 s)
              </a>
            )}
          </div>

          <input
            value={reasons[d.id] ?? ""}
            onChange={(e) =>
              setReasons({ ...reasons, [d.id]: e.target.value })
            }
            placeholder="Motif en cas de refus"
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              border: "1px solid #dce4df",
              borderRadius: "8px",
              boxSizing: "border-box",
              fontSize: "14px",
            }}
          />

          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => decide(d, "approved")}
              style={{ ...smallButton, background: "#087443" }}
            >
              Approuver
            </button>
            <button
              onClick={() => decide(d, "rejected")}
              style={{ ...smallButton, background: "#b3261e" }}
            >
              Refuser
            </button>
          </div>
        </div>
      ))}

      {message && (
        <p
          role="status"
          style={{
            marginTop: "14px",
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
