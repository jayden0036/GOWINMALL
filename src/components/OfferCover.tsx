import Image from "next/image";
import { coverUrl } from "@/lib/cover";

const palettes = [
  { bg: "#0f3d2e", fg: "#ffffff" },
  { bg: "#0b1f17", fg: "#ffffff" },
  { bg: "#f5a623", fg: "#0b1f17" },
  { bg: "#087443", fg: "#ffffff" },
];

function pick(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h % palettes.length;
}

// Couverture façon livre (format vertical). Sans image envoyée par le vendeur, une couverture typographique est dessinée.
export default function OfferCover({
  id,
  title,
  coverPath,
  src,
  aspect = "2 / 3",
}: {
  id: string;
  title: string;
  type?: string;
  coverPath?: string | null;
  src?: string | null;
  aspect?: string;
}) {
  const image = src ?? coverUrl(coverPath);
  const p = palettes[pick(id)];
  const frame: React.CSSProperties = {
    position: "relative",
    aspectRatio: aspect,
    borderRadius: "4px 8px 8px 4px",
    overflow: "hidden",
    background: p.bg,
    boxShadow: "0 8px 18px #0b1f1738, inset 5px 0 0 #00000026",
  };

  if (image) {
    // L'image est toujours affichée en entier (jamais rognée), quel que soit son format.
    return (
      <div style={frame}>
        <Image src={image} alt={title} fill sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 22vw" style={{ objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div style={{ ...frame, color: p.fg, padding: "14px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ width: "34px", height: "4px", background: "#f5a623", marginBottom: "9px" }} />
        <div
          style={{
            fontWeight: 800,
            fontSize: "clamp(14px, 4.4vw, 19px)",
            lineHeight: 1.15,
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ fontSize: "9px", letterSpacing: "2px", fontWeight: 700, opacity: 0.85 }}>GOWINMALL</div>
    </div>
  );
}
