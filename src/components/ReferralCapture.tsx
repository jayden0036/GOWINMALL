"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const KEY = "gwm_ref";

// Garde le code de parrainage (?ref=CODE) jusqu'à la première connexion, puis l'enregistre.
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("ref");
      if (fromUrl && /^[A-Za-z0-9]{4,16}$/.test(fromUrl)) {
        localStorage.setItem(KEY, fromUrl.toUpperCase());
      }
      const code = localStorage.getItem(KEY);
      if (!code) return;
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) return;
        const { error } = await supabase.rpc("register_referral", { p_code: code });
        if (!error || !/Connexion requise/.test(error.message)) localStorage.removeItem(KEY);
      });
    } catch {
      // Stockage indisponible : on ignore.
    }
  }, []);
  return null;
}
