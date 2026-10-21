import {
  Binoculars,
  Castle,
  Flower2,
  Footprints,
  Landmark,
  MapPin,
  PawPrint,
  TreePalm,
  Trees,
  Waves,
  type LucideProps,
} from "lucide-react";
import type { PlaceCategory } from "@/shared/constants/places";

/** Stupa silhouette — lucide has no fitting temple glyph. Same 24px grid and stroke as lucide. */
function Stupa(props: LucideProps) {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M12 2v4" />
      <path d="M10 6h4v2h-4z" />
      <path d="M5.5 17c0-5 3-8.5 6.5-9 3.5.5 6.5 4 6.5 9" />
      <path d="M3 17h18v3H3z" />
    </svg>
  );
}

/** Waterfall: cliff edge with falling lines. */
function Waterfall(props: LucideProps) {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 4h7v16" />
      <path d="M21 4h-4" />
      <path d="M13 4v11" />
      <path d="M16.5 7v10" />
      <path d="M20 9v6" />
      <path d="M10 20c2 1.3 4.5 1.3 7 0s4-.7 5 0" />
    </svg>
  );
}

const ICONS: Record<PlaceCategory, (p: LucideProps) => React.ReactNode> = {
  temple: Stupa,
  heritage_site: Castle,
  beach: TreePalm,
  waterfall: Waterfall,
  national_park: Trees,
  wildlife: PawPrint,
  viewpoint: Binoculars,
  hike: Footprints,
  museum: Landmark,
  lake: Waves,
  garden: Flower2,
  other: MapPin,
};

export function CategoryIcon({ category, ...props }: { category: PlaceCategory } & LucideProps) {
  const Icon = ICONS[category];
  return <Icon aria-hidden {...props} />;
}
