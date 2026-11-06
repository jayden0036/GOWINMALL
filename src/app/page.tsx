const categories = [
  { icon: "🛍️", name: "Produits physiques", description: "Achetez et vendez des articles" },
  { icon: "💼", name: "Services", description: "Proposez vos compétences" },
  { icon: "🎯", name: "Missions", description: "Réalisez des missions rémunérées" },
  { icon: "📚", name: "Produits digitaux", description: "Découvrez les produits numériques" },
  { icon: "🤝", name: "Affiliation", description: "Gagnez sur les ventes recommandées" },
  { icon: "💰", name: "Opportunités", description: "Découvrez de nouvelles possibilités" },
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
            <a href="#categories">Catégories</a>
            <a href="#about">À propos</a>
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
              proposer vos services, réaliser des missions et
              développer vos activités partout en Afrique.
            </p>

            <div className="hero-actions">
              <a href="/register" className="register hero-button">
                Rejoindre GOWINMALL →
              </a>
              <a href="#categories" className="secondary-button">
                Découvrir la plateforme
              </a>
            </div>

            <div className="hero-note">
              ✓ Inscription gratuite · ✓ Plusieurs opportunités · ✓ Accessible en Afrique
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
              Commerce, services, missions et produits numériques :
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
          {categories.map((category) => (
            <article className="category-card" key={category.name}>
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="category-arrow">Explorer →</span>
            </article>
          ))}
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
          <p>© 2026 GOWINMALL. Tous droits réservés.</p>
          <span>Made for Africa 🌍</span>
        </div>
      </footer>
    </main>
  );
      }
