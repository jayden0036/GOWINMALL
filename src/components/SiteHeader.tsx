import { createClient } from "@/lib/supabase/server";

const link: React.CSSProperties = {
  color: "#26352d",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
};

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header style={{ background: "white", borderBottom: "1px solid #e5ebe7" }}>
      <div
        style={{
          maxWidth: "980px",
          margin: "auto",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <a href="/" style={{ color: "#087443", fontWeight: 800, fontSize: "20px", textDecoration: "none" }}>
          GOWINMALL
        </a>
        <nav style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/catalogue" style={link}>Catalogue</a>
          <a href="/vendre" style={link}>Vendre</a>
          {user ? (
            <>
              <a href="/commandes" style={link}>Mes commandes</a>
              <a href="/dashboard" style={{ ...link, color: "#087443" }}>Mon espace</a>
            </>
          ) : (
            <a href="/login" style={{ ...link, color: "#087443" }}>Connexion</a>
          )}
        </nav>
      </div>
    </header>
  );
}
