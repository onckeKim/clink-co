import { Button } from "@/components/ui/Button";

export function LoadMoreButton({
  onClick,
  loading = false,
  shown,
  total,
}: {
  onClick: () => void;
  loading?: boolean;
  shown: number;
  total: number;
}) {
  if (shown >= total) return null;

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <p className="text-xs text-stone">
        Showing {shown} of {total} products
      </p>
      <Button type="button" variant="secondary" onClick={onClick} disabled={loading}>
        {loading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
