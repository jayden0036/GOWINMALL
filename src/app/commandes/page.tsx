import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/lib/format";
import { orderCode, orderStatusLabels } from "@/lib/order-labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes | GOWINMALL" };

type Row = {
  id: string;
  offer_title: string;
  unit_amount: number;
  seller_amount: number | null;
  currency: string;
  status: string;
  created_at: string;
};

function List({ rows, seller }: { rows: Row[]; seller: boolean }) {
  if (rows.length === 0) {
    return (
      <div style={{ background: "white", padding: "18px", borderRadius: "16px", color: "#68766e", fontSize: "14px" }}>
        Aucune commande pour le moment.
      </div>
    );
  }
  return (
    <>
      {rows.map((o) => (
        <a
          key={o.id}
          href={`/commandes/${o.id}`}
          style={{ display: "block", background: "white", padding: "16px", borderRadius: "16px", boxShadow: "0 8px 35px #0000000d", marginBottom: "10px", textDecoration: "none", color: "#172d22" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <strong>{o.offer_title}</strong>
            <strong style={{ whiteSpace: "nowrap" }}>
              {formatPrice(seller ? o.seller_amount ?? o.unit_amount : o.unit_amount, o.currency)}
            </strong>
          </div>
          <div style={{ fontSize: "13px", color: "#68766e", marginTop: "4px" }}>
            {orderCode(o.id)} · {new Date(o.created_at).toLocaleDateString("fr-FR")} ·{" "}
            {orderStatusLabels[o.status] ?? o.status}
          </div>
        </a>
      ))}
    </>
  );
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const columns = "id, offer_title, unit_amount, seller_amount, currency, status, created_at";
  const { data: bought } = await supabase
    .from("orders")
    .select(columns)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });
  const { data: sold } = await supabase
    .from("orders")
    .select(columns)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", fontFamily: "Arial, sans-serif" }}>
      <SiteHeader />
      <div style={{ maxWidth: "620px", margin: "auto", padding: "24px 15px" }}>
        <h1 style={{ color: "#087443", margin: "0 0 18px" }}>Mes commandes</h1>

        <h2 style={{ fontSize: "17px", color: "#172d22" }}>Mes achats</h2>
        <List rows={(bought ?? []) as Row[]} seller={false} />

        <h2 style={{ fontSize: "17px", color: "#172d22", marginTop: "24px" }}>Mes ventes</h2>
        <List rows={(sold ?? []) as Row[]} seller />
      </div>
    </main>
  );
    }
