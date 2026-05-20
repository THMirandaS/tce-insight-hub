import { Maximize2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description?: string;
  filterLabel?: string;
  filterSlot?: ReactNode;
  children: ReactNode;
};

export function ChartCard({ title, description, filterLabel, filterSlot, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filterSlot && (
            <div className="hidden md:block">
              <span className="mr-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                {filterLabel}
              </span>
              {filterSlot}
            </div>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
            aria-label="Expandir"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="h-[280px] w-full">{children}</div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </DialogHeader>
          <div className="h-[70vh] w-full">{children}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
