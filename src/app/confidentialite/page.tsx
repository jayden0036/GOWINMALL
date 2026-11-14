export const metadata = { title: "Politique de confidentialité | GOWINMALL" };

const CONTACT = "jaykn46@gmail.com";

export default function ConfidentialitePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", padding: "35px 15px", fontFamily: "Arial, sans-serif" }}>
      <article style={{ maxWidth: "720px", margin: "auto", background: "white", padding: "30px 22px", borderRadius: "18px", lineHeight: 1.7, color: "#26352d" }}>
        <a href="/" style={{ color: "#087443", fontWeight: 700, textDecoration: "none" }}>← GOWINMALL</a>
        <h1 style={{ color: "#087443" }}>Politique de confidentialité</h1>
        <p style={{ color: "#68766e", fontSize: "14px" }}>Dernière mise à jour : 14 novembre 2026</p>

        <h2>1. Données collectées</h2>
        <p>À l&apos;inscription : nom, postnom, prénom, adresse e-mail, numéro de téléphone, pays, ville, genre (facultatif) et type de compte. Si vous lancez la vérification d&apos;identité : la pièce d&apos;identité que vous déposez et son type.</p>
        <p>Si vous vendez : vos coordonnées de reversement (moyen de réception, numéro ou compte, nom du titulaire), visibles uniquement par vous et par l&apos;équipe habilitée. Si vous commandez : vos commandes et les références de paiement que vous déclarez.</p>
        <h2>2. Pourquoi ces données</h2>
        <p>Créer et sécuriser votre compte, confirmer votre adresse e-mail, vérifier votre identité et faire fonctionner la plateforme.</p>

        <h2>3. Qui y accède</h2>
        <p>Vous voyez vos propres données. Seuls les administrateurs disposant des droits nécessaires peuvent consulter la liste des inscrits et examiner les pièces d&apos;identité. Leurs consultations sont enregistrées dans un journal.</p>

        <h2>4. Où elles sont stockées</h2>
        <p>Les données sont hébergées chez nos prestataires techniques : Supabase (base de données, authentification, stockage des documents, dans un espace privé) et Vercel (hébergement du site).</p>

        <h2>5. Cookies</h2>
        <p>GOWINMALL utilise uniquement les cookies nécessaires à votre connexion. Aucun cookie publicitaire n&apos;est utilisé.</p>

        <h2>6. Conservation et vos droits</h2>
        <p>Vos données sont conservées tant que votre compte existe. Vous pouvez demander l&apos;accès à vos données, leur correction ou leur suppression en nous écrivant.</p>

        <h2>7. Contact</h2>
        <p>{CONTACT}</p>
      </article>
    </main>
  );
}
