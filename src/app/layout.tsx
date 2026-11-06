import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOWINMALL | Achetez, vendez et gagnez",
  description:
    "GOWINMALL, votre marketplace africaine pour acheter, vendre et proposer des services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
