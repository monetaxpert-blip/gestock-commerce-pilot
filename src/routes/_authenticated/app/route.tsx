import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { ShopProvider } from "@/lib/shop";
import { shopQuery } from "@/lib/shop-query";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => {
    const shop = await context.queryClient.fetchQuery(shopQuery);
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
