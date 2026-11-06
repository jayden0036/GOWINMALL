const PRODUCTION_URL = "https://gowinmall.vercel.app";
const LOCAL_PATTERN = /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/;

export function isLocalUrl(url: string): boolean {
  return LOCAL_PATTERN.test(url);
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    return configured && !isLocalUrl(configured) ? configured : PRODUCTION_URL;
  }
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
