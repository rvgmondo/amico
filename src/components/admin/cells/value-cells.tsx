"use client";

import type { DefaultCellComponentProps } from "payload";

import { formatKm, formatPrice } from "@/lib/format";

/**
 * List cells that show a stored value the way a person reads it: "R 499 900" rather than 499900,
 * "130 000 km", and a car's status as a small badge. Adapted from the Rynet admin. Display only;
 * never used on a list's first column, which Payload links to the record.
 */

function Empty() {
  return <span className="am-admin-cell am-admin-cell--empty">Not set</span>;
}

export function RandCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "number" || !Number.isFinite(cellData)) return <Empty />;
  return <span className="am-admin-cell am-admin-cell--figure">{formatPrice(cellData)}</span>;
}

export function KmCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "number" || !Number.isFinite(cellData)) return <Empty />;
  return <span className="am-admin-cell am-admin-cell--figure">{formatKm(cellData)}</span>;
}

const STATUS: Record<string, { label: string; tone: string }> = {
  available: { label: "Available", tone: "ok" },
  reserved: { label: "Reserved", tone: "warn" },
  sold: { label: "Sold", tone: "quiet" },
};

export function StatusCell({ cellData }: DefaultCellComponentProps) {
  const s = typeof cellData === "string" ? STATUS[cellData] : undefined;
  if (!s) return <Empty />;
  return <span className={`am-admin-pill am-admin-pill--${s.tone}`}>{s.label}</span>;
}
