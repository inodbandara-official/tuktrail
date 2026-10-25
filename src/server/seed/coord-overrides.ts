// Coordinates replaced with Wikidata's (sourced) values where ours were approximate.
// Rule (scripts/fetch-place-photos.ts output, reviewed): point-like places only, Wikidata value
// more precise than an arc-minute, and 300 m–3 km from ours. Area-type places keep our point.
export const COORD_OVERRIDES: Record<
  string,
  { lat: number; lng: number; source: string; previousDeltaM: number }
> = {
  "galle-face-green": { lat: 6.92655, lng: 79.84355, source: "Wikidata Q1492279", previousDeltaM: 307 },
  isurumuniya: { lat: 8.3346, lng: 80.3904, source: "Wikidata Q3610571", previousDeltaM: 559 },
  "kuttam-pokuna": { lat: 8.371, lng: 80.401, source: "Wikidata Q3877478", previousDeltaM: 904 },
  "seema-malaka": { lat: 6.91762, lng: 79.85326, source: "Wikidata Q24239464", previousDeltaM: 365 },
  "nainativu-nagapooshani-amman": {
    lat: 9.61906,
    lng: 79.77428,
    source: "Wikidata Q6959710",
    previousDeltaM: 775,
  },
  "dondra-lighthouse": { lat: 5.92111, lng: 80.59389, source: "Wikidata Q5295579", previousDeltaM: 522 },
  "coconut-tree-hill": { lat: 5.93928, lng: 80.46808, source: "Wikidata Q112087224", previousDeltaM: 740 },
  "embekke-devale": { lat: 7.21792, lng: 80.56772, source: "Wikidata Q5370021", previousDeltaM: 2308 },
  "st-clairs-falls": { lat: 6.95118, lng: 80.64788, source: "Wikidata Q38350", previousDeltaM: 1808 },
  "devon-falls": { lat: 6.95167, lng: 80.62972, source: "Wikidata Q37551", previousDeltaM: 2465 },
  "hummanaya-blowhole": { lat: 5.97789, lng: 80.73692, source: "Wikidata Q5940915", previousDeltaM: 2601 },
  "nalanda-gedige": { lat: 7.66972, lng: 80.64556, source: "Wikidata Q3335386", previousDeltaM: 833 },
  "kanniya-hot-springs": { lat: 8.60445, lng: 81.17128, source: "Wikidata Q12976361", previousDeltaM: 2316 },
  "pathirakali-amman-kovil": {
    lat: 8.57452,
    lng: 81.23391,
    source: "Wikidata Q7144783",
    previousDeltaM: 552,
  },
  "kalutara-bodhiya": { lat: 6.58694, lng: 79.96028, source: "Wikidata Q19702135", previousDeltaM: 561 },
  athugala: { lat: 7.485, lng: 80.36972, source: "Wikidata Q5402832", previousDeltaM: 446 },
  "maha-saman-devale": { lat: 6.69114, lng: 80.381, source: "Wikidata Q21707094", previousDeltaM: 303 },
  buduruwagala: { lat: 6.68702, lng: 81.07838, source: "Wikidata Q2927591", previousDeltaM: 2332 },
  maligawila: { lat: 6.7263, lng: 81.368, source: "Wikidata Q6743491", previousDeltaM: 2885 },
  "batticaloa-fort": { lat: 7.7119, lng: 81.70238, source: "Wikidata Q1849425", previousDeltaM: 1033 },
  "mannar-fort": { lat: 8.97586, lng: 79.91701, source: "Wikidata Q16314732", previousDeltaM: 781 },
  "aluvihare-rock-temple": { lat: 7.49719, lng: 80.62186, source: "Wikidata Q19700397", previousDeltaM: 510 },
};
