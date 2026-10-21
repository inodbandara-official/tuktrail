// Administrative geography of Sri Lanka: 9 provinces, 25 districts.
// Framework-agnostic: safe to import from server, web client and the future mobile app.

export const PROVINCES = [
  "western",
  "central",
  "southern",
  "northern",
  "eastern",
  "north_western",
  "north_central",
  "uva",
  "sabaragamuwa",
] as const;
export type Province = (typeof PROVINCES)[number];

export const DISTRICTS_BY_PROVINCE = {
  western: ["colombo", "gampaha", "kalutara"],
  central: ["kandy", "matale", "nuwara_eliya"],
  southern: ["galle", "matara", "hambantota"],
  northern: ["jaffna", "kilinochchi", "mannar", "vavuniya", "mullaitivu"],
  eastern: ["batticaloa", "ampara", "trincomalee"],
  north_western: ["kurunegala", "puttalam"],
  north_central: ["anuradhapura", "polonnaruwa"],
  uva: ["badulla", "monaragala"],
  sabaragamuwa: ["ratnapura", "kegalle"],
} as const satisfies Record<Province, readonly string[]>;

export type District = (typeof DISTRICTS_BY_PROVINCE)[Province][number];

export const DISTRICTS = Object.values(DISTRICTS_BY_PROVINCE).flat() as unknown as readonly [
  District,
  ...District[],
];

export function provinceOf(district: District): Province {
  for (const province of PROVINCES) {
    if ((DISTRICTS_BY_PROVINCE[province] as readonly string[]).includes(district)) return province;
  }
  throw new Error(`Unknown district: ${district}`);
}

/** Default map centre and fallback location when the user shares nothing. */
export const COLOMBO = { lat: 6.9271, lng: 79.8612 } as const;

/** Rough bounding box of Sri Lanka incl. territorial waters, for input sanity checks. */
export const SRI_LANKA_BOUNDS = { south: 5.7, west: 79.4, north: 10.0, east: 82.1 } as const;
