import type { SupabaseClient } from "@supabase/supabase-js";

export type Badge = { key: string; label: string; description: string; tone: "blue" | "amber" | "green" };

// Badges attribués à la main par l'administrateur, indexés par vendeur.
export async function getBadgesFor(supabase: SupabaseClient, sellerIds: string[]): Promise<Map<string, Badge[]>> {
  const result = new Map<string, Badge[]>();
  const ids = Array.from(new Set(sellerIds));
  if (ids.length === 0) return result;

  const [typesRes, grantedRes] = await Promise.all([
    supabase.from("badge_types").select("key, label, description, tone, sort_order").order("sort_order"),
    supabase.from("seller_badges").select("user_id, badge_key").in("user_id", ids),
  ]);
  const types = new Map<string, Badge>();
  for (const t of typesRes.data ?? []) {
    types.set(t.key as string, { key: t.key as string, label: t.label as string, description: t.description as string, tone: t.tone as Badge["tone"] });
  }
  const order = Array.from(types.keys());
  for (const g of grantedRes.data ?? []) {
    const badge = types.get(g.badge_key as string);
    if (!badge) continue;
    const list = result.get(g.user_id as string) ?? [];
    list.push(badge);
    list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    result.set(g.user_id as string, list);
  }
  return result;
}
