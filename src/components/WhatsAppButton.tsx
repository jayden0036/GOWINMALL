// Bouton flottant WhatsApp. Il n'apparaît que si le numéro est défini dans NEXT_PUBLIC_WHATSAPP_NUMBER (format international, sans + ni 0 au début).
export default function WhatsAppButton() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (number.length < 8) return null;
  const text = encodeURIComponent("Bonjour GOWINMALL, j'ai une question.");
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter GOWINMALL sur WhatsApp"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        zIndex: 80,
        width: "54px",
        height: "54px",
        borderRadius: "50%",
        background: "#25a244",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 18px #0b1f1744",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2A8.5 8.5 0 1 1 20.5 11.5z" />
        <path d="M9 8.8c.3 2.6 2.7 5 5.3 5.3l1.2-1.3-1.9-1-.9.7c-.9-.4-1.7-1.2-2.1-2.1l.7-.9-1-1.9z" />
      </svg>
    </a>
  );
}
