import type { CollectionConfig } from "payload";

/**
 * Staff accounts for the admin portal.
 *
 * Phase 1: basic email/password auth. Roles and field/collection-level access
 * control (Admin vs Editor) are added in Phase 2 (data model & access control).
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email"],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
