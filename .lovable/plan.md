

# Complete Site-Wide Premium Redesign -- Virality.gg Inspired

## Overview
Apply the same premium dark aesthetic with Coolvetica font, gradients, glows, and smooth animations to EVERY remaining page that hasn't been fully updated yet. Taking inspiration from virality.gg's clean minimal dark design while keeping Amplify's unique identity.

## Pages to Update

### 1. CampaignDetail.tsx (Major overhaul)
Currently uses basic `bg-card border border-border` styling without premium effects.
- Add `font-display` to all headings
- Replace basic cards with `rounded-2xl bg-card/50 border-border/30` glass style
- Add `card-hover` effects on interactive sections
- Gradient primary avatar/icon backgrounds with glow
- `stagger-enter` on submission list items
- `page-enter` animation on load
- `btn-shimmer` on submit button
- Platform selector buttons with glow when active
- Status badges with backdrop-blur
- Progress bars with `bg-gradient-primary`
- Tabs with `bg-secondary/30 backdrop-blur-sm`

### 2. Launch.tsx (Campaign creation wizard)
Currently uses basic form styling.
- Progress step circles: use `bg-gradient-primary` with `glow-primary-sm` for active/completed
- Connecting lines: use `bg-primary` gradient
- Form cards: `rounded-2xl bg-card/50 border-border/30` with glass effect
- Input fields: `bg-card/50 border-border/30 rounded-xl` consistent with Auth page
- Platform toggle buttons with glow effect on selected
- Category buttons with hover effects
- Image upload area: `rounded-2xl` with primary border-dashed on hover
- Continue/Submit buttons: `bg-gradient-primary btn-shimmer glow-primary-sm`
- Step labels with `font-display`
- `page-enter` animation
- Review step with clean stat cards

### 3. AdminDashboard.tsx
Currently has basic styling, missing premium effects.
- Add `font-display` to headings ("Platform Overview")
- Campaign Health cards: `rounded-2xl` with hover lift effect
- StatCard: add `font-display` on values, `group-hover:scale-110` on icons, `rounded-2xl`
- QuickActionCard: `rounded-2xl`, `btn-glow` on hover, gradient icon backgrounds
- Recent activity cards: `rounded-2xl bg-card/50 border-border/30`, hover effects
- Submission/payout list items: smooth transition hover states
- Header action buttons: `rounded-xl border-border/30` style
- `stagger-enter` on KPI grid and stat cards

### 4. AdminSubmissions.tsx
Basic list styling needs premium treatment.
- Campaign list items: `rounded-2xl bg-card/50 border-border/30` with hover lift
- Campaign avatar: gradient background with glow
- Status badges: backdrop-blur pill style
- Pending/approved count badges with glow
- `font-display` on campaign names
- `stagger-enter` on the list
- `page-enter` on mount
- Empty state with gradient variant

### 5. AdminPayouts.tsx
Basic card layout needs upgrade.
- Payout cards: `rounded-2xl bg-card/50 border-border/30` with hover effects
- Amount display: `font-display font-bold text-gradient` for large amounts
- Payment details section: `rounded-xl bg-secondary/20 border-border/15`
- Code/wallet display: `bg-card/50 rounded-lg` monospace
- Action buttons: approve = `bg-emerald-500 btn-shimmer`, reject = destructive, mark paid = `bg-gradient-primary btn-shimmer`
- Status badges: consistent pill style with backdrop-blur
- `stagger-enter` on list
- `page-enter` on mount

### 6. AdminBrands.tsx
- Same premium card treatment with rounded-2xl, glass effect, hover lift
- `font-display` on headings and names
- Action buttons with glow effects
- Status badges consistent styling
- `stagger-enter` animation

### 7. AdminUserDetail.tsx, AdminUserSubmissions.tsx, AdminCampaignSubmissions.tsx, AdminCampaignPayouts.tsx, AdminSocialAccounts.tsx
- Apply same premium card/badge/button patterns
- `font-display` on all headings
- Consistent `rounded-2xl` cards with glass borders
- Gradient accents on key metrics
- Hover effects and stagger animations

### 8. BrandApplication.tsx
- Form card: `rounded-2xl bg-card/50 border-border/30`
- Inputs: `rounded-xl bg-card/50 border-border/30`
- Submit button: `bg-gradient-primary btn-shimmer glow-primary-sm`
- `font-display` headings
- `page-enter` animation

### 9. ResetPassword.tsx
- Match Auth page styling
- Gradient mesh background on right side
- Glass card form
- `btn-shimmer` on reset button

### 10. NotFound.tsx
- Centered layout with mesh background
- `font-display` on "404" and heading
- Gradient text on "404"
- CTA button with `bg-gradient-primary btn-shimmer`

## Technical Details

### Consistent patterns to apply everywhere:
- **Cards**: `rounded-2xl bg-card/50 border border-border/30` (replacing `bg-card border border-border`)
- **Headings**: `font-display font-bold` class on all h1-h6
- **Inputs**: `h-12 bg-card/50 border-border/30 rounded-xl` 
- **Primary buttons**: `bg-gradient-primary hover:opacity-90 glow-primary-sm btn-shimmer rounded-xl font-display font-bold`
- **Outline buttons**: `rounded-xl border-border/30 hover:border-primary/30`
- **Status badges**: `backdrop-blur-sm rounded-lg` with color-coded backgrounds
- **Page load**: `page-enter` class on main content wrapper
- **List animations**: `stagger-enter` class on list containers
- **Card hovers**: `hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300`
- **Icon containers**: `group-hover:scale-110 transition-all duration-300`
- **Skeletons**: `rounded-2xl` to match cards

### Files to modify:
1. `src/pages/CampaignDetail.tsx`
2. `src/pages/Launch.tsx`
3. `src/pages/AdminDashboard.tsx`
4. `src/pages/AdminSubmissions.tsx`
5. `src/pages/AdminPayouts.tsx`
6. `src/pages/AdminBrands.tsx`
7. `src/pages/AdminUserDetail.tsx`
8. `src/pages/AdminUserSubmissions.tsx`
9. `src/pages/AdminCampaignSubmissions.tsx`
10. `src/pages/AdminCampaignPayouts.tsx`
11. `src/pages/AdminSocialAccounts.tsx`
12. `src/pages/BrandApplication.tsx`
13. `src/pages/ResetPassword.tsx`
14. `src/pages/NotFound.tsx`

### No new dependencies needed
All styling uses existing Tailwind classes, CSS utilities from `index.css`, and the Coolvetica font already imported.

