import { createContext, useContext, type ReactNode } from "react";
import type { Tables } from "@/integrations/supabase/types";

export type Shop = Tables<"shops">;

export type ShopAccess = {
  writable: boolean;
  status: "trial" | "active" | "expired" | "suspended";
  daysLeft: number | null;
};

export function computeAccess(shop: Pick<Shop, "plan" | "trial_ends_at" | "subscription_ends_at">, now = new Date()): ShopAccess {
  const msDay = 86_400_000;
  if (shop.plan === "trial") {
    const end = new Date(shop.trial_ends_at);
    const left = Math.ceil((end.getTime() - now.getTime()) / msDay);
    return end > now ? { writable: true, status: "trial", daysLeft: Math.max(left, 0) } : { writable: false, status: "expired", daysLeft: 0 };
  }
  if (shop.plan === "active") {
    if (!shop.subscription_ends_at) return { writable: true, status: "active", daysLeft: null };
    const end = new Date(shop.subscription_ends_at);
    const left = Math.ceil((end.getTime() - now.getTime()) / msDay);
    return end > now ? { writable: true, status: "active", daysLeft: left } : { writable: false, status: "expired", daysLeft: 0 };
  }
  return { writable: false, status: "suspended", daysLeft: null };
}

type Ctx = { shop: Shop; access: ShopAccess };
const ShopContext = createContext<Ctx | null>(null);

export function ShopProvider({ shop, children }: { shop: Shop; children: ReactNode }) {
  return <ShopContext.Provider value={{ shop, access: computeAccess(shop) }}>{children}</ShopContext.Provider>;
}

export function useShop(): Ctx {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop doit être utilisé dans l'espace boutique.");
  return ctx;
}
