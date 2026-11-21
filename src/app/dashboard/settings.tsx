import { payoutMethodLabels } from "@/lib/format";
import { saveProfile, signOut } from "./actions";
import { Badge, card, formatDate, ghostButton, GREEN, GREEN_SOFT, h2, MUTED, primaryButton, Shell, sub, TEXT } from "./ui";

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

export type Profile = {
  first_name: string | null;
  last_name: string | null;
  post_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  account_type: string | null;
  accepted_terms_at: string | null;
};

export type IdentityDoc = {
  doc_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

type Props = {
  profile: Profile | null;
  email: string;
  emailConfirmed: boolean;
  identity: "ok" | "wait" | "bad" | "todo";
  latestDoc: IdentityDoc | undefined;
  payout: { method: string; account: string; holder_name: string } | null;
  ok?: string;
  erreur?: string;
};

export default function SettingsView({ profile, email, emailConfirmed, identity, latestDoc, payout, ok, erreur }: Props) {
  const identityText =
    identity === "ok"
      ? "Votre identité est vérifiée."
      : identity === "wait"
        ? `${docLabels[latestDoc?.doc_type ?? ""] ?? "Document"} envoyé le ${latestDoc ? formatDate(latestDoc.created_at) : ""}, en cours de vérification.`
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
          Adresse e-mail du compte : <strong style={{ color: TEXT }}>{email}</strong>
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
              
