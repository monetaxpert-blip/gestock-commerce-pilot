import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

const ROUTES = [
  "/",
  "/auth",
  "/reset-password",
  "/onboarding",
  "/app",
  "/app/abonnement",
  "/app/benefices",
  "/app/parametres",
  "/app/clients",
  "/app/commandes",
  "/app/commandes/nouveau",
  "/app/commandes/test-order-id",
  "/app/produits",
  "/app/produits/nouveau",
  "/app/produits/test-product-id",
  "/app/stock",
  "/app/stock/approvisionnements/nouveau",
  "/app/ventes",
  "/app/ventes/caisse",
  "/app/ventes/test-sale-id",
];

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each(ROUTES)("matches %s instead of falling back to not found", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(path);

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
