import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load these products. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-error/40 bg-error/5 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-error" strokeWidth={1.5} aria-hidden />
      <div>
        <p className="font-display text-xl text-charcoal">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone">{description}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
