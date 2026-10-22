"use client";

import { create } from "zustand";

/** Map ⇄ list sync. `source` tells the other side whether to scroll (list) or pan (map). */
interface SelectionState {
  selectedId: string | null;
  source: "map" | "list" | null;
  /** Bumped on every selection so re-selecting the same place re-pans/re-scrolls. */
  nonce: number;
  select: (id: string | null, source: "map" | "list") => void;
}

export const useSelection = create<SelectionState>((set) => ({
  selectedId: null,
  source: null,
  nonce: 0,
  select: (id, source) => set((s) => ({ selectedId: id, source, nonce: s.nonce + 1 })),
}));
