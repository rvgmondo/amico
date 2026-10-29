import type { CollectionConfig } from "payload";

import { canAccessAdmin, isAdmin, isAdminFieldLevel, isAdminOrSelf } from "../access/access";
import { b } from "../i18n/labels";

/**
 * Staff accounts for the admin portal.
 *
 * Roles:
 *  - `admin` , full access, incl. user management and site settings.
 *  - `editor`, content + inventory, no user management, cannot change roles.
 *
 * Access is enforced server-side at the collection and field level.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: b("User", "Gebruiker"), plural: b("Users", "Gebruikers") },
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "roles"],
    group: b("Admin", "Bestuur"),
  },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: canAccessAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      saveToJWT: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      access: {
        // Only admins may grant or change roles (prevents privilege escalation).
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      admin: {
        description: "Admins manage users & settings. Editors manage content & inventory.",
      },
    },
  ],
};
