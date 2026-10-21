// VERIFY BEFORE LAUNCH: confirm every number with official Sri Lankan sources
// (Sri Lanka Police, Suwa Seriya, SLTDA, DMC) shortly before each release.
// Labels live in messages/*.json under `emergency.<key>`.

export const EMERGENCY_CONTACTS = [
  { key: "police", number: "119" },
  { key: "ambulance", number: "1990" },
  { key: "tourism", number: "1912" },
  { key: "disaster", number: "117" },
] as const;

export type EmergencyContactKey = (typeof EMERGENCY_CONTACTS)[number]["key"];
