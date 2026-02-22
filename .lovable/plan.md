

## Landing Page Updates

### Summary
Update the landing page to be more inclusive for all users (creators, streamers, brands, musicians) and connect buttons to the right destinations.

### Changes

**1. Replace "How It Works" section with "Launch a Campaign" section**
- Remove the `HowItWorksSection` from the landing page
- Replace it with a new section called "Launch a Campaign" that highlights campaign features in an inclusive way for all user types
- Use welcoming language for creators, streamers, brands, and musicians

**2. Update Hero Section buttons**
- Change "Get Started Free" text to "Start Clipping"
- Change "See How It Works" button to "Launch a Campaign" linking to `/brand-application` (requires login)

**3. Update Final CTA Section buttons**
- "I'm a Creator" button: redirect to `/auth` (sign up / login)
- "I'm a Brand" button: redirect to `/brand-application`

**4. Update Footer links**
- Add "I'm a Brand" link pointing to `/brand-application`
- Add "I'm a Creator" link pointing to `/auth`

**5. Update wording across sections**
- Make all copy inclusive: mention creators, streamers, musicians, and brands equally
- Update `WhoItsForSection` to broaden language beyond just "brands" and "creators" -- include streamers and musicians
- Update subtitles and descriptions to feel welcoming to all content creators

### Technical Details

**Files to modify:**
- `src/pages/Index.tsx` -- remove HowItWorksSection import, add new LaunchCampaignSection
- `src/components/landing/HeroSection.tsx` -- change button text and link targets
- `src/components/landing/FinalCTASection.tsx` -- update button navigation routes
- `src/components/landing/Footer.tsx` -- add "I'm a Brand" and "I'm a Creator" links
- `src/components/landing/WhoItsForSection.tsx` -- broaden wording to include streamers, musicians
- `src/components/landing/Navbar.tsx` -- update nav links to reflect new sections

**New file:**
- `src/components/landing/LaunchCampaignSection.tsx` -- new section replacing How It Works, showcasing campaign launching for all user types

**Routing:**
- "Launch a Campaign" / "I'm a Brand" buttons will navigate to `/brand-application` (protected route, requires login)
- "Start Clipping" / "I'm a Creator" buttons will navigate to `/auth`
