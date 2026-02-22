

# Landing Page Redesign - Inspired by vyronclipping.com

Taking design inspiration from vyronclipping.com while keeping the **Amplify** brand name. The key differences I see between your current site and the reference:

## What Changes

### 1. Fix Navbar back to "Amplify" (currently says "Vyron")
- Revert the navbar brand name from "Vyron" back to "Amplify"
- Simplify nav links to match reference style: How It Works, Testimonials, Features, FAQ
- Replace "Start a Campaign" CTA with a "Join Discord" style button or keep as-is

### 2. Hero Section Redesign
- **Headline**: Change to a cleaner, larger headline like "Scale Your Brand Organically Across Thousands of Creators"
- **Typewriter effect**: Add a rotating text animation for the subtitle (the reference has "We distribute short-form..." with animated text)
- **CTA buttons**: Change to "Join as Creator" and "Join as Brand" (both with arrow icons, solid purple style like reference)
- **Dashboard preview image**: Add a mock dashboard screenshot below the hero CTAs (key visual element from reference)
- **Platform logo marquee**: Replace the static platform icons with a horizontally scrolling logo strip (TikTok, Instagram, YouTube, Twitter, Facebook) like the reference site
- Remove the "Enterprise badge", trust indicators, and extra text clutter to match the cleaner reference layout

### 3. How It Works Section - Tabbed Layout
- Add **"For Brands" / "For Creators"** tab toggle (like the reference) instead of showing all 4 steps at once
- Each tab shows 3 steps with a card-based layout
- Steps include a title, description, and feature bullet points
- Cleaner visual style with the step cards

### 4. "Why Choose Us" Section (replaces WhoItsForSection)
- Rename to "Why Choose Amplify"
- Keep the tabbed "For Brands" / "For Creators" approach from reference
- Show benefit cards with titles, descriptions, and feature lists
- Cards: Performance-Based, Cost-Effective, Training & Support (for creators), Earnings & Analytics

### 5. Testimonials Section
- Simplify to show screenshot-style testimonials (like the reference showing actual payout screenshots)
- Cleaner card layout with "Creator Success" headers

### 6. Add FAQ Section (new)
- Accordion-style FAQ with "For Creators" / "For Brands" tabs
- Questions pulled from the reference site content adapted for Amplify

### 7. Final CTA Section
- Simplify to: "Ready to Monetize Your Content?" headline
- Single "Get Started" button
- Cleaner, more minimal design

### 8. Footer
- Fix brand name back to "Amplify"
- Simplify footer layout

## Technical Details

### Files to modify:
- `src/components/landing/Navbar.tsx` - Revert to "Amplify", update nav links
- `src/components/landing/HeroSection.tsx` - Complete redesign with typewriter effect, dashboard image, scrolling logos
- `src/components/landing/MetricsSection.tsx` - Remove or simplify (reference doesn't have a separate metrics section, metrics are shown in a case study)
- `src/components/landing/HowItWorksSection.tsx` - Add tab toggle for Brands/Creators
- `src/components/landing/WhoItsForSection.tsx` - Redesign as "Why Choose Amplify" with tabs
- `src/components/landing/TestimonialsSection.tsx` - Simplify design
- `src/components/landing/FinalCTASection.tsx` - Simplify CTA
- `src/components/landing/Footer.tsx` - Fix branding
- `src/pages/Index.tsx` - Add new FAQ section, reorder sections
- `index.html` - Fix title back to "Amplify"

### New file:
- `src/components/landing/FAQSection.tsx` - Accordion FAQ with tabs

### CSS additions in `src/index.css`:
- Typewriter/rotating text animation
- Scrolling marquee animation for platform logos
- Any additional styling for the tabbed layouts

### Key design principles from reference to apply:
- Cleaner, more spacious layout with less visual clutter
- Tabbed content sections (Brands vs Creators)
- Dashboard preview as social proof
- Scrolling platform logo strip
- Simpler, bolder typography
- FAQ section with accordion

