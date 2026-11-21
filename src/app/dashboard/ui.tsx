import type { CSSProperties, ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/lib/format";

export const GREEN = "#126b52";
export const GREEN_SOFT = "#e0f0e8";
export const TEXT = "#172b25";
export const MUTED = "#718078";
export const BORDER = "#e5ebe7";

const css = `
.acct { max-width: 1100px; margin: 0 auto; padding: 22px 16px 96px; display: grid; grid-template-columns: 230px 1fr; gap: 24px; align-items: start; }
.acct-side { position: sticky; top: 92px; background: white; border: 1px solid ${BORDER}; border-radius: 16px; padding: 10px; display: grid; gap: 2px; }
.acct-link { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; color: #26352d; font-size: 14px; font-weight: 600; text-decoration: none; }
.acct-link:hover { background: #f1f6f3; }
.acct-link.on { background: ${GREEN_SOFT}; color: ${GREEN}; }
.acct-main { min-width: 0; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; margin-bottom: 14px; }
.field label { font-size: 13px; font-weight: 600; color: #26352d; }
.field input { padding: 12px; border: 1px solid #d5ded9; border-radius: 10px; font-size: 15px; font-family: inherit; box-sizing: border-box; width: 100%; }
.field input:focus { outline: 2px solid ${GREEN_SOFT}; border-color: ${GREEN}; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
@media (max-width: 850px) {
  .acct { grid-template-columns: 1fr; }
  .acct-side { position: fixed; z-index: 90; left: 0; right: 0; bottom: 0; top: auto; border-radius: 0; border: none; border-top: 1px solid ${BORDER}; padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px)); grid-auto-flow: column; grid-auto-columns: 1fr; gap: 0; }
  .acct-link { flex-direction: column; gap: 3px; padding: 6px 2px; font-size: 10.5px; text-align: center; }
  .grid2 { grid-template-columns: 1fr; }
}
`;

export const card: CSSProperties = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "16px",
};

export const h2: CSSProperties = { margin: "0 0 4px", fontSize: "17px", color: TEXT };
export const sub: CSSProperties = { margin: "0 0 14px", fontSize: "13px", color: MUTED, lineHeight: 1.5 };

export const primaryButton: CSSProperties = {
  display: "inline-block",
  padding: "11px 18px",
  background: GREEN,
  color: "white",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const ghostButton: CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  background: "white",
  color: "#26352d",
  border: "1px solid #d5ded9",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "14px",
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const navItems: { key: string; label: string; href: string; icon: ReactNode }[] = [
  {
    key: "apercu",
    label: "Tableau de bord",
    href: "/dashboard",
    icon: (
      <NavIcon>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </NavIcon>
    ),
  },
  {
    key: "commandes",
    label: "Commandes",
    href: "/commandes",
    icon: (
      <NavIcon>
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
        <path d="M3 7l9 4 9-4M12 11v10" />
      </NavIcon>
    ),
  },
  {
    key: "vendre",
    label: "Vendre",
    href: "/vendre",
    icon: (
      <NavIcon>
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M4 9v11h16V9" />
        <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      </NavIcon>
    ),
  },
  {
    key: "opportunites",
    label: "Opportunités",
    href: "/opportunites",
    icon: (
      <NavIcon>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </NavIcon>
    ),
  },
  {
    key: "parametres",
    label: "Paramètres",
    href: "/dashboard?section=parametres",
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
      </NavIcon>
    ),
  },
];

export function Shell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9f8", fontFamily: "var(--font-dm-sans)" }}>
      <style>{css}</style>
      <SiteHeader />
      <div className="acct">
        <nav className="acct-side" aria-label="Mon compte">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`acct-link${item.key === active ? " on" : ""}`}
              aria-current={item.key === active ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="acct-main">{children}</div>
      </div>
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ background: "white", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
      <div style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color: TEXT, lineHeight: 1.25 }}>{value}</div>
      {hint && <div style={{ fontSize: "12px", color: MUTED, marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "ok" | "wait" | "bad" | "todo"; children: ReactNode }) {
  const tones = {
    ok: { bg: GREEN_SOFT, color: GREEN },
    wait: { bg: "#fff4df", color: "#9a6a12" },
    bad: { bg: "#fdecea", color: "#b3261e" },
    todo: { bg: "#eef2ef", color: MUTED },
  };
  const t = tones[tone];
  return (
    <span style={{ background: t.bg, color: t.color, fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function sumByCurrency(rows: { currency: string; amount: number }[]): string {
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.currency] = (totals[r.currency] ?? 0) + r.amount;
  const parts = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => formatPrice(amount, currency));
  return parts.length > 0 ? parts.join(" · ") : "0";
}
