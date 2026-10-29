import type { PayloadRequest, ServerProps } from "payload";
import { PREFERENCE_KEYS } from "payload/shared";

import { AdminNavClient, type NavEntity, type NavSection } from "./admin-nav-client";

/**
 * The admin menu (`admin.components.Nav`), adapted from the Rynet and Verboten admins.
 *
 * Home, Vehicles and Enquiries sit at the top as plain links, because they are the day's work.
 * Everything else is grouped below by each collection's `admin.group`, with the quieter groups
 * folded until needed. Each person's open and closed groups are remembered.
 *
 * UI only: every link is filtered by the same read permission Payload uses, and access rules
 * still decide what each page shows.
 */

type NavPreferences = { open?: boolean; groups?: Record<string, { open?: boolean } | undefined> };

const PRIMARY = ["vehicles", "enquiries"];
// Folded until opened, in both languages.
const FOLDED_BY_DEFAULT = ["Blog", "Content", "Admin", "Settings", "Inhoud", "Bestuur", "Instellings"];

/** A config label in the reader's language: plain strings as they are, { en, af } by language. */
const readLabel = (label: unknown, fallback: string, lang: string): string => {
  if (typeof label === "string" && label) return label;
  if (label && typeof label === "object") {
    const byLang = label as Record<string, unknown>;
    const text = byLang[lang] ?? byLang.en;
    if (typeof text === "string" && text) return text;
  }
  return fallback;
};

export async function AdminNav(
  props: ServerProps & { req?: PayloadRequest; visibleEntities?: ServerProps["visibleEntities"] },
) {
  const { payload, permissions, visibleEntities, req, user, i18n } = props;
  const lang = i18n?.language === "af" ? "af" : "en";
  if (!payload?.config) return null;
  const admin = payload.config.routes.admin;
  const visible = visibleEntities?.collections ?? [];

  const primary: NavEntity[] = [];
  const groups = new Map<string, NavEntity[]>();
  for (const c of payload.config.collections) {
    if (!visible.includes(c.slug)) continue;
    if (!permissions?.collections?.[c.slug]?.read) continue;
    if (c.admin?.group === false) continue;
    const entity = { label: readLabel(c.labels?.plural, c.slug, lang), href: `${admin}/collections/${c.slug}` };
    if (PRIMARY.includes(c.slug)) {
      primary[PRIMARY.indexOf(c.slug)] = entity;
      continue;
    }
    const group = readLabel(c.admin?.group, lang === "af" ? "Inhoud" : "Content", lang);
    groups.set(group, [...(groups.get(group) ?? []), entity]);
  }
  for (const g of payload.config.globals) {
    if (!(visibleEntities?.globals ?? []).includes(g.slug)) continue;
    if (!permissions?.globals?.[g.slug]?.read) continue;
    const group = readLabel(g.admin?.group, lang === "af" ? "Instellings" : "Settings", lang);
    groups.set(group, [
      ...(groups.get(group) ?? []),
      { label: readLabel(g.label, g.slug, lang), href: `${admin}/globals/${g.slug}` },
    ]);
  }

  let preferences: NavPreferences | null = null;
  if (user && req) {
    const found = await payload.find({
      collection: "payload-preferences",
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        and: [
          { key: { equals: PREFERENCE_KEYS.NAV } },
          { "user.relationTo": { equals: user.collection } },
          { "user.value": { equals: user.id } },
        ],
      },
    });
    const value = found.docs[0]?.value;
    if (value && typeof value === "object") preferences = value as NavPreferences;
  }

  const sections: NavSection[] = [...groups.entries()].map(([label, entities]) => ({
    label,
    entities,
    open: preferences?.groups?.[label]?.open ?? !FOLDED_BY_DEFAULT.includes(label),
  }));

  return (
    <AdminNavClient
      lang={lang}
      adminRoute={admin}
      logoutHref={`${admin}${payload.config.admin.routes.logout}`}
      primary={primary.filter(Boolean)}
      sections={sections}
    />
  );
}
