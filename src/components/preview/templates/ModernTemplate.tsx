"use client";

import type {
  Resume,
  Section,
  Item,
  StringItem,
  DateRangeItem,
  LinkItem,
  RatingItem,
} from "@/types/resume";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  StarIcon,
} from "lucide-react";

interface ModernTemplateProps {
  resume: Resume;
}

function isStringItem(item: Item): item is StringItem {
  return "value" in item && typeof item.value === "string";
}

function isDateRangeItem(item: Item): item is DateRangeItem {
  return item.type === "date-range";
}

function isLinkItem(item: Item): item is LinkItem {
  return item.type === "link" || item.type === "social";
}

function isRatingItem(item: Item): item is RatingItem {
  return item.type === "rating";
}

function formatDateRange(value: DateRangeItem["value"]): string {
  const start = value.startDate;
  const end = value.endDate || "Present";
  return `${start} - ${end}`;
}

interface ItemColors {
  text: string;
  primary: string;
  secondary: string;
  muted: string;
}

function ModernItem({
  item,
  colors,
}: {
  item: Item;
  colors: ItemColors;
}) {
  if (!item.visible) return null;

  if (isStringItem(item)) {
    switch (item.type) {
      case "heading":
        return (
          <h3
            className="text-lg font-bold"
            style={{ color: colors.text }}
          >
            {item.value}
          </h3>
        );
      case "sub-heading":
        return (
          <h4
            className="text-base font-semibold"
            style={{ color: colors.secondary }}
          >
            {item.value}
          </h4>
        );
      case "text":
        return (
          <p className="text-sm" style={{ color: colors.text }}>
            {item.value}
          </p>
        );
      case "bullet":
        return (
          <li
            className="text-sm ml-4 list-disc"
            style={{ color: colors.text }}
          >
            {item.value}
          </li>
        );
      case "number":
        return (
          <li
            className="text-sm ml-4 list-decimal"
            style={{ color: colors.text }}
          >
            {item.value}
          </li>
        );
      case "date":
        return (
          <span
            className="text-sm italic"
            style={{ color: colors.muted }}
          >
            {item.value}
          </span>
        );
      case "location":
        return (
          <span
            className="text-sm inline-flex items-center gap-1"
            style={{ color: colors.muted }}
          >
            <MapPinIcon className="size-3" />
            {item.value}
          </span>
        );
      case "email":
        return (
          <a
            href={`mailto:${item.value}`}
            className="text-sm inline-flex items-center gap-1 hover:underline"
            style={{ color: colors.muted }}
          >
            <MailIcon className="size-3" />
            {item.value}
          </a>
        );
      case "phone":
        return (
          <a
            href={`tel:${item.value}`}
            className="text-sm inline-flex items-center gap-1 hover:underline"
            style={{ color: colors.muted }}
          >
            <PhoneIcon className="size-3" />
            {item.value}
          </a>
        );
      case "tag":
        return (
          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {item.value}
          </span>
        );
      default:
        return null;
    }
  }

  if (isDateRangeItem(item)) {
    return (
      <span
        className="text-sm italic"
        style={{ color: colors.muted }}
      >
        {formatDateRange(item.value)}
      </span>
    );
  }

  if (isLinkItem(item)) {
    return (
      <a
        href={item.value.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm inline-flex items-center gap-1 hover:underline"
        style={{ color: colors.primary }}
      >
        <LinkIcon className="size-3" />
        {item.value.label}
      </a>
    );
  }

  if (isRatingItem(item)) {
    const { label, score, max, display } = item.value;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: colors.text }}>
          {label}
        </span>
        <div className="flex gap-0.5">
          {display === "stars" &&
            Array.from({ length: max }).map((_, i) => (
              <StarIcon
                key={i}
                className="size-4"
                fill={i < score ? colors.primary : "transparent"}
                stroke={colors.primary}
              />
            ))}
          {display === "dots" &&
            Array.from({ length: max }).map((_, i) => (
              <span
                key={i}
                className="size-2 rounded-full"
                style={{
                  backgroundColor: i < score ? colors.primary : colors.muted,
                }}
              />
            ))}
          {display === "bar" && (
            <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(score / max) * 100}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "separator") {
    return <hr className="my-2 border-t" style={{ borderColor: colors.muted }} />;
  }

  return null;
}

function ModernSection({
  section,
  colors,
}: {
  section: Section;
  colors: ItemColors;
}) {
  if (!section.visible) return null;

  const { layout, columns = 3, items } = section.content;

  return (
    <div className="mb-6">
      <h2
        className="text-sm font-bold uppercase tracking-wide mb-3 pb-1 border-b-2"
        style={{
          color: colors.primary,
          borderColor: colors.primary,
        }}
      >
        {section.title}
      </h2>

      {layout === "grid" ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {items.map((item) => (
            <ModernItem key={item.id} item={item} colors={colors} />
          ))}
        </div>
      ) : layout === "inline" ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <ModernItem key={item.id} item={item} colors={colors} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) =>
            item.type === "bullet" || item.type === "number" ? (
              <ul key={item.id}>
                <ModernItem item={item} colors={colors} />
              </ul>
            ) : (
              <ModernItem key={item.id} item={item} colors={colors} />
            )
          )}
        </div>
      )}
    </div>
  );
}

export function ModernTemplate({ resume }: ModernTemplateProps) {
  const { personal, sections, metadata } = resume;
  const { colors: colorScheme } = metadata;

  const colors: ItemColors = {
    text: colorScheme.text,
    primary: colorScheme.accents[0] ?? "#2563eb",
    secondary: colorScheme.accents[1] ?? "#3b82f6",
    muted: colorScheme.accents[3] ?? "#6b7280",
  };

  return (
    <div
      className="w-full h-full p-8 font-sans"
      style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}
    >
      <header className="mb-8 text-center">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ color: colors.primary }}
        >
          {personal.fullName}
        </h1>
        {personal.jobTitle && (
          <p
            className="text-lg"
            style={{ color: colors.secondary }}
          >
            {personal.jobTitle}
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {personal.details.map((item) => (
            <ModernItem key={item.id} item={item} colors={colors} />
          ))}
        </div>
      </header>

      <main>
        {sections.map((section) => (
          <ModernSection key={section.id} section={section} colors={colors} />
        ))}
      </main>
    </div>
  );
}
