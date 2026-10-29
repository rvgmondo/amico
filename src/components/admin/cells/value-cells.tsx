"use client";

import { useTranslation } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { formatKm, formatPrice } from "@/lib/format";

/**
 * List cells that show a stored value the way a person reads it: "R 499 900" rather than 499900,
 * "130 000 km", and a car's status as a small badge. Adapted from the Rynet admin. Display only;
 * never used on a list's first column, which Payload links to the record.
 */

function Empty() {
  const { i18n } = useTranslation();
  return <span className="am-admin-cell am-admin-cell--empty">{i18n.language === "af" ? "Nie ingevul" : "Not set"}</span>;
}

export function RandCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "number" || !Number.isFinite(cellData)) return <Empty />;
  return <span className="am-admin-cell am-admin-cell--figure">{formatPrice(cellData)}</span>;
}

export function KmCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "number" || !Number.isFinite(cellData)) return <Empty />;
  return <span className="am-admin-cell am-admin-cell--figure">{formatKm(cellData)}</span>;
}

const STATUS: Record<string, { en: string; af: string; tone: string }> = {
  available: { en: "Available", af: "Beskikbaar", tone: "ok" },
  reserved: { en: "Reserved", af: "Bespreek", tone: "warn" },
  sold: { en: "Sold", af: "Verkoop", tone: "quiet" },
};

export function StatusCell({ cellData }: DefaultCellComponentProps) {
  const { i18n } = useTranslation();
  const s = typeof cellData === "string" ? STATUS[cellData] : undefined;
  if (!s) return <Empty />;
  return <span className={`am-admin-pill am-admin-pill--${s.tone}`}>{i18n.language === "af" ? s.af : s.en}</span>;
}
