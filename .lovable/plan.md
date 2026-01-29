
# Plan: Grant Admin Role to User

## Overview
Update the role for user `virat12912@gmail.com` (ApexClipping) from `brand` to `admin`.

## Current State
| Field | Value |
|-------|-------|
| User ID | `a59ac4e9-fe22-47e3-bcd6-3569de2b7258` |
| Email | virat12912@gmail.com |
| Name | ApexClipping |
| Current Role | brand |

## Action
Update the `user_roles` table to change the role from `brand` to `admin`:

```text
UPDATE user_roles
SET role = 'admin'
WHERE user_id = 'a59ac4e9-fe22-47e3-bcd6-3569de2b7258'
```

## Result
After this change, the user will have full admin access including:
- View and manage all campaigns
- Approve/reject submissions
- Process payouts
- View all user profiles
- Access admin dashboard and logs

## Technical Notes
- Uses the existing `upgrade_user_role` database function or direct UPDATE
- No code changes required - role is checked via RLS policies and `has_role()` function
