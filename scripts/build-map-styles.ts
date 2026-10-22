// Builds TukTrail's light and dark MapLibre styles from OpenFreeMap's "positron" style,
// recoloured with our design tokens. OpenFreeMap requires customised styles to be self-hosted,
// so the output is written to public/map/ and committed. Tiles, glyphs and sprites still
// come from OpenFreeMap. Re-run after OpenFreeMap style updates: pnpm map:styles
import { mkdir, writeFile } from "node:fs/promises";

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

interface MapPalette {
  background: string;
  residential: string;
  park: string;
  wood: string;
  ice: string;
  water: string;
  waterway: string;
  building: string;
  buildingOutline: string;
  aeroway: string;
  roadMinor: string;
  roadPath: string;
  roadMajor: string;
  roadMajorCasing: string;
  roadMotorway: string;
  roadMotorwayCasing: string;
  roadSubtle: string;
  rail: string;
  railDash: string;
  boundary: string;
  label: string;
  labelMuted: string;
  labelWater: string;
  halo: string;
}

// Quiet versions of the app palette: markers and UI must stay the loudest thing on screen.
const LIGHT: MapPalette = {
  background: "#EFE6D4",
  residential: "#E9DFCB",
  park: "#DCE3CB",
  wood: "#D2DCC0",
  ice: "#F7F3EA",
  water: "#A9CFCF",
  waterway: "#9AC4C5",
  building: "#E3D7C1",
  buildingOutline: "#D6C8AF",
  aeroway: "#E6DCC8",
  roadMinor: "#FBF6EC",
  roadPath: "#F3EBDC",
  roadMajor: "#FFFBF4",
  roadMajorCasing: "#D5C6AD",
  roadMotorway: "#F3DCC4",
  roadMotorwayCasing: "#CFA987",
  roadSubtle: "rgba(213, 198, 173, 0.6)",
  rail: "#C9BBA4",
  railDash: "#F4ECDD",
  boundary: "#9C8A73",
  label: "#3A3129",
  labelMuted: "#6B5F52",
  labelWater: "#1F5F63",
  halo: "rgba(244, 236, 221, 0.92)",
};

const DARK: MapPalette = {
  background: "#1A1511",
  residential: "#211B16",
  park: "#1D271C",
  wood: "#1A2419",
  ice: "#2A2621",
  water: "#0F2B2B",
  waterway: "#153A3A",
  building: "#29211B",
  buildingOutline: "#30271F",
  aeroway: "#2A231D",
  roadMinor: "#2E2620",
  roadPath: "#29221C",
  roadMajor: "#3B3129",
  roadMajorCasing: "#251E18",
  roadMotorway: "#5A3B29",
  roadMotorwayCasing: "#33241A",
  roadSubtle: "rgba(59, 49, 41, 0.7)",
  rail: "#3A3029",
  railDash: "#1A1511",
  boundary: "#7A6A58",
  label: "#E8DECD",
  labelMuted: "#A99B89",
  labelWater: "#7CC5C7",
  halo: "rgba(22, 18, 14, 0.9)",
};

type Layer = { id: string; type: string; source?: string; paint?: Record<string, unknown> };
type Style = { name?: string; sources: Record<string, unknown>; layers: Layer[]; [k: string]: unknown };

