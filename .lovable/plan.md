

# Landing Page Elevation Plan

## Overview
Upgrade the Amplify landing page from solid to premium-tier without changing the dark cyber aesthetic or layout structure. Four enhancements, no new sections added.

---

## 1. Enhanced Navbar with Scroll Effect
**What changes:** The navbar will gain a dynamic background that intensifies as users scroll -- starting nearly transparent and becoming more opaque with a subtle bottom glow when scrolled.

**File:** `src/components/landing/Navbar.tsx`
- Add a `useEffect` with a scroll listener tracking `window.scrollY`
- When scrolled > 20px, apply stronger `bg-background/90` and a `shadow-[0_1px_20px_hsl(var(--primary)/0.1)]` bottom glow
- Smooth transition via CSS classes

---

## 2. Richer Hero Section with Social Proof
**What changes:** Add a subtle animated dot grid overlay behind the hero and a "trusted by" social proof strip below the CTA buttons (before the stat cards).

**File:** `src/components/landing/HeroSection.tsx`
- Add a `dot-grid` overlay element (already defined in CSS) with low opacity, layered behind content
- Add a social proof row: "Trusted by 500+ creators and 150+ brands" with small glowing divider dots
- Slight visual refinement to the mesh background (add a third gradient blob for depth)

**File:** `src/index.css`
- Add a third `::before`/`::after` mesh element via a new `.mesh-bg-extra` class with a different color accent (blue-purple shift)

---

## 3. Multi-Card Testimonials Layout
**What changes:** Replace the single rotating testimonial card with a visible 3-card layout (1 on mobile) where the active card is highlighted and side cards are dimmed/scaled down, creating a carousel feel with more visual weight.

**File:** `src/components/landing/TestimonialsSection.tsx`
- Show 3 testimonials at once on desktop (previous, active, next) in a horizontal row
- Active card: full opacity, slight scale-up, primary border glow
- Side cards: reduced opacity (0.4), slightly scaled down (0.9), muted border
- Keep the dot navigation and auto-rotation
- On mobile: show only the active card (current behavior)
- Increase max-width from `max-w-2xl` to `max-w-5xl` to accommodate the 3-card layout

---

## 4. Dashboard Preview Visual
**What changes:** Add a floating dashboard mockup image between the "Who It's For" section and Testimonials to break up text-heavy sections and show the product.

**File:** `src/components/landing/DashboardPreviewSection.tsx` (new component)
- A simple section with a headline like "Your Command Center" and a subline
- Display the existing `src/assets/dashboard-preview.png` inside a styled browser-frame mockup (rounded corners, fake title bar dots, border glow)
- Glassmorphism card wrapper with `glass-card` class
- Scroll-reveal animation on entry
- Subtle primary glow shadow behind the image

**File:** `src/pages/Index.tsx`
- Import and add `DashboardPreviewSection` between `WhoItsForSection` and `TestimonialsSection`

---

## Technical Details

### Navbar scroll detection (Navbar.tsx)
```typescript
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, []);
// Apply: className={`... ${scrolled ? "bg-background/90 shadow-[...]" : "bg-background/70"}`}
```

### Testimonial 3-card logic (TestimonialsSection.tsx)
```typescript
const getIndex = (offset: number) =>
  (active + offset + testimonials.length) % testimonials.length;
// Render: [getIndex(-1), active, getIndex(1)] on desktop
// Each with conditional opacity/scale classes
```

### Dashboard mockup frame (DashboardPreviewSection.tsx)
- Browser chrome dots (3 colored circles) in a top bar
- Image wrapped in `rounded-xl overflow-hidden border border-border/30`
- Outer glow: `shadow-[0_0_60px_hsl(var(--primary)/0.15)]`

### Files modified
| File | Action |
|------|--------|
| `src/components/landing/Navbar.tsx` | Add scroll state + dynamic classes |
| `src/components/landing/HeroSection.tsx` | Add dot grid overlay + social proof strip |
| `src/components/landing/TestimonialsSection.tsx` | Rewrite to 3-card carousel layout |
| `src/components/landing/DashboardPreviewSection.tsx` | Create new component |
| `src/pages/Index.tsx` | Import DashboardPreviewSection |
| `src/index.css` | Add mesh-bg extra element + minor helpers |

