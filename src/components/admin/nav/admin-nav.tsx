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
const FOLDED_BY_DEFAULT = ["Blog", "Content", "Admin", "Settings"];

const readLabel = (label: unknown, fallback: string): string => {
  if (typeof label === "string" && label) return label;
  if (label && typeof label === "object") {
    const en = (label as Record<string, unknown>).en;
    if (typeof en === "string" && en) return en;
  }
  return fallback;
};

export async function AdminNav(
  props: ServerProps & { req?: PayloadRequest; visibleEntities?: ServerProps["visibleEntities"] },
) {
  const { payload, permissions, visibleEntities, req, user } = props;
  if (!payload?.config) return null;
  const admin = payload.config.routes.admin;
  const visible = visibleEntities?.collections ?? [];

  const primary: NavEntity[] = [];
  const groups = new Map<string, NavEntity[]>();
  for (const c of payload.config.collections) {
    if (!visible.includes(c.slug)) continue;
    if (!permissions?.collections?.[c.slug]?.read) continue;
    if (c.admin?.group === false) continue;
    const entity = { label: readLabel(c.labels?.plural, c.slug), href: `${admin}/collections/${c.slug}` };
    if (PRIMARY.includes(c.slug)) {
      primary[PRIMARY.indexOf(c.slug)] = entity;
      continue;
    }
    const group = readLabel(c.admin?.group, "Content");
    groups.set(group, [...(groups.get(group) ?? []), entity]);
  }
  for (const g of payload.config.globals) {
    if (!(visibleEntities?.globals ?? []).includes(g.slug)) continue;
    if (!permissions?.globals?.[g.slug]?.read) continue;
    const group = readLabel(g.admin?.group, "Settings");
    groups.set(group, [
      ...(groups.get(group) ?? []),
      { label: readLabel(g.label, g.slug), href: `${admin}/globals/${g.slug}` },
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
      adminRoute={admin}
      logoutHref={`${admin}${payload.config.admin.routes.logout}`}
      primary={primary.filter(Boolean)}
      sections={sections}
    />
  );
}
