// Generated placeholder artwork per category. No third-party images are used.
// Each category gets a simple landscape motif in the "Roadside Ceylon" palette.
import type { PlaceCategory } from "@/shared/constants/places";

const W = 1600;
const H = 1000;

interface Palette {
  sky: string;
  far: string;
  mid: string;
  near: string;
  accent: string;
}

const EARTH: Palette = { sky: "#F3DCCF", far: "#D9A58C", mid: "#B8603D", near: "#9A3B1F", accent: "#FFFBF4" };
const OCEAN: Palette = { sky: "#E4EFEC", far: "#9CCBCB", mid: "#3D8F96", near: "#0B6670", accent: "#F4ECDD" };
const TEA: Palette = { sky: "#E7EEDF", far: "#A9C69F", mid: "#5E8C5F", near: "#2E5A36", accent: "#F4ECDD" };
const MONSOON: Palette = {
  sky: "#E6E8EA",
  far: "#AEB8C2",
  mid: "#6B7A8A",
  near: "#3B4A5A",
  accent: "#F4ECDD",
};

const PALETTE: Record<PlaceCategory, Palette> = {
  temple: EARTH,
  heritage_site: EARTH,
  beach: OCEAN,
  waterfall: OCEAN,
  lake: OCEAN,
  national_park: TEA,
  wildlife: TEA,
  garden: TEA,
  hike: TEA,
  viewpoint: MONSOON,
  museum: MONSOON,
  other: MONSOON,
};

/** Deterministic PRNG so the same slug always renders the same art. */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function ridge(rand: () => number, baseY: number, amp: number, steps: number): string {
  let d = `M0 ${H} L0 ${baseY}`;
  for (let i = 1; i <= steps; i++) {
    const x = (W / steps) * i;
    const y = baseY - amp * (0.35 + rand() * 0.65);
    const cx = x - W / steps / 2;
    d += ` Q${cx.toFixed(0)} ${(y - amp * 0.4).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return `${d} L${W} ${H} Z`;
}

function motif(category: PlaceCategory, p: Palette, rand: () => number): string {
  switch (category) {
    case "temple": {
      // Stupa: bell-shaped dome, square box, spire.
      const cx = 800 + (rand() - 0.5) * 300;
      return `<g fill="${p.accent}"><path d="M${cx - 190} 720 Q${cx - 190} 470 ${cx} 450 Q${cx + 190} 470 ${cx + 190} 720 Z"/><rect x="${cx - 46}" y="402" width="92" height="52"/><path d="M${cx - 30} 404 L${cx} 250 L${cx + 30} 404 Z"/><rect x="${cx - 260}" y="716" width="520" height="34"/></g>`;
    }
    case "heritage_site":
      return `<path fill="${p.near}" d="M520 760 C520 520 600 380 760 360 C960 340 1080 470 1090 760 Z"/><path fill="${p.accent}" opacity=".55" d="M700 420 h140 v18 h-140 z M680 470 h190 v14 h-190 z"/>`;
    case "beach":
    case "lake": {
      let waves = "";
      for (let i = 0; i < 5; i++) {
        const y = 690 + i * 60;
        waves += `<path d="M0 ${y} Q200 ${y - 22} 400 ${y} T800 ${y} T1200 ${y} T1600 ${y}" stroke="${p.accent}" stroke-width="${8 - i}" fill="none" opacity="${0.75 - i * 0.12}"/>`;
      }
      return `<rect y="660" width="${W}" height="${H - 660}" fill="${p.near}"/><circle cx="${1150 + rand() * 200}" cy="300" r="95" fill="${p.accent}" opacity=".9"/>${waves}`;
    }
    case "waterfall": {
      let streams = "";
      for (let i = 0; i < 7; i++) {
        const x = 720 + i * 26;
        streams += `<rect x="${x}" y="300" width="14" height="${440 + rand() * 60}" rx="7" fill="${p.accent}" opacity="${0.55 + rand() * 0.4}"/>`;
      }
      return `<path fill="${p.near}" d="M0 300 H690 V820 H0 Z M910 300 H1600 V820 H910 Z"/>${streams}`;
    }
    case "hike":
      return `<path d="M200 940 C420 860 380 760 620 720 S900 600 1010 520 S1220 380 1300 330" stroke="${p.accent}" stroke-width="10" stroke-dasharray="26 22" fill="none" stroke-linecap="round"/>`;
    case "garden":
    case "national_park":
    case "wildlife": {
      let trees = "";
      for (let i = 0; i < 9; i++) {
        const x = 80 + i * 180 + rand() * 60;
        const h = 120 + rand() * 120;
        trees += `<path d="M${x} ${860 - h} L${x + 52} 860 L${x - 52} 860 Z" fill="${p.near}"/>`;
      }
      return trees;
    }
    case "museum": {
      let cols = "";
      for (let i = 0; i < 6; i++)
        cols += `<rect x="${560 + i * 90}" y="520" width="40" height="230" fill="${p.accent}"/>`;
      return `<path d="M520 520 L800 400 L1080 520 Z" fill="${p.accent}"/>${cols}<rect x="520" y="750" width="560" height="30" fill="${p.accent}"/>`;
    }
    case "viewpoint":
    case "other":
    default:
      return `<circle cx="${400 + rand() * 800}" cy="380" r="80" fill="${p.accent}" opacity=".85"/>`;
  }
}

export function placeholderSvg(category: PlaceCategory, seed: string): string {
  const p = PALETTE[category];
  const rand = rng(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${p.sky}"/>
<path d="${ridge(rand, 560, 180, 5)}" fill="${p.far}"/>
<path d="${ridge(rand, 700, 160, 4)}" fill="${p.mid}"/>
${motif(category, p, rand)}
<path d="${ridge(rand, 930, 90, 6)}" fill="${p.near}" opacity=".9"/>
</svg>`;
}
