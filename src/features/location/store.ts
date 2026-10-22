"use client";

import { create } from "zustand";
import { COLOMBO } from "@/shared/constants/geography";
import type { LatLng } from "@/shared/schemas/common";
import { roundCoord } from "@/shared/schemas/nearby";

export type GpsStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

/** What the user chose on the explainer: remembered on this device only. */
export type LocationChoice = "gps" | "manual" | null;

const CHOICE_KEY = "tuktrail.locationChoice";
/** Rounded last GPS fix, per tab session only, so the detail page can show distance. */
const LAST_FIX_KEY = "tuktrail.lastFix";

function safeGet(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}
function safeSet(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    /* private mode or blocked storage: degrade silently */
  }
}

interface LocationState {
  choice: LocationChoice;
  hydrated: boolean;
  gps: LatLng | null;
  gpsStatus: GpsStatus;
  hydrate: () => void;
  setChoice: (c: LocationChoice) => void;
  requestGps: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  choice: null,
  hydrated: false,
  gps: null,
  gpsStatus: "idle",

  hydrate() {
    if (get().hydrated) return;
    const choice = safeGet(() => localStorage, CHOICE_KEY) as LocationChoice;
    const fix = safeGet(() => sessionStorage, LAST_FIX_KEY);
    let gps: LatLng | null = null;
    try {
      gps = fix ? (JSON.parse(fix) as LatLng) : null;
    } catch {
      gps = null;
    }
    set({
      hydrated: true,
      choice: choice === "gps" || choice === "manual" ? choice : null,
      gps,
      gpsStatus: gps ? "ready" : "idle",
    });
    if (choice === "gps") get().requestGps();
  },

  setChoice(choice) {
    safeSet(() => localStorage, CHOICE_KEY, choice);
    set({ choice });
  },

  requestGps() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      set({ gpsStatus: "unavailable" });
      return;
    }
    set({ gpsStatus: get().gps ? "ready" : "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Round immediately: precise coordinates never leave this function.
        const gps = { lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude) };
        safeSet(() => sessionStorage, LAST_FIX_KEY, JSON.stringify(gps));
        set({ gps, gpsStatus: "ready" });
      },
      (err) => {
        set({ gpsStatus: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" });
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 5 * 60_000 },
    );
  },
}));

export const DEFAULT_ORIGIN = COLOMBO;
