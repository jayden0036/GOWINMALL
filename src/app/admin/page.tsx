import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { MfaPanel, SignOutButton } from "./mfa-panel";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  post_name: string;
  phone: string;
  city: string;
  account_type: string;
  created_at: string;
};

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  moderator: "Modérateur",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101b17",
        padding: "24px 16px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "14px",
  padding: "20px",
  flex: "1 1 200px",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("my_admin_role");
  if (!role) redirect("/");

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel !== "aal2") {
    return (
      <Shell>
        <MfaPanel mode={aal?.nextLevel === "aal2" ? "verify" : "enroll"} />
      </Shell>
    );
  }

  // Affichage seulement : la vraie protection des données est dans la base (RLS).
  const canViewUsers = role === "owner" || role === "admin";

  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: pendingDocs } = await supabase
    .from("identity_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  let recent: Row[] = [];
  if (canViewUsers) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, post_name, phone, city, account_type, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);
    recent = (data ?? []) as Row[];

    await supabase.rpc("log_admin_action", {
      p_action: "consultation_liste_utilisateurs",
    });
  }

  return (
    <Shell>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          color: "white",
          marginBottom: "22px",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: 800 }}>
            GOWIN <span style={{ color: "#f5a623" }}>ADMIN</span>
          </div>
          <div style={{ fontSize: "13px", color: "#9db3a8" }}>
            {roleLabels[role as string] ?? role} · {user.email}
          </div>
        </div>
        <SignOutButton />
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", color: "#718078" }}>Inscrits</div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#087443" }}>
            {canViewUsers ? usersCount ?? 0 : "—"}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", color: "#718078" }}>
            Documents d&apos;identité en attente
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#b18a35" }}>
            {pendingDocs ?? 0}
          </div>
        </div>
      </div>

      {canViewUsers && (
        <div style={{ ...cardStyle, marginTop: "14px" }}>
          <h3 style={{ marginTop: 0, color: "#172d22" }}>
            Dernières inscriptions
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                minWidth: "560px",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", color: "#718078" }}>
                  <th style={{ padding: "8px" }}>Nom</th>
                  <th style={{ padding: "8px" }}>Téléphone</th>
                  <th style={{ padding: "8px" }}>Ville</th>
                  <th style={{ padding: "8px" }}>Type</th>
                  <th style={{ padding: "8px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #e5ebe7" }}>
                    <td style={{ padding: "8px" }}>
                      {[p.first_name, p.post_name, p.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td style={{ padding: "8px" }}>{p.phone}</td>
                    <td style={{ padding: "8px" }}>{p.city}</td>
                    <td style={{ padding: "8px" }}>{p.account_type}</td>
                    <td style={{ padding: "8px" }}>
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
            }
