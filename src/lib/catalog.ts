import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/rpc";
import type { Tables } from "@/integrations/supabase/types";

export type ArticleRow = {
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  barcode: string | null;
  price_retail: number;
  price_semi: number | null;
  price_wholesale: number | null;
  fixed_cost: number | null;
  low_stock_threshold: number;
  stock_qty: number;
  avg_cost: number;
  engaged_qty: number;
  available_qty: number;
  base_unit: string;
  allow_decimal: boolean;
  is_stocked: boolean;
  has_variants: boolean;
  category_id: string | null;
  archived: boolean;
};

export type Packaging = Tables<"packagings">;
export type Customer = Tables<"customers">;
export type Category = Tables<"categories">;

export function articlesQuery(shopId: string) {
  return queryOptions({
    queryKey: ["articles", shopId],
    queryFn: async (): Promise<ArticleRow[]> => {
      const rows = must(
        await supabase.from("article_stock").select("*").eq("shop_id", shopId).order("product_name").order("variant_name").limit(5000),
      );
      return (rows ?? []).map((r) => ({
        id: r.id ?? "",
        product_id: r.product_id ?? "",
        product_name: r.product_name ?? "",
        variant_name: r.variant_name ?? "",
        sku: r.sku ?? "",
        barcode: r.barcode,
        price_retail: Number(r.price_retail ?? 0),
        price_semi: r.price_semi === null ? null : Number(r.price_semi),
        price_wholesale: r.price_wholesale === null ? null : Number(r.price_wholesale),
        fixed_cost: r.fixed_cost === null ? null : Number(r.fixed_cost),
        low_stock_threshold: Number(r.low_stock_threshold ?? 0),
        stock_qty: Number(r.stock_qty ?? 0),
        avg_cost: Number(r.avg_cost ?? 0),
        engaged_qty: Number(r.engaged_qty ?? 0),
        available_qty: Number(r.available_qty ?? 0),
        base_unit: r.base_unit ?? "piece",
        allow_decimal: Boolean(r.allow_decimal),
        is_stocked: Boolean(r.is_stocked),
        has_variants: Boolean(r.has_variants),
        category_id: r.category_id,
        archived: Boolean(r.archived_at || r.product_archived_at),
      }));
    },
    staleTime: 15_000,
  });
}

export function packagingsQuery(shopId: string) {
  return queryOptions({
    queryKey: ["packagings", shopId],
    queryFn: async () =>
      must(await supabase.from("packagings").select("*").eq("shop_id", shopId).is("archived_at", null).order("factor")),
    staleTime: 30_000,
  });
}

export function customersQuery(shopId: string) {
  return queryOptions({
    queryKey: ["customers", shopId],
    queryFn: async () => must(await supabase.from("customers").select("*").eq("shop_id", shopId).order("name").limit(5000)),
    staleTime: 15_000,
  });
}

export function categoriesQuery(shopId: string) {
  return queryOptions({
    queryKey: ["categories", shopId],
    queryFn: async () => must(await supabase.from("categories").select("*").eq("shop_id", shopId).order("name")),
    staleTime: 30_000,
  });
}

/** Prix unitaire d'un article pour un niveau et un facteur donnés (même règle que la base). */
export function unitPrice(a: Pick<ArticleRow, "price_retail" | "price_semi" | "price_wholesale">, tier: string, factor = 1): number {
  const base = tier === "semi" ? (a.price_semi ?? a.price_retail) : tier === "wholesale" ? (a.price_wholesale ?? a.price_retail) : a.price_retail;
  return Math.round(factor * base);
}

export function tierFallback(a: Pick<ArticleRow, "price_semi" | "price_wholesale">, tier: string): boolean {
  return (tier === "semi" && a.price_semi === null) || (tier === "wholesale" && a.price_wholesale === null);
}

export function stockLevel(a: Pick<ArticleRow, "is_stocked" | "available_qty" | "low_stock_threshold">): "ok" | "low" | "out" | "none" {
  if (!a.is_stocked) return "none";
  if (a.available_qty <= 0) return "out";
  if (a.available_qty <= a.low_stock_threshold) return "low";
  return "ok";
}

/** Invalide tout ce qui dépend des opérations de stock et de vente. */
export const OPERATION_KEYS = [["articles"], ["dashboard"], ["sales"], ["movements"], ["orders"], ["customers-balances"], ["report"], ["purchases"]] as const;
