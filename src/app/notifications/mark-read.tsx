"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Marque les notifications comme lues une fois la page affichée.
export default function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (!hasUnread) return;
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("channel", "in_app")
      .then(() => undefined);
  }, [hasUnread]);
  return null;
}
