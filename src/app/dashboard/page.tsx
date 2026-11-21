import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, payoutMethodLabels } from "@/lib/format";
import { orderCode, orderStatusLabels } from "@/lib/order-labels";

export const metadata = { title: "Mon compte | GOWINMALL" };
export const dynamic = "force-dynamic";

const GREEN = "#126b52";
const GREEN_SOFT = "#e0f0e8";
const TEXT = "#172b25";
const MUTED = "#718078";
const BORDER = "#e5ebe7";

const docLabels: Record<string, string> = {
  carte_electeur: "Carte d'électeur",
  passeport: "Passeport",
  permis_conduire: "Permis de conduire",
  carte_identite: "Carte d'identité",
};

const accountLabels: Record<string, string> = {
  particulier: "Particulier",
  vendeur: "Vendeur",
  entreprise: "Entreprise",
  prestataire: "Prestataire de services",
  affilie: "Affilié",
};

type Profile = {
  first_name: string | null;
  last_name: string | null;
  post_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  account_type: string | null;
  accepted_terms_at: string | null;
};

type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  offer_title: string;
  unit_amount: number;
  seller_amount: number | null;
  currency: string;
  status: string;
  payout_status: string;
  created_at: string;
};

type SearchParams = { section?: string; ok?: string; erreur?: string };

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

const card: CSSProperties = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "16px",
};

const h2: CSSProperties = { margin: "0 0 4px", fontSize: "17px", color: TEXT };
const sub: CSSProperties = { margin: "0 0 14px", fontSize: "13px", color: MUTED, lineHeight: 1.5 };

