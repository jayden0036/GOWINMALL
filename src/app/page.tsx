import type { ReactNode } from "react";

function Icon({ children, size = 26 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  box: (
    <Icon>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </Icon>
  ),
  briefcase: (
    <Icon>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </Icon>
  ),
  clipboard: (
    <Icon>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 14l2 2 4-4" />
    </Icon>
  ),
  screen: (
    <Icon>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Icon>
  ),
  network: (
    <Icon>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
    </Icon>
  ),
  trend: (
    <Icon>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </Icon>
  ),
  globe: (
    <Icon size={40}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
    </Icon>
  ),
};

const categories = [
  { icon: icons.box, name: "Produits physiques", description: "Achetez et vendez des articles", href: "/catalogue?type=physical" },
  { icon: icons.briefcase, name: "Services", description: "Proposez vos compétences", href: "/catalogue?type=service" },
  { icon: icons.clipboard, name: "Missions", description: "Réalisez des missions rémunérées", href: "" },
  { icon: icons.screen, name: "Produits digitaux", description: "Guides, formations et fichiers numériques", href: "/catalogue?type=digital" },
  { icon: icons.network, name: "Affiliation", description: "Gagnez sur les ventes recommandées", href: "" },
  { icon: icons.trend, name: "Opportunités", description: "Offres de travail en ligne et à distance", href: "/opportunites" },
];

const steps = [
  { title: "Créez votre compte", text: "Inscription gratuite avec Google ou par e-mail." },
  { title: "Parcourez le catalogue", text: "Produits digitaux, produits physiques et services de vendeurs vérifiés." },
  { title: "Payez GOWINMALL", text: "Votre paiement est vérifié par l'équipe avant la livraison." },
  { title: "Recevez votre achat", text: "Accès immédiat pour le digital. Pour le reste, vous confirmez la réception, puis le vendeur est payé." },
];

export default function Home() {
  return (
    <main>
      <header className="header">
        <div className="container nav">
          <a href="/" className="logo">
            GOWIN<span>MALL</span>
          </a>

          <nav className="nav-links">
            <a href="#accueil">Accueil</a>
            <a href="/catalogue">Catalogue</a>
            <a href="/opportunites">Opportunités</a>
            <a href="/comment-ca-marche">Comment ça marche</a>
          </nav>

          <div className="nav-actions">
            <a href="/login" className="login">Connexion</a>
            <a href="/register" className="register">Créer un compte</a>
          </div>
        </div>
      </header>

      <section className="hero" id="accueil">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="badge">Marketplace · Services · Opportunités</span>

            <h1>
              Achetez, vendez et <span>gagnez</span> avec GOWINMALL.
            </h1>

            <p>
              Achetez des produits et des services, vendez les vôtres
              et trouvez du travail en ligne, au même endroit.
            </p>

            <div className="hero-actions">
              <a href="/register" className="register hero-button">
                Rejoindre GOWINMALL
              </a>
              <a href="/catalogue" className="secondary-button">
                Voir le catalogue
              </a>
            </div>

            <div className="hero-note">
              Inscription gratuite · Vendeurs vérifiés · Frais affichés clairement
            </div>
          </div>

          <div className="hero-card">
            <div className="card-top">
              <span>GOWINMALL</span>
              <span>Marketplace</span>
            </div>

            <div className="card-icon">{icons.globe}</div>

            <h2>Achetez. Vendez. Trouvez du travail en ligne.</h2>

            <p>
              Produits, services et offres à distance,
              réunis sur une seule plateforme.
            </p>

            <div className="card-footer">
              <span>Paiement via GOWINMALL</span>
              <span>Frais affichés</span>
            </div>
          </div>
        </div>
      </section>

      <section className="categories container" id="categories">
        <div className="section-heading">
          <span className="badge">CATÉGORIES</span>
          <h2>Tout ce qu&apos;il vous faut, au même endroit.</h2>
          <p>Choisissez ce que vous voulez acheter, vendre ou trouver.</p>
        </div>

        <div className="category-grid">
          {categories.map((category) => {
            const content = (
              <>
                <div className="category-icon" style={{ color: "#126b52" }}>{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="category-arrow">
                  {category.href ? "Explorer" : "Bientôt disponible"}
                </span>
              </>
            );
            return category.href ? (
              <a
                className="category-card"
                key={category.name}
                href={category.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {content}
              </a>
            ) : (
              <article className="category-card" key={category.name}>
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <section className="container" id="how" style={{ padding: "56px 20px" }}>
        <div className="section-heading">
          <span className="badge">COMMENT ÇA MARCHE</span>
          <h2>Simple, clair et transparent.</h2>
          <p>Vous payez GOWINMALL, qui reverse le vendeur après confirmation.</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step.title}
              style={{
                background: "white",
                border: "1px solid #e5ebe7",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#e0f0e8",
                  color: "#126b52",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: "32px",
                  marginBottom: "10px",
                }}
              >
                {index + 1}
              </div>
              <strong>{step.title}</strong>
              <p style={{ fontSize: "14px", lineHeight: 1.6, margin: "6px 0 0", color: "#68766e" }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/comment-ca-marche" className="secondary-button">
            Voir les frais et le détail
          </a>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container about-content">
          <span className="badge">À PROPOS</span>
          <h2>Une plateforme pour vendre et trouver du travail en ligne.</h2>
          <p>
            GOWINMALL réunit des vendeurs, des acheteurs et des offres de travail
            à distance. Les vendeurs sont vérifiés, les frais sont affichés avant
            chaque publication et les paiements passent par GOWINMALL.
          </p>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <a href="/" className="logo">
            GOWIN<span>MALL</span>
          </a>
          <p>
            © 2026 GOWINMALL. Tous droits réservés. ·{" "}
            <a href="/catalogue" style={{ color: "inherit" }}>Catalogue</a> ·{" "}
            <a href="/opportunites" style={{ color: "inherit" }}>Opportunités</a> ·{" "}
            <a href="/comment-ca-marche" style={{ color: "inherit" }}>Comment ça marche</a> ·{" "}
            <a href="/conditions" style={{ color: "inherit" }}>Conditions</a> ·{" "}
            <a href="/confidentialite" style={{ color: "inherit" }}>Confidentialité</a>
          </p>
        </div>
      </footer>
    </main>
  );
                         }
