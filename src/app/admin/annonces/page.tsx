import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import AnnouncementForm from "./announcement-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Annonces | GOWINMALL Admin" };

const card: React.CSSProperties = { background: "white", borderRadius: "14px", padding: "16px", marginBottom: "12px" };

function Frame({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#101b17", padding: "22px 16px 40px", fontFamily: "var(--font-dm-sans)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (!role) redirect("/");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin");

  const back = (
    <a href="/admin" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>
      ← Retour à l&apos;administration
    </a>
  );

  if (role !== "owner") {
    return (
      <Frame>
        {back}
        <div style={{ ...card, marginTop: "16px" }}>Les annonces sont réservées au propriétaire.</div>
      </Frame>
    );
  }

  const { data } = await supabase.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(10);
  const past = data ?? [];

  return (
    <Frame>
      {back}
      <h1 style={{ color: "white", fontSize: "24px", margin: "14px 0 6px" }}>Annonces</h1>
      <p style={{ color: "#9db3a8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 18px" }}>
        Une annonce apparaît dans les notifications (la cloche) de tous les inscrits. Utilisez-la pour les nouveautés et les mises à jour.
      </p>
      <div style={card}>
        <AnnouncementForm />
      </div>

      <h2 style={{ color: "white", fontSize: "17px", margin: "22px 0 10px" }}>Dernières annonces</h2>
      {past.length === 0 ? (
        <div style={card}>Aucune annonce pour le moment.</div>
      ) : (
        past.map((a) => (
          <div key={a.id} style={card}>
            <div style={{ fontWeight: 800, color: "#172d22" }}>{a.title}</div>
            <div style={{ fontSize: "14px", color: "#26352d", lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: "4px" }}>{a.body}</div>
            <div style={{ fontSize: "12px", color: "#68766e", marginTop: "6px" }}>{new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
          </div>
        ))
      )}
    </Frame>
  );
}