const primaryButton: CSSProperties = {
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

const ghostButton: CSSProperties = {
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

function Shell({ active, children }: { active: string; children: ReactNode }) {
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

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ background: "white", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
      <div style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color: TEXT, lineHeight: 1.25 }}>{value}</div>
      {hint && <div style={{ fontSize: "12px", color: MUTED, marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "wait" | "bad" | "todo"; children: ReactNode }) {
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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function sumByCurrency(rows: { currency: string; amount: number }[]): string {
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.currency] = (totals[r.currency] ?? 0) + r.amount;
  const parts = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => formatPrice(amount, currency));
  return parts.length > 0 ? parts.join(" · ") : "0";
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function saveProfile(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const first_name = field("first_name", 60);
  const phone = field("phone", 30);

  if (!first_name) redirect("/dashboard?section=parametres&erreur=nom");
  if (phone && !/^[+0-9 ()-]{6,30}$/.test(phone)) redirect("/dashboard?section=parametres&erreur=telephone");

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name: field("last_name", 60),
      post_name: field("post_name", 60),
      phone,
      city: field("city", 80),
      country: field("country", 80),
    })
    .eq("id", user.id);

  if (error) redirect("/dashboard?section=parametres&erreur=enregistrement");
  redirect("/dashboard?section=parametres&ok=profil");
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { section, ok, erreur } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, docsRes, ordersRes, offersRes, payoutRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, post_name, phone, city, country, account_type, accepted_terms_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("identity_documents")
      .select("doc_type, status, rejection_reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, buyer_id, seller_id, offer_title, unit_amount, seller_amount, currency, status, payout_status, created_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("offers").select("id, status").eq("seller_id", user.id),
    supabase.from("seller_payout_details").select("method, account, holder_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = (profileRes.data ?? null) as Profile | null;
  const documents = (docsRes.data ?? []) as { doc_type: string; status: string; rejection_reason: string | null; created_at: string }[];
  const orders = (ordersRes.data ?? []) as Order[];
  const offers = (offersRes.data ?? []) as { id: string; status: string }[];
  const payout = (payoutRes.data ?? null) as { method: string; account: string; holder_name: string } | null;

  const approved = documents.some((d) => d.status === "approved");
  const latestDoc = documents[0];
  const identity: "ok" | "wait" | "bad" | "todo" = approved
    ? "ok"
    : latestDoc?.status === "pending"
      ? "wait"
      : latestDoc?.status === "rejected"
        ? "bad"
        : "todo";

  const emailConfirmed = Boolean(user.email_confirmed_at);
  const firstName = profile?.first_name?.trim() ?? "";
  const missing: string[] = [];
  if (!firstName) missing.push("prénom");
  if (!profile?.phone) missing.push("téléphone");
  if (!profile?.city) missing.push("ville");

  const purchases = orders.filter((o) => o.buyer_id === user.id);
  const sales = orders.filter((o) => o.seller_id === user.id);
  const isSeller = offers.length > 0 || sales.length > 0;

  if (section === "parametres") {
    const identityText =
      identity === "ok"
        ? "Votre identité est vérifiée."
        : identity === "wait"
          ? `${docLabels[latestDoc.doc_type] ?? "Document"} envoyé le ${formatDate(latestDoc.created_at)}, en cours de vérification.`
          : identity === "bad"
            ? `Votre dernier document a été refusé.${latestDoc?.rejection_reason ? " Motif : " + latestDoc.rejection_reason + "." : ""}`
            : "Aucun document envoyé pour le moment.";

    const messages: Record<string, string> = {
      nom: "Le prénom est obligatoire.",
      telephone: "Le numéro de téléphone n'est pas valide.",
      enregistrement: "L'enregistrement a échoué. Réessayez dans un instant.",
    };

    return (
      <Shell active="parametres">
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: TEXT }}>Paramètres</h1>
        <p style={{ margin: "0 0 18px", fontSize: "14px", color: MUTED }}>
          Gérez votre profil, votre vérification et vos coordonnées de reversement.
        </p>

        {ok === "profil" && (
          <div style={{ background: GREEN_SOFT, color: GREEN, padding: "12px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
            Votre profil est enregistré.
          </div>
        )}
        {erreur && messages[erreur] && (
          <div style={{ background: "#fdecea", color: "#b3261e", padding: "12px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
            {messages[erreur]}
          </div>
        )}

        <section style={card}>
          <h2 style={h2}>Profil</h2>
          <p style={sub}>Ces informations sont utilisées pour vos commandes et vos offres.</p>
          <form action={saveProfile}>
            <div className="grid2">
              <div className="field">
                <label htmlFor="first_name">Prénom</label>
                <input id="first_name" name="first_name" defaultValue={profile?.first_name ?? ""} maxLength={60} required autoComplete="given-name" />
              </div>
              <div className="field">
                <label htmlFor="last_name">Nom</label>
                <input id="last_name" name="last_name" defaultValue={profile?.last_name ?? ""} maxLength={60} autoComplete="family-name" />
              </div>
              <div className="field">
                <label htmlFor="post_name">Postnom</label>
                <input id="post_name" name="post_name" defaultValue={profile?.post_name ?? ""} maxLength={60} />
              </div>
              <div className="field">
                <label htmlFor="phone">Téléphone</label>
                <input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} maxLength={30} placeholder="+243 ..." autoComplete="tel" />
              </div>
              <div className="field">
                <label htmlFor="city">Ville</label>
                <input id="city" name="city" defaultValue={profile?.city ?? ""} maxLength={80} autoComplete="address-level2" />
              </div>
              <div className="field">
                <label htmlFor="country">Pays</label>
                <input id="country" name="country" defaultValue={profile?.country ?? ""} maxLength={80} autoComplete="country-name" />
              </div>
            </div>
            <button type="submit" style={primaryButton}>
              Enregistrer le profil
            </button>
          </form>
        </section>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
            <div>
              <h2 style={h2}>Vérification d&apos;identité</h2>
              <p style={{ ...sub, marginBottom: "12px" }}>{identityText}</p>
            </div>
            <Badge tone={identity}>
              {identity === "ok" ? "Vérifiée" : identity === "wait" ? "En cours" : identity === "bad" ? "Refusée" : "À faire"}
            </Badge>
          </div>
          {identity !== "ok" && identity !== "wait" && (
            <a href="/verification" style={primaryButton}>
              {identity === "bad" ? "Envoyer un nouveau document" : "Envoyer une pièce d'identité"}
            </a>
          )}
          {identity === "wait" && (
            <a href="/verification" style={ghostButton}>
              Voir mes documents
            </a>
          )}
        </section>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
            <div>
              <h2 style={h2}>Reversement</h2>
              <p style={{ ...sub, marginBottom: "12px" }}>
                {payout
                  ? `${payoutMethodLabels[payout.method] ?? payout.method} · compte se terminant par ${payout.account.slice(-3)} · ${payout.holder_name}`
                  : "Indiquez où recevoir l'argent de vos ventes. Cette étape est nécessaire pour publier une offre."}
              </p>
            </div>
            <Badge tone={payout ? "ok" : "todo"}>{payout ? "Enregistré" : "À faire"}</Badge>
          </div>
          <a href="/vendre/paiement" style={payout ? ghostButton : primaryButton}>
            {payout ? "Modifier" : "Ajouter mes coordonnées"}
          </a>
        </section>

        <section style={card}>
          <h2 style={h2}>Sécurité</h2>
          <p style={sub}>
            Adresse e-mail du compte : <strong style={{ color: TEXT }}>{user.email}</strong>
            {emailConfirmed ? " (confirmée)" : " (non confirmée)"}. Pour changer votre mot de passe, un lien vous sera envoyé par e-mail.
          </p>
          <a href="/mot-de-passe-oublie" style={ghostButton}>
            Changer mon mot de passe
          </a>
        </section>

        <section style={card}>
          <h2 style={h2}>Compte</h2>
          <p style={sub}>
            Type de compte : <strong style={{ color: TEXT }}>{accountLabels[profile?.account_type ?? "particulier"] ?? "Particulier"}</strong>
            {profile?.accepted_terms_at ? ` · Conditions acceptées le ${formatDate(profile.accepted_terms_at)}` : ""}
          </p>
          <form action={signOut}>
            <button type="submit" style={ghostButton}>
              Se déconnecter
            </button>
          </form>
        </section>
      </Shell>
    );
  }

  const inProgress = purchases.filter((o) => ["pending_payment", "payment_declared", "paid"].includes(o.status));
  const completed = purchases.filter((o) => o.status === "completed");
  const paidPurchases = purchases.filter((o) => ["paid", "completed"].includes(o.status));
  const soldOrders = sales.filter((o) => ["paid", "completed"].includes(o.status));
  const toReceive = sales.filter((o) => o.payout_status === "due");
  const alreadyPaid = sales.filter((o) => o.payout_status === "paid");
  const publishedOffers = offers.filter((o) => o.status === "published").length;

  const tasks: { title: string; text: string; href?: string; cta?: string }[] = [];
  if (!emailConfirmed) {
    tasks.push({ title: "Confirmez votre adresse e-mail", text: `Un message de confirmation a été envoyé à ${user.email}.` });
  }
  if (missing.length > 0) {
    tasks.push({
      title: "Complétez votre profil",
      text: `À renseigner : ${missing.join(", ")}.`,
      href: "/dashboard?section=parametres",
      cta: "Compléter",
    });
  }
  if (identity === "todo" || identity === "bad") {
    tasks.push({
      title: identity === "bad" ? "Renvoyez un document d'identité" : "Faites vérifier votre identité",
      text: identity === "bad" ? "Votre dernier document a été refusé." : "Nécessaire pour publier des offres.",
      href: "/verification",
      cta: "Envoyer",
    });
  }
  if (identity === "wait") {
    tasks.push({ title: "Identité en cours de vérification", text: "Notre équipe examine votre document." });
  }
  if (isSeller && !payout) {
    tasks.push({
      title: "Ajoutez vos coordonnées de reversement",
      text: "Pour recevoir l'argent de vos ventes.",
      href: "/vendre/paiement",
      cta: "Ajouter",
 
