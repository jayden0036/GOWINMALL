export const orderStatusLabels: Record<string, string> = {
  pending_payment: "En attente de paiement",
  payment_declared: "Paiement déclaré, en vérification",
  paid: "Payée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export const payoutStatusLabels: Record<string, string> = {
  none: "Pas encore dû",
  due: "À reverser par GOWINMALL",
  paid: "Reversé",
};

export function orderCode(id: string): string {
  return `GM-${id.slice(0, 8).toUpperCase()}`;
}
