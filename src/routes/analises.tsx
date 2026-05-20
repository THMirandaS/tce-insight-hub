import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/analises")({
  component: AnalisesPage,
});

function AnalisesPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10">
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Análises</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tela em desenvolvimento.
        </p>
      </div>
    </main>
  );
}
