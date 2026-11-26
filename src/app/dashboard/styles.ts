import type { CSSProperties } from "react";

export const GREEN = "#126b52";
export const GREEN_SOFT = "#e0f0e8";
export const TEXT = "#172b25";
export const MUTED = "#718078";
export const BORDER = "#e5ebe7";

export const card: CSSProperties = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "16px",
};

export const h2: CSSProperties = { margin: "0 0 4px", fontSize: "17px", color: TEXT };

export const sub: CSSProperties = { margin: "0 0 14px", fontSize: "13px", color: MUTED, lineHeight: 1.5 };

export const primaryButton: CSSProperties = {
  display: "inline-block",
  padding: "11px 18px",
  background: GREEN,
  color: "white",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const ghostButton: CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  background: "white",
  color: "#26352d",
  border: "1px solid #d5ded9",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "14px",
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};
