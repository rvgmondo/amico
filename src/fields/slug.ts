import type { Field } from "payload";

// Combining diacritical marks (U+0300–U+036F), stripped after NFKD normalisation.
const DIACRITICS = /[̀-ͯ]/g;

const slugify = (val: string): string =>
  val
    .toString()
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Reusable URL slug field. Auto-fills from `fieldToUse` when left blank, and
 * normalises anything typed manually. Lives in the sidebar, indexed for lookups.
 */
export const slugField = (fieldToUse = "title"): Field => ({
  name: "slug",
  type: "text",
  index: true,
  unique: true,
  admin: {
    position: "sidebar",
    description: "Auto-generated from the name if left blank.",
  },
  hooks: {
    beforeValidate: [
      ({ value, data, originalDoc }) => {
        if (typeof value === "string" && value.length > 0) return slugify(value);
        const source = data?.[fieldToUse] ?? originalDoc?.[fieldToUse];
        if (typeof source === "string" && source.length > 0) return slugify(source);
        return value;
      },
    ],
  },
});
