import { coverUrl } from "@/lib/cover";

const gradients = [
  "linear-gradient(135deg, #087443, #0b9b5a)",
  "linear-gradient(135deg, #0f3d2e, #1e7a55)",
  "linear-gradient(135deg, #8a4b08, #f5a623)",
  "linear-gradient(135deg, #1b3a5c, #2d7fb8)",
  "linear-gradient(135deg, #4a2c6e, #8e5bd0)",
];

const icons: Record<string, string> = {
  digital: "📚",
  physical: "🛍️",
  service: "💼",
};

function pick(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h % gradients.length;
}

export default function OfferCover({
  id,
  title,
  type,
  coverPath,
  src,
  aspect = "4 / 3",
}: {
  id: string;
  title: string;
  type: string;
  coverPath?: string | null;
  src?: string | null;
  aspect?: string;
}) {
  const image = src ?? coverUrl(coverPath);

  if (image) {
    return (
      <div style={{ aspectRatio: aspect, background: "#eef2ef", overflow: "hidden" }}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: aspect,
        background: gradients[pick(id)],
        color: "white",
        padding: "14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: "28px" }}>{icons[type] ?? "✨"}</div>
      <div
        style={{
          fontWeight: 800,
          fontSize: "clamp(14px, 4vw, 20px)",
          lineHeight: 1.25,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textShadow: "0 1px 6px #00000040",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "11px", opacity: 0.85, letterSpacing: "1px" }}>GOWINMALL</div>
    </div>
  );
}
