import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { card, h2, MUTED, Shell, sub, TEXT } from "../../dashboard/ui";
import MissionForm from "./mission-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Publier une mission | GOWINMALL" };

export default async function NewMissionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fee } = await supabase.from("fee_schedule").select("rate_bps").eq("offer_type", "service").maybeSingle();

  return (
    <Shell active="missions">
      <a href="/missions" style={{ color: MUTED, fontSize: "13px", fontWeight: 600 }}>
        ← Retour aux missions
      </a>
      <h1 style={{ margin: "8px 0 4px", fontSize: "24px", color: TEXT }}>Publier une mission</h1>
      <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>Décrivez ce dont vous avez besoin, des personnes vérifiées pourront postuler.</p>
      <section style={card}>
        <h2 style={h2}>Votre mission</h2>
        <p style={sub}>Vous ne payez qu&apos;une fois le travailleur choisi, et GOWINMALL ne le paie qu&apos;après votre validation.</p>
        <MissionForm rateBps={fee?.rate_bps ?? 0} />
      </section>
    </Shell>
  );
}
