"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const input: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #dce4df", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box", marginTop: "6px" };

export default function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (title.trim().length < 3 || body.trim().length < 5) return setMessage("Ajoutez un titre et un message.");
    if (!window.confirm("Envoyer cette annonce à tous les inscrits ?")) return;
    setLoading(true);
    const { error } = await createClient().rpc("publish_announcement", { p_title: title.trim(), p_body: body.trim() });
    setLoading(false);
    if (error) return setMessage(error.message);
    setTitle("");
    setBody("");
    setMessage("Annonce envoyée : elle apparaît dans les notifications de chaque inscrit.");
    router.refresh();
  }

  return (
    <form onSubmit={send}>
      <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#26352d", marginBottom: "14px" }}>
        Titre
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} style={input} placeholder="Ex. : Nouveau sur GOWINMALL : les missions" />
      </label>
      <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#26352d", marginBottom: "14px" }}>
        Message
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} style={input} placeholder="Ce que vous voulez annoncer…" />
      </label>
      <button type="submit" disabled={loading} style={{ padding: "13px 18px", background: "#087443", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Envoi…" : "Envoyer à tous les inscrits"}
      </button>
      {message && <div style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>{message}</div>}
    </form>
  );
}
