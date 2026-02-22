

# Admin Role Management Feature

## Overview
Add the ability for admins to assign any role to any user directly from the Admin User Detail page. A role selector dropdown will appear in the user header card, showing the user's current role and allowing the admin to change it.

## What You'll See
- On the Admin User Detail page, next to the user's name/email, there will be a **role badge** showing their current role (e.g., "creator", "brand", "admin")
- A **"Change Role"** dropdown/select will let admins pick from all 8 available roles: creator, brand, admin, client_admin, client_manager, client_viewer, clipper, platform_admin
- A confirmation dialog will appear before changing the role to prevent accidental changes
- Success/error toast notifications after the action

## Available Roles
- **Creator** -- Default role, can submit clips
- **Brand** -- Can create and manage campaigns
- **Admin** -- Full platform access
- **Client Admin** -- Elevated client access
- **Client Manager** -- Mid-level client access
- **Client Viewer** -- Read-only client access
- **Clipper** -- Clip submission role
- **Platform Admin** -- Platform-level admin

## Technical Details

### Backend
- The database already has an `upgrade_user_role` function (SECURITY DEFINER) that updates a user's role in `user_roles` table
- Create a new edge function `admin-change-role` that:
  - Validates the caller is an admin (checks auth token)
  - Calls `upgrade_user_role` RPC with the target user_id and new role
  - Logs the action in `admin_logs`
- This ensures role changes go through server-side validation, not client-side

### Frontend Changes

**1. `src/hooks/useAdminUsers.ts`**
- Add a `useUserRole(userId)` hook to fetch the user's current role from `user_roles`
- Add a `useChangeUserRole()` mutation hook that invokes the `admin-change-role` edge function

**2. `src/pages/AdminUserDetail.tsx`**
- Add a role display badge next to the user's name
- Add a Select dropdown with all 8 roles
- Wrap the role change in an AlertDialog for confirmation
- Show current role and selected new role in confirmation
- Log the change via admin logs

**3. `supabase/functions/admin-change-role/index.ts`** (new file)
- Accepts `{ user_id, new_role }` in request body
- Uses service role key to call `upgrade_user_role` RPC
- Verifies the caller is an admin before proceeding
- Inserts an admin log entry

### Files to Create/Modify
1. **Create**: `supabase/functions/admin-change-role/index.ts`
2. **Modify**: `src/hooks/useAdminUsers.ts` -- add role fetch + change mutation
3. **Modify**: `src/pages/AdminUserDetail.tsx` -- add role UI in the user header card

