import type { Metadata } from "next";
import "./globals.css";
import { dmSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "GOWINMALL | Achetez, vendez et gagnez",
  description:
    "GOWINMALL, votre marketplace africaine pour acheter, vendre et proposer des services.",
  openGraph: {
    title: "GOWINMALL | Achetez, vendez et gagnez",
    description:
      "GOWINMALL, votre marketplace africaine pour acheter, vendre et proposer des services.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}