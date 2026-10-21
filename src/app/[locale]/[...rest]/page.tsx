import { notFound } from "next/navigation";

// Unmatched paths under a locale render the designed [locale]/not-found page
// instead of Next's bare default 404.
// Always 404s, so there is no static shell to validate.
export const instant = false;

export default function CatchAllPage() {
  notFound();
}
