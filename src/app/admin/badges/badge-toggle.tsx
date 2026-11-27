"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BadgeToggle({ userId, badge, label, has }: { userId: string; badge: string; label: string; has: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    const question = has ? `Retirer le badge « ${label} » ?` : `Donner le badge « ${label} » ? Il sera visible par tous les visiteurs.`;
    if (!window.confirm(question)) return;
    setMessage("");
    setLoading(true);
    const { error } = await createClient().rpc(has ? "admin_revoke_badge" : "admin_grant_badge", { p_user: userId, p_badge: badge });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        style={{
          padding: "9px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          border: has ? "1px solid #dce4df" : "none",
          background: has ? "white" : "#087443",
          color: has ? "#26352d" : "white",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {has ? `Retirer : ${label}` : `Donner : ${label}`}
      </button>
      {message && <div style={{ marginTop: "6px", padding: "8px", background: "#fff4df", borderRadius: "8px", fontSize: "12px" }}>{message}</div>}
    </div>
  );
}
