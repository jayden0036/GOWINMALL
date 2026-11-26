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

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("channel", "in_app")
      .is("read_at", null);
    unread = count ?? 0;
  }

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
          <a href="/opportunites" style={link}>Opportunités</a>
          <a href="/missions" style={link}>Missions</a>
          <a href="/vendre" style={link}>Vendre</a>
          {user ? (
            <>
              <a href="/commandes" style={link}>Mes commandes</a>
              <a href="/dashboard" style={{ ...link, color: "#087443" }}>Mon espace</a>
              <a
                href="/notifications"
                aria-label={unread > 0 ? `Notifications : ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
                style={{ ...link, position: "relative", display: "inline-flex", alignItems: "center" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
                  <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
                {unread > 0 && (
                  <span style={{ position: "absolute", top: "-6px", right: "-8px", minWidth: "17px", height: "17px", padding: "0 4px", borderRadius: "999px", background: "#d93025", color: "white", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </a>
            </>
          ) : (
            <a href="/login" style={{ ...link, color: "#087443" }}>Connexion</a>
          )}
        </nav>
      </div>
    </header>
  );
}
