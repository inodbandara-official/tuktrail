"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLACE_CATEGORIES } from "@/shared/constants/places";
import { Chip } from "@/components/ui/Chip";
import { Switch } from "@/components/ui/Switch";
import { SearchField } from "@/components/ui/SearchField";
import { CategoryIcon } from "@/components/places/CategoryIcon";

export function ChipDemo() {
  const t = useTranslations("categories");
  const [on, setOn] = useState<Set<string>>(new Set(["waterfall", "beach"]));
  return (
    <div className="flex flex-wrap gap-2">
      {PLACE_CATEGORIES.map((c) => (
        <Chip
          key={c}
          pressed={on.has(c)}
          icon={<CategoryIcon category={c} className="size-4" />}
          onClick={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (next.has(c)) next.delete(c);
              else next.add(c);
              return next;
            })
          }
        >
          {t(c)}
        </Chip>
      ))}
    </div>
  );
}

export function ControlsDemo() {
  const t = useTranslations("design");
  const [month, setMonth] = useState(true);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <SearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} className="sm:w-80" />
      <Switch checked={month} onChange={setMonth} label={t("toggle")} />
    </div>
  );
}
