import { cx } from "./cx";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx("block animate-pulse rounded-sm bg-surface-sunk", className)} />;
}

/** Mirrors PlaceCard's layout so the list doesn't jump when data arrives. */
export function PlaceCardSkeleton() {
  return (
    <div aria-hidden className="flex gap-3 rounded-lg border-2 border-line bg-surface p-3">
      <Skeleton className="aspect-square w-24 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}
