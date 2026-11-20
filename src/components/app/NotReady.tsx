import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/app/kit";

/** Module pas encore livré : message honnête, aucune donnée simulée. */
export function NotReady({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Panel>
        <EmptyState
          icon={Hammer}
          title="Module en cours de construction"
          description="Cet écran n'est pas encore disponible. Vos données existantes sont conservées et sécurisées."
          action={<Button variant="outline" asChild><Link to="/app">Retour au tableau de bord</Link></Button>}
        />
      </Panel>
    </>
  );
}
