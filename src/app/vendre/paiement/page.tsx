"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { payoutMethodLabels } from "@/lib/format";

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "13px",
  marginTop: "7px",
  border: "1px solid #dce4df",
  borderRadius: "10px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  color: "#26352d",
  marginBottom: "16px",
  fontSize: "14px",
};

export default function PayoutPage() {
  const router = useRouter();
  const [method, setMethod] = useState("mpesa");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("seller_payout_details")
        .select("method, account, holder_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setMethod(data.method);
        setAccount(data.account);
        setHolder(data.holder_name);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("save_payout_details", {
      p_method: method,
      p_account: account,
      p_holder: holder,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/vendre");
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", padding: "30px 15px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "520px", margin: "auto", background: "white", padding: "26px 20px", borderRadius: "18px", boxShadow: "0 8px 35px #0000000d" }}>
        <a href="/vendre" style={{ color: "#087443", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          ← Mes offres
        </a>
        <h1 style={{ color: "#087443", margin: "12px 0 6px" }}>Où recevoir mon argent</h1>
        <p style={{ color: "#68766e", fontSize: "14px", marginTop: 0 }}>
          GOWINMALL vous reverse ici le montant de vos ventes, commission déduite. Ces informations sont
          privées : seuls vous et l&apos;équipe de paiement les voyez.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={label}>
            Moyen de réception
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={field}>
              {Object.entries(payoutMethodLabels).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>

          <label style={label}>
            Numéro ou compte
            <input value={account} onChange={(e) => setAccount(e.target.value)} maxLength={80} style={field} placeholder="Ex. : 0812 345 678" required />
          </label>

          <label style={label}>
            Nom du titulaire
            <input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={80} style={field} placeholder="Le nom enregistré sur ce numéro" required />
          </label>

          {message && (
            <p role="status" style={{ background: "#fff4df", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "16px", background: "#087443", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </main>
  );
              }
