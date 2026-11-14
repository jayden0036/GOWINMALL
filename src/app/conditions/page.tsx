export const metadata = { title: "Conditions d'utilisation | GOWINMALL" };

const CONTACT = "jaykn46@gmail.com";

export default function ConditionsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f8f5", padding: "35px 15px", fontFamily: "Arial, sans-serif" }}>
      <article style={{ maxWidth: "720px", margin: "auto", background: "white", padding: "30px 22px", borderRadius: "18px", lineHeight: 1.7, color: "#26352d" }}>
        <a href="/" style={{ color: "#087443", fontWeight: 700, textDecoration: "none" }}>← GOWINMALL</a>
        <h1 style={{ color: "#087443" }}>Conditions d&apos;utilisation</h1>
        <p style={{ color: "#68766e", fontSize: "14px" }}>Dernière mise à jour : 8 novembre 2026</p>

        <h2>1. Objet</h2>
        <p>GOWINMALL est une plateforme en développement destinée à connecter des personnes, des entreprises et des entrepreneurs. Certaines fonctionnalités (achat, vente, services, missions, affiliation) ne sont pas encore disponibles. L&apos;utiliser implique d&apos;accepter les présentes conditions.</p>

        <h2>2. Compte</h2>
        <p>Vous devez être majeur selon la loi de votre pays et fournir des informations exactes. Votre adresse e-mail doit être confirmée grâce au lien reçu par e-mail avant d&apos;accéder à votre espace. Vous êtes responsable de la confidentialité de votre mot de passe.</p>

        <h2>3. Vérification d&apos;identité</h2>
        <p>Vous pouvez déposer une pièce d&apos;identité (carte d&apos;électeur, passeport, permis de conduire ou carte d&apos;identité). Elle doit être authentique, lisible et vous appartenir. GOWINMALL peut accepter ou refuser un document.</p>

        <h2>4. Comportements interdits</h2>
        <p>Il est interdit de fournir de fausses informations, d&apos;usurper l&apos;identité d&apos;une autre personne, de déposer un document falsifié, de tenter d&apos;accéder aux comptes ou aux données d&apos;autrui, ou de perturber le fonctionnement du service.</p>

        <h2>5. Suspension</h2>
        <p>GOWINMALL peut suspendre ou fermer un compte en cas de non-respect de ces conditions.</p>

        <h2>6. Disponibilité</h2>
        <p>Le service est fourni en l&apos;état et peut être interrompu ou modifié, notamment pendant son développement.</p>

        <h2>7. Modification des conditions</h2>
        <p>Ces conditions peuvent évoluer. La date de mise à jour figure en haut de cette page.</p>

                <h2>8. Paiements, commissions et reversements</h2>
        <p>Les achats sont payés à GOWINMALL, et non directement au vendeur, par l&apos;un des moyens de paiement indiqués sur la page de la commande. Le paiement est vérifié par l&apos;équipe GOWINMALL avant la livraison ou l&apos;accès au produit ; un délai de vérification est possible.</p>
        <p>GOWINMALL prélève sur chaque vente une commission dont le taux dépend du type d&apos;offre. Les taux en vigueur sont affichés sur la page « Comment ça marche » et sur le formulaire de création d&apos;une offre. Le taux appliqué à une commande est celui en vigueur au moment de la commande. Les frais éventuels de l&apos;opérateur de paiement mobile ne sont pas inclus.</p>
        <p>GOWINMALL reverse au vendeur le prix de vente moins la commission, sur les coordonnées de reversement qu&apos;il a indiquées : pour un produit digital, après la confirmation du paiement ; pour un produit physique ou un service, après la confirmation de réception par l&apos;acheteur. Le vendeur est responsable de l&apos;exactitude de ses coordonnées.</p>
        <p>Une commande peut être annulée par l&apos;acheteur tant qu&apos;il n&apos;a pas déclaré son paiement. Après cette étape, ou en cas de problème avec une commande, contactez l&apos;équipe GOWINMALL.</p>

        <h2>9. Contact</h2>
        <p>Pour toute question : {CONTACT}</p>
      </article>
    </main>
  );
}
