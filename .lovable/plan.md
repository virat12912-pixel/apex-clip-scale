

# Unique Amplify Landing Page - Coolvetica Font, Gradients, Glows, and Animations

## Overview
Complete visual overhaul to make the landing page feel original and premium -- not a copy of any other site. Adding Coolvetica font, rich gradient effects, smooth animations throughout, and interactive element mechanisms.

## What Changes

### 1. Coolvetica Font
- Import Coolvetica font via `@font-face` in `src/index.css` (using a CDN or self-hosted woff2)
- Apply as the display/heading font across all landing page headings
- Update `tailwind.config.ts` to set `font-display` to Coolvetica

### 2. Hero Section - Completely Unique
- **Remove**: Typewriter effect, geometric SVG decorations, scrolling marquee, dashboard screenshot with browser chrome -- all of which are Vyron patterns
- **New headline**: "Turn Views Into Revenue" with a gradient-animated keyword that morphs between "Revenue" / "Growth" / "Impact" using a smooth fade transition (not typewriter)
- **Subtitle**: Single clean line: "The platform where brands and creators grow together"
- **CTAs**: One primary gradient button "Get Started Free" with a shimmer sweep animation on hover, one outline/ghost button "See How It Works" with a border-glow effect on hover
- **Floating stat cards**: 3 glassmorphism cards ("2.4M+ Views Delivered", "500+ Creators", "98% Payout Rate") that float with a subtle parallax/bob animation instead of a dashboard screenshot
- **Background**: Animated gradient mesh (CSS animated radial gradients that slowly shift position) instead of static blobs
- **Platform icons**: Simple static row with subtle glow on hover, no scrolling marquee

### 3. How It Works - Vertical Timeline (Not Tabs)
- **Remove**: Brands/Creators tab toggle (Vyron's signature pattern)
- **New layout**: Vertical timeline with 4 steps (Sign Up, Browse Campaigns, Create Content, Get Paid)
- Each step has a glowing numbered circle connected by a gradient vertical line
- Steps animate in with a staggered slide-up as user scrolls into view (using Intersection Observer)
- Alternating left/right layout on desktop for visual interest

### 4. Why Amplify - Split Screen (Not Tabs)
- **Remove**: Tab toggle
- **New layout**: Side-by-side "For Brands" (left) and "For Creators" (right) with a glowing gradient divider line between them
- Each side has 3 benefit items with animated icons that glow on hover
- Cards have a gradient border that animates on hover

### 5. Testimonials - Carousel (Not Grid)
- **Remove**: Static 2x2 grid
- **New layout**: Single large testimonial card that auto-rotates with smooth crossfade
- Navigation dots at bottom with glow effect on active dot
- Add 4-5 testimonials with varied content (quotes, earnings, roles)

### 6. FAQ - Simple Accordion (No Tabs)
- **Remove**: Creators/Brands tab toggle
- Unified FAQ list mixing both audience questions
- Accordion items have a gradient left border that appears on open
- Smooth height animation on expand/collapse

### 7. Final CTA - Gradient Banner
- Full-width section with an animated gradient background (purple to blue shifting)
- Animated dot grid pattern overlay
- "Start Growing Today" headline with dual inline CTAs: "I'm a Creator" / "I'm a Brand"
- Buttons have pulse-glow animation

### 8. Global Animations and Effects
- **Scroll-triggered animations**: All sections fade/slide in using Intersection Observer (no library needed)
- **Button hover effects**: Gradient shimmer sweep, scale up, glow intensify
- **Card hover effects**: Border gradient reveal, slight lift with shadow increase
- **Smooth page transitions**: Elements animate on first paint with staggered delays
- **Cursor glow**: Subtle radial gradient follows mouse on hero section

### 9. Navbar
- Simplify links to: Features, How It Works, FAQ
- "Get Started" button with gradient background and glow
- Navbar blur backdrop with gradient top border

## Technical Details

### Files to modify:
- `src/index.css` -- Add Coolvetica `@font-face`, animated gradient mesh keyframes, scroll-reveal utility classes, button shimmer animations, dot grid pattern
- `tailwind.config.ts` -- Update `font-display` to Coolvetica, add new keyframes for gradient-shift, float-card, shimmer-sweep
- `src/components/landing/HeroSection.tsx` -- Complete rewrite: gradient word swap, floating stat cards, animated mesh background, static platform row
- `src/components/landing/HowItWorksSection.tsx` -- Rewrite as vertical timeline with scroll-triggered animations
- `src/components/landing/WhoItsForSection.tsx` -- Rewrite as split-screen layout with gradient divider
- `src/components/landing/TestimonialsSection.tsx` -- Rewrite as auto-rotating carousel with crossfade
- `src/components/landing/FAQSection.tsx` -- Remove tabs, unified list with gradient accents
- `src/components/landing/FinalCTASection.tsx` -- Gradient banner with dot grid and dual CTAs
- `src/components/landing/Navbar.tsx` -- Simplified links, gradient CTA button
- `src/pages/Index.tsx` -- Minor reorder if needed

### New utilities/hooks:
- `useScrollReveal` -- Custom hook using Intersection Observer to trigger animations when elements enter viewport (built inline or as a small hook)
- CSS-only scroll animations using `animation-timeline: view()` with fallback

### Key differentiators from Vyron:
- Coolvetica font (Vyron uses different typography)
- No typewriter effect (gradient word morph instead)
- No tab toggles anywhere (timeline + split-screen + carousel instead)
- No scrolling marquee (static icons)
- No dashboard screenshot (floating stat cards)
- No geometric SVG decorations (animated gradient mesh)
- Unique button shimmer and glow effects
- Scroll-triggered reveal animations throughout

