import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mon tableau de bord | GOWINMALL" };

type State = "done" | "wait" | "bad" | "todo";

const stateStyle: Record<State, { color: string; bg: string; icon: string }> = {
  done: { color: "#087443", bg: "#e8f5ed", icon: "✓" },
  wait: { color: "#b7791f", bg: "#fff4df", icon: "…" },
  bad: { color: "#b3261e", bg: "#fdecea", icon: "!" },
  todo: { color: "#68766e", bg: "#eef2ef", icon: "○" },
};

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

const card: React.CSSProperties = {
  background: "white",
  padding: "22px 20px",
  borderRadius: "18px",
  boxShadow: "0 8px 35px #0000000d",
  marginBottom: "16px",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, city, country, account_type, accepted_terms_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: docs } = await supabase
    .from("identity_documents")
    .select("doc_type, status, rejection_reason, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const documents = docs ?? [];
  const approved = documents.some((d) => d.status === "approved");
  const latest = documents[0];

  let identityState: State = "todo";
  let identityText = "Envoyez une pièce d'identité pour faire vérifier votre compte.";
  let identityButton = "Envoyer une pièce d'identité";

  if (approved) {
    identityState = "done";
    identityText = "Votre identité est vérifiée.";
    identityButton = "";
  } else if (latest?.status === "pending") {
    identityState = "wait";
    identityText = `${docLabels[latest.doc_type] ?? "Document"} envoyé le ${formatDate(latest.created_at)}. Il est en cours de vérification.`;
    identityButton = "";
  } else if (latest?.status === "rejected") {
    identityState = "bad";
    identityText = `Votre dernier document a été refusé.${latest.rejection_reason ? " Motif : " + latest.rejection_reason + "." : ""} Vous pouvez en envoyer un autre.`;
    identityButton = "Envoyer un nouveau document";
  }

  const emailConfirmed = Boolean(user.email_confirmed_at);
  const termsAccepted = Boolean(profile?.accepted_terms_at);

  const steps: { title: string; state: State; text: string }[] = [
    { title: "Compte créé", state: "done", text: "Votre compte GOWINMALL est actif." },
    {
      title: "Adresse e-mail confirmée",
      state: emailConfirmed ? "done" : "todo",
      text: user.email ?? "",
    },
    {
      title: "Conditions acceptées",
      state: termsAccepted ? "done" : "todo",
      text: termsAccepted
                ? `Acceptées le ${formatDate(profile?.accepted_terms_at)}.`
        : "L'acceptation n'est pas enregistrée pour ce compte.",
    },
    { title: "Identité vérifiée", state: identityState, text: identityText },
  ];

  const doneCount = steps.filter((s) => s.state === "done").length;
  const percent = Math.round((doneCount / steps.length) * 100);

  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const missing: string[] = [];
  if (!profile?.first_name) missing.push("prénom");
  if (!profile?.phone) missing.push("téléphone");
  if (!profile?.city) missing.push("ville");

  const infos: [string, string][] = [
    ["Nom", name || "Non renseigné"],
    ["E-mail", user.email ?? "Non renseigné"],
    ["Téléphone", profile?.phone || "Non renseigné"],
    ["Ville", profile?.city || "Non renseignée"],
    ["Pays", profile?.country || "Non renseigné"],
    ["Type de compte", accountLabels[profile?.account_type] ?? "Particulier"],
  ];

  const comingSoon = ["Mes achats", "Mes ventes", "Mes revenus", "Mes retraits"];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f5",
        padding: "30px 15px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "560px", margin: "auto" }}>
        <h1 style={{ color: "#087443", textAlign: "center", margin: "0 0 4px" }}>
          GOWINMALL
        </h1>
        <p style={{ textAlign: "center", color: "#68766e", margin: "0 0 20px" }}>
          Mon tableau de bord
        </p>

        <section style={card}>
          <h2 style={{ margin: 0, color: "#172d22" }}>
            {name ? `Bonjour ${name}` : "Bonjour"}
          </h2>
          <p style={{ color: "#68766e", fontSize: "14px" }}>
            {doneCount} étape{doneCount > 1 ? "s" : ""} sur {steps.length} terminée
            {doneCount > 1 ? "s" : ""}.
          </p>
          <div style={{ background: "#e5ebe7", borderRadius: "999px", height: "10px" }}>
            <div
              style={{
                width: `${percent}%`,
                background: "#087443",
                borderRadius: "999px",
                height: "10px",
              }}
            />
          </div>
        </section>

        <section style={card}>
          <h3 style={{ margin: "0 0 12px", color: "#172d22" }}>Où en est mon compte</h3>
          {steps.map((s) => {
            const st = stateStyle[s.state];
            return (
              <div
                key={s.title}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "10px 0",
                  borderTop: "1px solid #e5ebe7",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: st.bg,
                    color: st.color,
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: "28px",
                  }}
                >
                  {st.icon}
                </div>
                <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
                  <strong style={{ color: "#172d22" }}>{s.title}</strong>
                  <div style={{ color: "#68766e" }}>{s.text}</div>
                </div>
              </div>
            );
          })}

          {identityButton && (
            <a
              href="/verification"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "14px",
                padding: "14px",
                background: "#087443",
                color: "white",
                borderRadius: "10px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              {identityButton}
            </a>
          )}
          {!identityButton && identityState === "wait" && (
            <a
              href="/verification"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "14px",
                color: "#087443",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Voir mes documents
            </a>
          )}
        </section>

        <section style={card}>
          <h3 style={{ margin: "0 0 12px", color: "#172d22" }}>Mes informations</h3>
          {infos.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                padding: "8px 0",
                borderTop: "1px solid #e5ebe7",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "#68766e" }}>{label}</span>
              <span style={{ color: "#172d22", textAlign: "right" }}>{value}</span>
            </div>
          ))}
          {missing.length > 0 && (
            <p
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "#fff4df",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              Informations à compléter : {missing.join(", ")}. La modification du
              profil sera bientôt disponible.
            </p>
          )}
        </section>

        <section style={card}>
          <h3 style={{ margin: "0 0 6px", color: "#172d22" }}>Bientôt disponible</h3>
          <p style={{ color: "#68766e", fontSize: "13px", marginTop: 0 }}>
            Ces espaces s&apos;ouvriront avec les prochaines fonctionnalités de GOWINMALL.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {comingSoon.map((label) => (
              <span
                key={label}
                style={{
                  padding: "8px 12px",
                  background: "#eef2ef",
                  color: "#68766e",
                  borderRadius: "999px",
                  fontSize: "13px",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <form action={signOut} style={{ textAlign: "center", marginTop: "8px" }}>
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "1px solid #dce4df",
              borderRadius: "10px",
              padding: "12px 20px",
              color: "#26352d",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
