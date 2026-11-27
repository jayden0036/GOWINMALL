import type { Badge } from "@/lib/badges";

const tones = {
  blue: { bg: "#e6f0fd", color: "#1456b8" },
  amber: { bg: "#fff1d6", color: "#8a5a00" },
  green: { bg: "#e0f0e8", color: "#126b52" },
};

function Seal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l2.4 1.7 2.9-.2 1 2.7 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-1 2.7-2.9-.2L12 21.5l-2.4-1.7-2.9.2-1-2.7-2.4-1.7.9-2.8-.9-2.8 2.4-1.7 1-2.7 2.9.2z" fill="currentColor" stroke="none" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke="white" />
    </svg>
  );
}

// Coche « identité vérifiée » (verte), pour tous les vendeurs du catalogue
export function VerifiedMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#087443" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export default function SellerBadges({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) {
  if (badges.length === 0) return null;
  const list = compact ? badges.slice(0, 1) : badges;
  return (
    <span style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
      {list.map((b) => {
        const t = tones[b.tone];
        return (
          <span
            key={b.key}
            title={b.description}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: t.bg, color: t.color, fontWeight: 700, fontSize: compact ? "11px" : "12px", padding: compact ? "2px 8px 2px 5px" : "3px 10px 3px 6px", borderRadius: "999px", whiteSpace: "nowrap" }}
          >
            <Seal size={compact ? 13 : 15} />
            {b.label}
          </span>
        );
      })}
    </span>
  );
}
