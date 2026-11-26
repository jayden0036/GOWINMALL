import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Badge, BORDER, card, formatDate, GREEN, h2, Kpi, MUTED, Shell, sub, sumByCurrency, TEXT } from "../dashboard/ui";
import CopyButton from "./copy-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliation | GOWINMALL" };

type Reward = { id: string; amount: number; currency: string; status: string; reference: string | null; created_at: string; paid_at: string | null };

const SITE = "https://gowinmall.vercel.app";

export default async function AffiliationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [codeRes, rewardsRes, countRes, settingsRes] = await Promise.all([
    supabase.rpc("get_my_affiliate_code"),
    supabase.from("affiliate_rewards").select("id, amount, currency, status, reference, created_at, paid_at").eq("referrer_id", user.id).neq("status", "cancelled").order("created_at", { ascending: false }).limit(100),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
    supabase.from("platform_settings").select("key, int_value").in("key", ["affiliate_share_bps", "affiliate_window_months"]),
  ]);

  const code = (codeRes.data as string | null) ?? "";
  const link = `${SITE}/register?ref=${code}`;
  const rewards = (rewardsRes.data ?? []) as Reward[];
  const settings = new Map((settingsRes.data ?? []).map((s) => [s.key as string, Number(s.int_value)]));
  const sharePct = (settings.get("affiliate_share_bps") ?? 3000) / 100;
  const months = settings.get("affiliate_window_months") ?? 6;
  const due = rewards.filter((r) => r.status === "due");
  const paid = rewards.filter((r) => r.status === "paid");
  const shareText = `Rejoins-moi sur GOWINMALL pour acheter, vendre et trouver des missions : ${link}`;

  return (
    <Shell active="affiliation">
      <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Affiliation</h1>
      <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>Recommandez GOWINMALL et recevez une récompense.</p>

      <section style={card}>
        <h2 style={h2}>Votre lien personnel</h2>
        <p style={sub}>Partagez-le. Les personnes qui s&apos;inscrivent avec ce lien sont rattachées à vous.</p>
        <div style={{ background: "#f1f6f3", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, color: GREEN, wordBreak: "break-all", marginBottom: "12px" }}>{link}</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <CopyButton text={link} label="Copier le lien" />
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 16px", background: "white", color: "#26352d", border: "1px solid #d5ded9", borderRadius: "10px", fontWeight: 600, fontSize: "14px" }}>
            Partager sur WhatsApp
          </a>
        </div>
        <p style={{ ...sub, margin: "12px 0 0" }}>Votre code : <strong style={{ color: TEXT }}>{code}</strong></p>
      </section>

      <div className="kpis" style={{ marginBottom: "16px" }}>
        <Kpi label="Personnes parrainées" value={countRes.count ?? 0} />
        <Kpi label="Récompenses à recevoir" value={sumByCurrency(due.map((r) => ({ currency: r.currency, amount: Number(r.amount) })))} />
        <Kpi label="Récompenses reçues" value={sumByCurrency(paid.map((r) => ({ currency: r.currency, amount: Number(r.amount) })))} />
      </div>

      <section style={card}>
        <h2 style={h2}>Comment ça marche</h2>
        <p style={{ ...sub, margin: 0 }}>
          Quand une personne que vous avez parrainée termine une commande ou une mission, vous recevez {sharePct.toLocaleString("fr-FR")} % de la commission de GOWINMALL sur cette commande.
          Cela dure {months} mois après son inscription. La récompense est versée par l&apos;équipe GOWINMALL, comme les reversements. Aucune récompense n&apos;est donnée pour une simple inscription, ni pour vos propres commandes.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ ...h2, marginBottom: "6px" }}>Mes récompenses</h2>
        {rewards.length === 0 ? (
          <p style={{ ...sub, margin: 0 }}>Aucune récompense pour le moment.</p>
        ) : (
          rewards.map((r, i) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}`, fontSize: "14px" }}>
              <div style={{ color: MUTED, fontSize: "13px" }}>
                {formatDate(r.paid_at ?? r.created_at)}
                {r.reference ? ` · réf. ${r.reference}` : ""}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: GREEN }}>{formatPrice(r.amount, r.currency)}</div>
                <Badge tone={r.status === "paid" ? "ok" : "todo"}>{r.status === "paid" ? "Reçue" : "À recevoir"}</Badge>
              </div>
            </div>
          ))
        )}
      </section>
    </Shell>
  );
}