/** Layer id → paint overrides. Unlisted symbol layers get the generic label colours. */
function overrides(p: MapPalette): Record<string, Record<string, unknown>> {
  const motorwayInner = ["interpolate", ["linear"], ["zoom"], 5.8, p.roadSubtle, 6, p.roadMotorway];
  return {
    background: { "background-color": p.background },
    park: { "fill-color": p.park },
    water: { "fill-color": p.water },
    landcover_ice_shelf: { "fill-color": p.ice },
    landcover_glacier: { "fill-color": p.ice },
    landuse_residential: { "fill-color": p.residential },
    landcover_wood: { "fill-color": p.wood },
    waterway: { "line-color": p.waterway },
    building: { "fill-color": p.building, "fill-outline-color": p.buildingOutline },
    tunnel_motorway_casing: { "line-color": p.roadMotorwayCasing },
    tunnel_motorway_inner: { "line-color": p.roadMotorway },
    "aeroway-taxiway": { "line-color": p.aeroway },
    "aeroway-runway-casing": { "line-color": p.aeroway },
    "aeroway-area": { "fill-color": p.aeroway },
    "aeroway-runway": { "line-color": p.roadMajor },
    road_area_pier: { "fill-color": p.background },
    road_pier: { "line-color": p.background },
    highway_path: { "line-color": p.roadPath },
    highway_minor: { "line-color": p.roadMinor },
    highway_major_casing: { "line-color": p.roadMajorCasing },
    highway_major_inner: { "line-color": p.roadMajor },
    highway_major_subtle: { "line-color": p.roadSubtle },
    highway_motorway_casing: { "line-color": p.roadMotorwayCasing },
    highway_motorway_inner: { "line-color": motorwayInner },
    highway_motorway_subtle: { "line-color": p.roadSubtle },
    highway_motorway_bridge_casing: { "line-color": p.roadMotorwayCasing },
    highway_motorway_bridge_inner: { "line-color": motorwayInner },
    railway_transit: { "line-color": p.rail },
    railway_transit_dashline: { "line-color": p.railDash },
    railway_service: { "line-color": p.rail },
    railway_service_dashline: { "line-color": p.railDash },
    railway: { "line-color": p.rail },
    railway_dashline: { "line-color": p.railDash },
    boundary_3: { "line-color": p.boundary },
    boundary_2: { "line-color": p.boundary },
    boundary_disputed: { "line-color": p.boundary },
    waterway_line_label: { "text-color": p.labelWater, "text-halo-color": p.halo },
    water_name_point_label: { "text-color": p.labelWater, "text-halo-color": p.halo },
    water_name_line_label: { "text-color": p.labelWater, "text-halo-color": p.halo },
    "highway-name-path": { "text-color": p.labelMuted, "text-halo-color": p.halo },
    "highway-name-minor": { "text-color": p.labelMuted, "text-halo-color": p.halo },
    "highway-name-major": { "text-color": p.labelMuted, "text-halo-color": p.halo },
    airport: { "text-color": p.labelMuted, "text-halo-color": p.halo },
    label_other: { "text-color": p.labelMuted, "text-halo-color": p.halo },
  };
}

function theme(base: Style, name: string, p: MapPalette): Style {
  const style: Style = structuredClone(base);
  style.name = name;
  // The shaded-relief raster is unused by positron's layers and looks grey on our sand; drop it.
  delete style.sources.ne2_shaded;
  style.layers = style.layers.filter((l) => l.source !== "ne2_shaded");

  const table = overrides(p);
  const missing: string[] = [];
  for (const layer of style.layers) {
    const o = table[layer.id];
    if (o) {
      layer.paint = { ...layer.paint, ...o };
    } else if (layer.type === "symbol") {
      layer.paint = {
        ...layer.paint,
        "text-color": p.label,
        "text-halo-color": p.halo,
        "text-halo-width": 1.4,
      };
    } else {
      missing.push(layer.id);
    }
  }
  if (missing.length) console.warn(`! ${name}: layers kept with upstream colours: ${missing.join(", ")}`);
  return style;
}

const res = await fetch(BASE_STYLE_URL);
if (!res.ok) throw new Error(`Failed to fetch ${BASE_STYLE_URL}: ${res.status}`);
const base = (await res.json()) as Style;

await mkdir("public/map", { recursive: true });
for (const [file, name, palette] of [
  ["tuktrail-light.json", "TukTrail Light", LIGHT],
  ["tuktrail-dark.json", "TukTrail Dark", DARK],
] as const) {
  await writeFile(`public/map/${file}`, JSON.stringify(theme(base, name, palette)));
  console.log(`✓ public/map/${file}`);
}
