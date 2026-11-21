/**
 * Single source of truth for role -> nav / route mapping (H-30).
 *
 * The route guards in src/App.tsx and the sidebar in
 * src/components/app/AppSidebar.tsx MUST derive from these helpers —
 * duplicating the role lists in two places is what drifted before
 * (client_admin saw "Launch Campaign", platform_admin saw the Admin
 * section, and both bounced to /dashboard on every click).
 *
 * Route-guard truth (must stay in sync with src/App.tsx):
 *   /launch  -> admin, brand            (LAUNCH_ROLES)
 *   /admin*  -> admin only              (ADMIN_ROLES)
 *   /client* -> client_admin, client_manager, client_viewer (CLIENT_ROLES)
 * Everything else is open to any authenticated role.
 */

export type AppRole =
  | "creator"
  | "brand"
  | "admin"
  | "client_admin"
  | "client_manager"
  | "client_viewer"
  | "clipper"
  | "platform_admin";

/** Roles that see creator/clipper KPIs and submission flows. */
export const CLIPPER_ROLES: AppRole[] = ["creator", "clipper"];

/** Roles that live under /client. */
export const CLIENT_ROLES: AppRole[] = ["client_admin", "client_manager", "client_viewer"];

/** Roles allowed on /admin* routes. */
export const ADMIN_ROLES: AppRole[] = ["admin"];

/** Roles allowed on /launch. */
export const LAUNCH_ROLES: AppRole[] = ["admin", "brand"];

export function isClipperRole(role: AppRole | null | undefined): role is "creator" | "clipper" {
  return role === "creator" || role === "clipper";
}

export function isClientRole(
  role: AppRole | null | undefined,
): role is "client_admin" | "client_manager" | "client_viewer" {
  return role === "client_admin" || role === "client_manager" || role === "client_viewer";
}

export function isAdminRole(role: AppRole | null | undefined): role is "admin" {
  return role === "admin";
}

export function isPlatformAdminRole(role: AppRole | null | undefined): role is "platform_admin" {
  return role === "platform_admin";
}

export function isBrandRole(role: AppRole | null | undefined): role is "brand" {
  return role === "brand";
}

/** Sidebar "Launch Campaign" visibility — must match the /launch guard. */
export function canLaunchCampaigns(role: AppRole | null | undefined): boolean {
  return role === "admin" || role === "brand";
}

/** Sidebar "Admin" section visibility — must match the /admin* guards. */
export function hasAdminAccess(role: AppRole | null | undefined): boolean {
  return role === "admin";
}
