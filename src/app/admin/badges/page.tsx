import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import BadgeToggle from "./badge-toggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Badges | GOWINMALL Admin" };

type Seller = { user_id: string; display_name: string; city: string; sales_count: number; badges: string[] };
type BadgeType = { key: string; label: string; description: string };

const card: React.CSSProperties = { background: "white", borderRadius: "14px", padding: "16px", marginBottom: "12px" };

function Frame({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#101b17", padding: "22px 16px 40px", fontFamily: "var(--font-dm-sans)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "auto" }}>{children}</div>
    </main>
  );
}

export default async function AdminBadgesPage() {
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
        <div style={{ ...card, marginTop: "16px" }}>L&apos;attribution des badges est réservée au propriétaire.</div>
      </Frame>
    );
  }

  const [sellersRes, typesRes] = await Promise.all([
    supabase.rpc("admin_seller_overview"),
    supabase.from("badge_types").select("key, label, description").order("sort_order"),
  ]);
  const sellers = (sellersRes.data ?? []) as Seller[];
  const types = (typesRes.data ?? []) as BadgeType[];

  return (
    <Frame>
      {back}
      <h1 style={{ color: "white", fontSize: "24px", margin: "14px 0 6px" }}>Badges des vendeurs</h1>
      <p style={{ color: "#9db3a8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 18px" }}>
        Les badges sont visibles par tous les visiteurs sur le catalogue et les fiches produits. Vous les donnez et les retirez vous-même.
        Repère conseillé pour « Vendeur fidèle » : 100 ventes réussies (ventes dont le reversement est dû ou payé).
      </p>

      <div style={{ ...card, background: "#17251f", color: "#c5d4cc", fontSize: "13px", lineHeight: 1.6 }}>
        {types.map((t) => (
          <div key={t.key}>
            <strong style={{ color: "white" }}>{t.label}</strong> : {t.description}
          </div>
        ))}
      </div>

      {sellers.length === 0 ? (
        <div style={card}>Aucun vendeur pour le moment.</div>
      ) : (
        sellers.map((s) => {
          const reached = Number(s.sales_count) >= 100 && !s.badges.includes("fidele");
          return (
            <div key={s.user_id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, color: "#172d22", fontSize: "16px" }}>
                  {s.display_name || "Vendeur sans nom"}
                  {s.city ? <span style={{ color: "#68766e", fontWeight: 500, fontSize: "13px" }}> · {s.city}</span> : null}
                </div>
                <div style={{ fontSize: "13px", color: "#26352d" }}>
                  <strong>{Number(s.sales_count)}</strong> vente{Number(s.sales_count) > 1 ? "s" : ""} réussie{Number(s.sales_count) > 1 ? "s" : ""}
                </div>
              </div>
              {reached && (
                <div style={{ marginTop: "8px", background: "#fff1d6", color: "#8a5a00", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}>
                  100 ventes atteintes : vous pouvez lui donner le badge « Vendeur fidèle ».
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                {types.map((t) => (
                  <BadgeToggle key={t.key} userId={s.user_id} badge={t.key} label={t.label} has={s.badges.includes(t.key)} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </Frame>
  );
}
