const categories = [
  { icon: "🛍️", name: "Produits physiques", description: "Achetez et vendez des articles", href: "/catalogue?type=physical" },
  { icon: "💼", name: "Services", description: "Proposez vos compétences", href: "/catalogue?type=service" },
  { icon: "🎯", name: "Missions", description: "Réalisez des missions rémunérées", href: "" },
  { icon: "📚", name: "Produits digitaux", description: "Découvrez les produits numériques", href: "/catalogue?type=digital" },
  { icon: "🤝", name: "Affiliation", description: "Gagnez sur les ventes recommandées", href: "" },
  { icon: "💰", name: "Opportunités", description: "Découvrez de nouvelles possibilités", href: "" },
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
            <span className="badge">✦ L'Afrique connectée aux opportunités</span>

            <h1>
              Achetez, vendez et <span>gagnez</span> avec GOWINMALL.
            </h1>

            <p>
              Une seule plateforme pour découvrir des produits,
              proposer vos services et développer vos activités
              partout en Afrique.
            </p>

            <div className="hero-actions">
              <a href="/register" className="register hero-button">
                Rejoindre GOWINMALL →
              </a>
              <a href="/catalogue" className="secondary-button">
                Voir le catalogue
              </a>
            </div>

            <div className="hero-note">
              ✓ Inscription gratuite · ✓ Vendeurs vérifiés · ✓ Frais affichés clairement
            </div>
          </div>

          <div className="hero-card">
            <div className="card-top">
              <span>GOWINMALL</span>
              <span>✦</span>
            </div>

            <div className="card-icon">🌍</div>

            <h2>Une Afrique. Des milliers d'opportunités.</h2>

            <p>
              Produits, services et opportunités :
              tout commence ici.
            </p>

            <div className="card-footer">
              <span>GOWINMALL ECOSYSTEM</span>
              <span>01 / 06</span>
            </div>
          </div>
        </div>
      </section>

      <section className="categories container" id="categories">
        <div className="section-heading">
          <span className="badge">NOTRE ÉCOSYSTÈME</span>
          <h2>Tout ce qu'il vous faut, au même endroit.</h2>
          <p>Explorez les différentes possibilités offertes par GOWINMALL.</p>
        </div>

        <div className="category-grid">
          {categories.map((category) => {
            const content = (
              <>
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="category-arrow">
                  {category.href ? "Explorer →" : "Bientôt disponible"}
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
                  background: "#e8f5ed",
                  color: "#087443",
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
            Voir les frais et le détail →
          </a>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container about-content">
          <span className="badge">NOTRE VISION</span>
          <h2>Construire des opportunités pour toute l'Afrique.</h2>
          <p>
            GOWINMALL ambitionne de connecter les personnes,
            les entreprises et les entrepreneurs dans un
            écosystème commercial moderne et sécurisé.
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
            <a href="/comment-ca-marche" style={{ color: "inherit" }}>Comment ça marche</a> ·{" "}
            <a href="/conditions" style={{ color: "inherit" }}>Conditions</a> ·{" "}
            <a href="/confidentialite" style={{ color: "inherit" }}>Confidentialité</a>
          </p>
          <span>Made for Africa 🌍</span>
        </div>
      </footer>
    </main>
  );
            }
