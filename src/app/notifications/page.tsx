import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BORDER, card, formatDate, GREEN, h2, MUTED, Shell, sub, TEXT } from "../dashboard/ui";
import MarkRead from "./mark-read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications | GOWINMALL" };

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { mission_id?: string; order_id?: string } | null;
  read_at: string | null;
  created_at: string;
};

function target(n: Notification): string | null {
  if (n.data?.mission_id) return `/missions/${n.data.mission_id}`;
  if (n.data?.order_id) return `/commandes/${n.data.order_id}`;
  if (n.type === "affiliate_reward") return "/affiliation";
  return null;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, data, read_at, created_at")
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as Notification[];
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <Shell active="notifications">
      <MarkRead hasUnread={hasUnread} />
      <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Notifications</h1>
      <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>Les dernières nouvelles concernant votre compte.</p>

      <section style={card}>
        <h2 style={h2}>Récentes</h2>
        {items.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Aucune notification pour le moment.</p>
        ) : (
          items.map((n, i) => {
            const href = target(n);
            const content = (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "7px", flexShrink: 0, background: n.read_at ? "transparent" : GREEN }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: n.read_at ? 600 : 800, color: TEXT }}>{n.title}</div>
                  {n.body && <div style={{ color: MUTED }}>{n.body}</div>}
                  <div style={{ color: MUTED, fontSize: "12px", marginTop: "2px" }}>{formatDate(n.created_at)}</div>
                </div>
              </div>
            );
            return href ? (
              <a key={n.id} href={href} style={{ display: "block", color: "inherit" }}>
                {content}
              </a>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })
        )}
      </section>
    </Shell>
  );
}
