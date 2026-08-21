import type { Access, FieldAccess } from "payload";

/**
 * Role-based access control.
 *
 * Two roles: `admin` (full access, incl. user & settings management) and
 * `editor` (content + inventory, no user management). Access is enforced at the
 * collection and field level server-side, never rely on hiding admin UI alone.
 */

const rolesOf = (user: unknown): string[] =>
  ((user as { roles?: string[] } | null | undefined)?.roles ?? []) as string[];

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => rolesOf(user).includes("admin");

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  const roles = rolesOf(user);
  return roles.includes("admin") || roles.includes("editor");
};

/** Admins see all users; a signed-in user may only read/update their own record. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (rolesOf(user).includes("admin")) return true;
  return { id: { equals: user.id } };
};

/** Admin-panel access must be boolean-only (no Where query). */
export const canAccessAdmin = ({ req }: { req: { user?: unknown } }): boolean =>
  rolesOf(req.user).length > 0;

/** Public sees only published docs; editors/admins see everything (incl. drafts). */
export const publishedOrEditor: Access = ({ req: { user } }) => {
  const roles = rolesOf(user);
  if (roles.includes("admin") || roles.includes("editor")) return true;
  return { _status: { equals: "published" } };
};

// --- Field-level ---

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  rolesOf(user).includes("admin");
