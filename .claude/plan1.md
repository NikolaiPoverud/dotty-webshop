 UI Animation Enhancement Plan: World-Class Polish

 Goal

 Transform Governly from "good" to "exceptional" - creating that visceral "this feels premium" response. Every interaction
 should feel intentional, responsive, and delightful.

 ---
 Current State (What We Have)

 The codebase already has solid animation infrastructure:

 - Framer Motion (v12.23.26) - Full animation library
 - motion.ts - Spring physics presets (gentle, snappy, bouncy, quick, smooth)
 - 35+ animation variants - Page transitions, stagger containers, card hover, etc.
 - Animated components - StaggeredList, AnimatedCard, AnimatedButton, FadeIn, etc.
 - Animated icons - AnimatedCheck, LoadingDots, StatusIcon, etc.
 - globals.css - 780+ lines of animation keyframes and utilities
 - Accessibility - prefers-reduced-motion support throughout

 The problem isn't missing infrastructure - it's inconsistent application and missing "wow" moments.

 ---
 Phase 1: Landing Page Magic (First Impressions)

 The landing page is static. It should feel alive.

 1.1 Hero Section (src/components/landing/Hero.tsx)

 - Headline stagger: Words animate in sequentially with spring physics
 - CTA buttons: Subtle idle animation (glow pulse), hover lift + shadow
 - Product mockup: Parallax depth effect on mouse move, or subtle float animation
 - Background: Animated gradient mesh or subtle particle effect

 1.2 Feature Cards (src/components/landing/Features.tsx)

 - Scroll-triggered reveal: Cards cascade in as user scrolls into viewport
 - Stagger delay: 80ms between cards for visual rhythm
 - Hover state: Elevation + subtle scale (1.02) + icon color transition
 - Icons: Animate on hover (scale pop or wiggle)

 1.3 Benefits Section (src/components/landing/Benefits.tsx)

 - Check marks: Animate in with bouncy spring when section enters view
 - List items: Slide in from left with stagger

 1.4 All Sections

 - Scroll animations: Use Intersection Observer + Framer Motion
 - Create reusable: <ScrollReveal> component with configurable variants

 ---
 Phase 2: Page Transitions (Seamlessness)

 2.1 Route Transitions

 - Exit animation: Subtle fade + slight upward drift (8px)
 - Enter animation: Fade in + downward settle from 8px above
 - Duration: 200-300ms with spring.gentle
 - Implementation: Enhance PageTransition.tsx or use Next.js view transitions API

 2.2 Tab Switching

 - Content crossfade: Old content fades/slides out, new slides in
 - Active indicator: Animated underline slides to active tab
 - Files: tabs.tsx, baseline page tabs, settings tabs

 2.3 Sidebar Navigation

 - Active state: Animated background indicator that slides between items
 - Collapse/expand: Already has width transition, add icon rotation spring
 - Menu items: Subtle hover background slide-in effect

 ---
 Phase 3: Dashboard Polish (Daily Delight)

 3.1 Skeleton → Content Transitions

 - Current: Basic animate-pulse skeletons
 - Enhanced:
   - Shimmer effect (already defined, ensure consistent use)
   - Content fades in with slight scale (0.98 → 1)
   - Stagger skeleton items for visual rhythm
   - Use ContentTransition component consistently

 3.2 Metric Cards (Overview Page)

 - Number counting: Animate from 0 to value on load (countUp effect)
 - Trend indicators: Bounce-in animation for up/down arrows
 - Progress rings: Animate stroke-dashoffset for circular progress

 3.3 Data Tables

 - Row entrance: New rows slide in from top with fade
 - Row exit: Deleted rows collapse height with fade
 - Sort transition: Brief flash/highlight on reordered rows
 - Empty state: Fade in with illustration animation

 3.4 Deviations/Findings Groups

 - Expand/collapse: Smooth height animation (already have collapse variant)
 - Child items: Stagger reveal when group expands
 - Status changes: Color transition + subtle pulse when status updates

 ---
 Phase 4: Micro-interactions (The Details)

 4.1 Buttons

 - Hover: Subtle lift (translateY -1px) + shadow increase ✓ (partially done)
 - Press: Scale down (0.97) with spring ✓ (exists)
 - Loading state: Smooth spinner transition with width adjustment
 - Success flash: Brief green tint + checkmark pop

 4.2 Form Inputs

 - Focus: Border color + shadow transition with spring ease
 - Validation: Error shake animation ✓ (exists)
 - Success: Brief green border flash on valid submit
 - Label float: Animate label position on focus (optional)

 4.3 Tooltips

 - Enter: Spring scale from 0.9 + fade ✓ (exists in animated-tooltip)
 - Ensure: All tooltips use AnimatedTooltip consistently

 4.4 Dropdowns/Selects

 - Open: Scale Y from 0.95 + fade with spring
 - Items: Subtle stagger on options (15ms)
 - Selection: Brief highlight flash on selected item

 4.5 Modals/Dialogs

 - Overlay: Fade in with blur increase
 - Content: Scale from 0.95 + slide up 10px with spring
 - Close: Reverse with slightly faster timing

 ---
 Phase 5: Success Moments (Subtle & Elegant)

 Design principle: No confetti or particles. Success should feel satisfying, not flashy.

 5.1 Onboarding Completion

 - Success card: Scale in with gentle bounce + soft green glow ring
 - Checkmark: Animated stroke-draw effect (Linear-style)

 5.2 First Scan Complete

 - Achievement reveal: Card with animated border gradient sweep
 - Stats counter: Numbers count up smoothly

 5.3 All Clear Status (No Deviations)

 - Checkmark: Stroke-draw animation with gentle scale
 - Background: Subtle green border pulse (once, not looping)

 5.4 Fix Applied Successfully

 - Inline success: Row briefly highlights green + checkmark fade-in
 - Toast: Clean slide-in with green accent (no particles)

 ---
 Phase 6: Performance & Polish

 6.1 Animation Performance

 - GPU acceleration: Ensure will-change on animated properties
 - Reduced motion: Test all animations respect prefers-reduced-motion
 - Lazy animations: Don't animate off-screen elements

 6.2 Consistency Audit

 - Timing: Establish duration scale (100ms, 200ms, 300ms, 500ms)
 - Easing: Prefer springs over cubic-bezier for organic feel
 - Stagger: Standard delays (40ms normal, 20ms fast, 80ms slow)

 6.3 Create New Utilities

 - <ScrollReveal>: Intersection Observer wrapper for scroll animations
 - <NumberCounter>: Animated number counting component
 - <StrokeDrawCheck>: Linear-style checkmark with SVG path animation
 - useScrollProgress: Hook for scroll-linked animations

 ---
 Implementation Priority

 Approach: Landing page + Dashboard in parallel for consistent quality.

 Sprint 1: Foundation (Both tracks)

 | Landing Page            | Dashboard                 |
 |-------------------------|---------------------------|
 | Hero stagger animation  | Route/page transitions    |
 | Scroll reveal component | Skeleton → content polish |
 | Feature card cascade    | Metric number counting    |

 Sprint 2: Polish

 | Landing Page             | Dashboard                |
 |--------------------------|--------------------------|
 | Benefits list animation  | Tab content transitions  |
 | CTA button hover effects | Sidebar active indicator |
 | Section transitions      | Modal entrance polish    |

 Sprint 3: Refinement

 | Landing Page             | Dashboard                 |
 |--------------------------|---------------------------|
 | Parallax depth effects   | Data table row animations |
 | Background subtle motion | Form micro-interactions   |
 | Final timing tweaks      | Success state animations  |

 ---
 Key Files to Modify

 | File                                     | Changes                              |
 |------------------------------------------|--------------------------------------|
 | src/components/landing/Hero.tsx          | Stagger animation, CTA hover effects |
 | src/components/landing/Features.tsx      | Scroll reveal, card hover polish     |
 | src/components/landing/Benefits.tsx      | List item stagger, check animation   |
 | src/components/layout/PageTransition.tsx | Enhanced route transitions           |
 | src/components/ui/tabs.tsx               | Content transition, active indicator |
 | src/components/layout/Sidebar.tsx        | Active state animation               |
 | src/app/app/overview/                    | Number counting, card entrances      |
 | src/lib/motion.ts                        | Add scroll reveal variants           |
 | src/components/motion/                   | Add ScrollReveal, NumberCounter      |

 ---
 New Components to Create

 src/components/motion/
 ├── ScrollReveal.tsx      # Intersection Observer animation wrapper
 ├── NumberCounter.tsx     # Animated counting numbers
 ├── AnimatedTabs.tsx      # Tab content with transitions
 └── StrokeDrawCheck.tsx   # Linear-style checkmark animation

 ---
 Success Criteria

 - Landing page feels "alive" with purposeful motion
 - Page transitions are seamless, not jarring
 - Every click has immediate, satisfying feedback
 - Loading states are elegant, not boring
 - Celebration moments create genuine delight
 - Performance stays smooth (60fps, no jank)
 - Accessibility maintained (reduced motion works)

 ---
 Reference Inspiration (Selected)

 | App        | What to Emulate                                                            |
 |------------|----------------------------------------------------------------------------|
 | Linear.app | Buttery smooth springs, elegant micro-interactions, stroke-draw checkmarks |
 | Apple.com  | Scroll-triggered reveals, parallax depth, cinematic section transitions    |
 | Raycast    | Snappy instant feedback, responsive and fast, never feels slow             |

 The goal: Users should feel like the interface is responding to them, not the other way around.

 Key principles from these apps:
 - Springs > easing curves (feels organic)
 - Instant feedback (0-100ms for interactions)
 - Smooth transitions (200-400ms for reveals)
 - Scroll animations that enhance, not distract
 - Success states that feel satisfying, not celebratory