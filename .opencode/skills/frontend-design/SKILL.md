---
name: frontend-design
description: Guidance for building UI for the CSE Students Portal — enforces the project's specific visual identity (cool blue/violet, glassmorphism + neumorphic tags, Gen-Z modern minimal) instead of generic AI-default styling.
---

# CSE Students Portal — Frontend Design

Approach every UI task as continuing one coherent design system, not inventing a fresh look each time. The visual identity is already decided in `docs/design-direction.md` — this skill exists to keep every component honest to it instead of drifting toward generic AI-default styling (the near-black-with-one-accent look, the warm-cream-serif look, the templated SaaS dashboard look — none of these are this project's direction).

## Ground truth

Before generating any UI, re-check `docs/design-direction.md` for: the color tokens (cool blue/violet, light default + dark mode), the Space Grotesk + Inter type pairing, and the two component patterns that make this project's UI recognizable — glassmorphic panels and low-opacity neumorphic tags. Don't reinterpret these; they're already decided, not a brief to riff on.

## Where each pattern applies (don't mix these up)

- **Glassmorphism** (blur + low-opacity surface + soft border): navbar, hero panel, modals, the "next event countdown" card, any featured/spotlight card. **Never** on dense content: the question bank list, data tables, forms. Glass over small text or inputs actively hurts the "easy to navigate, informative" goal — check this before applying it anywhere new.
- **Neumorphic soft tags** (low-opacity color fill, matching border, subtle inset highlight, pill shape): skill tags, subskill chips, status badges (pending/approved/rejected). Each skill category keeps one consistent hue across the app — don't invent new tag colors per screen.
- **Everything else** (cards, buttons, inputs): flat at rest per the design doc's component spec — no glass, no heavy shadow, a soft lift only on hover. This is deliberate: constant decoration everywhere would fight the "clean, minimal, easy to navigate" goal the target audience (CSE students scanning a lot of information — directories, question lists, notices) actually needs.

## Restraint check before shipping any screen

Ask: does this screen have more than one "special" surface (glass panel, animated element, heavy shadow) competing for attention? If yes, cut to one. The two decorative patterns (glass, soft tags) are meant to read as a signature, not as default styling applied everywhere — a page that's glass-everywhere or tag-everywhere stops looking intentional and starts looking templated, which is exactly what the design doc is trying to avoid.

## Quality floor (non-negotiable regardless of screen)

- Responsive down to mobile — a large share of students will browse on phones.
- Visible keyboard focus states on every interactive element.
- Contrast re-checked specifically for text sitting on glass panels or low-opacity tag backgrounds — these are the two patterns most likely to quietly fail contrast, since opacity darkens/lightens unpredictably depending on what's behind it. If in doubt, nudge the surface opacity up rather than risk unreadable text.
- Respect `prefers-reduced-motion` — hover lifts and fades should have a reduced/no-motion fallback.

## Writing UI copy

Name things by what a student controls, not by internal system terms — "Submit for review," not "Create pending record." Keep button labels as verbs matched to what happens next ("Approve," "Request guidance," "Download PDF"). Empty states (no results in a search, no questions yet for a subject) should say what to do next, not just "No data."