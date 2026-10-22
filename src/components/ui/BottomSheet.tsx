"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";

export type Snap = "peek" | "half" | "full";
const ORDER: Snap[] = ["peek", "half", "full"];

/**
 * Non-modal, draggable sheet for phones (the map stays usable behind it).
 * From `lg` up it becomes a static side panel — same DOM, so nothing remounts.
 * Drag starts only from the handle or non-interactive header areas, so the search
 * field and horizontally scrolling chips keep working.
 */
export function BottomSheet({
  snap,
  onSnapChange,
  heights,
  header,
  children,
  label,
  handleLabel,
  expandLabel,
  collapseLabel,
  bodyRef,
  className,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  heights: Record<Snap, number>;
  header: ReactNode;
  children: ReactNode;
  label: string;
  handleLabel: string;
  expandLabel: string;
  collapseLabel: string;
  bodyRef?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number } | null>(
    null,
  );
  const height = dragHeight ?? heights[snap];

  const settle = useCallback(
    (h: number, velocity: number) => {
      // Fast flick (px/ms): go to the next snap in the flick direction. Otherwise nearest snap.
      let target: Snap;
      if (velocity < -0.45) target = ORDER.find((s) => heights[s] > h + 8) ?? "full";
      else if (velocity > 0.45) target = [...ORDER].reverse().find((s) => heights[s] < h - 8) ?? "peek";
      else target = ORDER.reduce((a, b) => (Math.abs(heights[b] - h) < Math.abs(heights[a] - h) ? b : a));
      onSnapChange(target);
    },
    [heights, onSnapChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (
      el.closest("input, select, textarea, a, [data-no-drag]") ||
      (el.closest("button") && !el.closest("[data-sheet-handle]"))
    ) {
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { startY: e.clientY, startH: height, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    const next = Math.min(heights.full, Math.max(heights.peek * 0.85, d.startH - (e.clientY - d.startY)));
    if (Math.abs(e.clientY - d.startY) > 4) setDragHeight(next);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (dragHeight !== null) settle(dragHeight, d.v);
    setDragHeight(null);
  };

  // Keyboard / click on the handle cycles snaps.
  const cycle = () => {
    if (dragHeight !== null) return;
    onSnapChange(snap === "full" ? "peek" : ORDER[ORDER.indexOf(snap) + 1]!);
  };

  // Keep focus visible: if something inside the hidden part of the list gets focus, open up.
  const sheetRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onFocus = (e: FocusEvent) => {
      if (snap === "peek" && (e.target as HTMLElement).closest("[data-sheet-body]")) onSnapChange("half");
    };
    el.addEventListener("focusin", onFocus);
    return () => el.removeEventListener("focusin", onFocus);
  }, [snap, onSnapChange]);

  return (
    <section
      ref={sheetRef}
      aria-label={label}
      style={{ "--sheet-h": `${height}px` } as React.CSSProperties}
      className={cx(
        "absolute inset-x-0 bottom-0 z-20 flex h-(--sheet-h) flex-col rounded-t-xl border-t-2 border-line bg-surface shadow-[0_-8px_28px_-14px_rgb(0_0_0/0.35)]",
        dragHeight === null && "transition-[height] duration-250 ease-out motion-reduce:transition-none",
        "lg:static lg:h-full lg:rounded-none lg:border-t-0 lg:border-r-2 lg:shadow-none",
        className,
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 touch-none select-none lg:touch-auto lg:select-auto"
      >
        <button
          type="button"
          data-sheet-handle
          onClick={cycle}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" && snap !== "full") {
              e.preventDefault();
              onSnapChange(ORDER[ORDER.indexOf(snap) + 1]!);
            } else if (e.key === "ArrowDown" && snap !== "peek") {
              e.preventDefault();
              onSnapChange(ORDER[ORDER.indexOf(snap) - 1]!);
            }
          }}
          aria-label={`${handleLabel}. ${snap === "full" ? collapseLabel : expandLabel}`}
          className="flex h-11 w-full cursor-grab items-center justify-center active:cursor-grabbing lg:hidden"
        >
          <span aria-hidden className="h-1.5 w-11 rounded-full bg-line-strong" />
        </button>
        {header}
      </div>
      <div ref={bodyRef} data-sheet-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </section>
  );
}
