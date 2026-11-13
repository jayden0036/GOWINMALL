export function formatPrice(amount: number, currency: string): string {
  if (currency === "USD") {
    return `${(amount / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} $`;
  }
  return `${amount.toLocaleString("fr-FR")} FC`;
}

// Saisie -> unité de stockage : USD en cents, CDF en francs. null si invalide.
export function parsePrice(input: string, currency: string): number | null {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (currency === "USD") {
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
    const cents = Math.round(Number(normalized) * 100);
    return cents > 0 ? cents : null;
  }
  if (!/^\d+$/.test(normalized)) return null;
  const francs = Number(normalized);
  return francs > 0 ? francs : null;
}

// Même calcul que la base de données : arrondi vers le bas
export function commissionOf(amount: number, bps: number): number {
  return Math.floor((amount * bps) / 10000);
}

export function formatRate(bps: number): string {
  return `${(bps / 100).toLocaleString("fr-FR")} %`;
}

export const offerTypeLabels: Record<string, string> = {
  digital: "Produit digital",
  physical: "Produit physique",
  service: "Service",
};

export const offerStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publiée",
  suspended: "Suspendue",
  archived: "Archivée",
};

export const payoutMethodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  airtel: "Airtel Money",
  orange: "Orange Money",
  afrimoney: "Afrimoney",
  bank: "Compte bancaire",
  other: "Autre",
};
