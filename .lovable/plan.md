

# Plan: Real-Time Submission View Updates

## Overview
Add real-time view updates to submissions so creators and admins see live view counts without page refresh, similar to how notifications currently work.

## Current Architecture
- Views are fetched at submission time and refreshed daily via cron job
- Dashboard polls data on mount but doesn't receive live updates
- Notifications already use Supabase Realtime for instant updates

## Implementation Approach

### 1. Enable Realtime on Submissions Table
Add the submissions table to Supabase Realtime publication to broadcast changes.

**Database change:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
```

### 2. Add Realtime Subscription to Submissions Hook
Update `useMySubmissions` to subscribe to real-time changes, mirroring the pattern used in `useNotifications`.

**File:** `src/hooks/useSubmissions.ts`
- Add `useEffect` with Supabase channel subscription
- Listen for `UPDATE` events on submissions for the current user
- Invalidate queries when changes are detected

### 3. Add Realtime to Admin Submissions
For the admin dashboard, subscribe to all submission updates.

**File:** `src/hooks/useSubmissions.ts` (in `useAllSubmissions`)
- Add realtime subscription for admins to see updates across all submissions

### 4. (Optional) On-Demand Refresh Button
Add a "Refresh Views" button on individual submission cards that triggers a fresh view fetch for that specific clip.

**Files to modify:**
- Create new edge function `refresh-single-submission` or reuse existing `fetch-tiktok-views`/`fetch-instagram-views`
- Add UI button component on submission cards

---

## Technical Details

### Realtime Subscription Pattern (from notifications)
```typescript
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel('submissions-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'submissions',
        filter: `creator_id=eq.${user.id}`
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["submissions"] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user, queryClient]);
```

### Files to Modify
| File | Changes |
|------|---------|
| `src/hooks/useSubmissions.ts` | Add realtime subscriptions to `useMySubmissions` and `useAllSubmissions` |
| Database migration | Enable realtime for submissions table |

### How Updates Flow
1. Daily cron job runs `update-all-views` edge function
2. Edge function updates submissions in database
3. Supabase Realtime broadcasts the change
4. Frontend hooks receive the update and refresh data
5. UI updates instantly without page reload

---

## Summary
This adds real-time view updates using the same pattern already working for notifications. When views are updated (via daily cron or manual refresh), all connected clients will see the changes immediately.

