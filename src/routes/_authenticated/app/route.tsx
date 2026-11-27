import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { ShopProvider } from "@/lib/shop";
import { shopQuery } from "@/lib/shop-query";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => {
    // Always verify shop ownership after OAuth/account changes; a cached result can belong to a previous session.
    const shop = await context.queryClient.fetchQuery({ ...shopQuery, staleTime: 0 });
    if (!shop) throw redirect({ to: "/onboarding" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  head: () => ({
    meta: [
      { title: "Espace boutique | GESTOCK" },
      { name: "description", content: "Gérez vos produits, votre stock, vos ventes, vos commandes et vos clients." },
      { property: "og:title", content: "Espace boutique | GESTOCK" },
      { property: "og:description", content: "Votre espace de gestion commerciale GESTOCK." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { data: shop } = useSuspenseQuery(shopQuery);
  if (!shop) return null;
  return (
    <ShopProvider shop={shop}>
      <AppShell>
        <Outlet />
      </AppShell>
    </ShopProvider>
  );
}
