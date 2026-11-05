import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOWINMALL — Le marketplace africain",
  description:
    "Achetez, vendez, proposez vos services et découvrez de nouvelles opportunités avec GOWINMALL.",
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
