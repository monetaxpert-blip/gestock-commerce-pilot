import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/rpc";

export const shopQuery = queryOptions({
  queryKey: ["shop"],
  queryFn: async () => must(await supabase.from("shops").select("*").maybeSingle()),
  staleTime: 30_000,
});
