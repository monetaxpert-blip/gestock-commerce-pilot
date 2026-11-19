import type { QueryClient } from "@tanstack/react-query";

/** Rafraîchit toutes les vues qui dépendent d'une opération (vente, stock, commande, paiement). */
export async function invalidateOperations(qc: QueryClient) {
  await Promise.all(
    ["articles", "dashboard", "sales", "sale", "movements", "orders", "order", "customers", "customer", "report", "purchases", "purchase", "balances"].map((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    ),
  );
}
