# CSE Students Portal — Design Direction

## 1. Mood

Clean and minimal first, decorative second. The glass/neumorphic touches are seasoning, not the whole dish — they show up on a handful of surfaces (nav, hero, cards, tags) so they stay special, not on every element. Should read as something a CS student would actually want to be seen using — modern, a little techy, calm rather than loud.

**Reference feel:** think Linear/Notion-level restraint, with occasional soft depth (glass panels, floating cards) layered on top — not a busy dashboard, not flat corporate SaaS either.

---

## 2. Color System — Cool Blue/Violet

### Light mode (default)
| Token | Hex | Use |
|---|---|---|
| `background` | `#F7F8FC` | page background |
| `surface` | `#FFFFFF` | cards, panels |
| `surface-glass` | `rgba(255,255,255,0.55)` + blur | glass panels over gradient areas |
| `primary` | `#5B5FEF` | main brand — buttons, links, active states |
| `primary-hover` | `#4A4DDB` | hover/active |
| `secondary` | `#8B5CF6` | accents, gradients paired with primary |
| `text-primary` | `#1A1B2E` | headings, body |
| `text-secondary` | `#6B6E85` | captions, meta info |
| `border` | `#E4E5F1` | dividers, card borders |

### Dark mode
| Token | Hex | Use |
|---|---|---|
| `background` | `#0F1020` | page background |
| `surface` | `#1A1B2E` | cards, panels |
| `surface-glass` | `rgba(26,27,46,0.55)` + blur | glass panels |
| `primary` | `#8B8FFF` | brighter for dark-bg contrast |
| `secondary` | `#A78BFA` | accents |
| `text-primary` | `#F2F2F7` | headings, body |
| `text-secondary` | `#9A9CB5` | captions, meta info |
| `border` | `#2A2C45` | dividers, card borders |

### Gradient (for hero sections / glass backdrops)
`linear-gradient(135deg, #5B5FEF 0%, #8B5CF6 100%)` — used sparingly as a backdrop behind glass panels, never as a full-page background.

### Spark accent (new — for personality, used very sparingly)
A warm color deliberately outside the blue/violet family, so it actually reads as a pop instead of just another shade of the same hue. Two colors from the same family (blue + violet) don't create contrast, they create sameness — this is likely part of why the palette read as flat.

| Token | Light | Dark | Use |
|---|---|---|---|
| `spark` | `#F97066` (coral) | `#FB8A80` | Featured/highlighted badges, achievement or streak indicators, the ONE most-important CTA on a screen if it needs to stand out from routine primary buttons |

Rule: **one `spark` use per screen, maximum.** This isn't a new primary color — it's a deliberately rare accent. If it shows up more than once per screen, it stops popping and starts looking arbitrary.

### Status colors (for the approval-workflow tags — same soft-tag treatment everywhere)
| Status | Text/Border | Background (low opacity) |
|---|---|---|
| Pending | `#B45309` (amber-700) | `rgba(217,119,6,0.10)` |
| Approved | `#15803D` (green-700) | `rgba(21,128,61,0.10)` |
| Rejected | `#B91C1C` (red-700) | `rgba(185,28,28,0.10)` |

Dark mode: same hues, lighten text/border by ~15% for contrast against dark surfaces.

---

## 3. Typography

- **Headings:** Space Grotesk — a little geometric character without being loud, reads modern/techy at large sizes.
- **Body/UI:** Inter — the standard for dense, legible UI text; huge weight range; pairs cleanly with Space Grotesk.
- **Scale:** `text-sm` (13px) meta/captions → `text-base` (15px) body → `text-lg/xl` card titles → `text-2xl/3xl` section headers → `text-4xl+` hero only.
- **Weight:** Inter 400/500 for body, 600 for emphasis; Space Grotesk 500/600 for headings — avoid font-weight 700+ except hero text, keeps the "clean/minimal" feel intact.

---

## 4. Glassmorphism — Where and How

**Use it on:** top navbar (sticky, glass over scroll), hero section panel, modal/dialog backdrops, the "featured profile" or "next event countdown" card. **Don't use it on:** dense data tables, the question bank list, forms — glass over lots of small text or inputs hurts readability and fights the "informative and easy to navigate" goal.

**Recipe:**
```css
background: var(--surface-glass);      /* rgba white/dark at 0.5–0.6 opacity */
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.3);  /* rgba(255,255,255,0.08) in dark mode */
border-radius: 20px;
```
Glass panels should sit over the gradient or a soft blurred color blob, never directly over plain background — otherwise there's nothing for the blur to show.

**Accessibility note:** always re-check text contrast when it sits on a glass panel — glass darkens/lightens unpredictably depending on what's behind it. If in doubt, add a subtle `text-shadow` or slightly increase glass opacity rather than risk unreadable text.

---

## 5. Neumorphic / Soft Tags — Component Spec

This is the pattern for **skill tags, status badges, subskill chips** — anywhere a small labeled pill appears.

```css
/* Base soft tag (neumorphic-leaning) */
background: rgba(var(--tag-color-rgb), 0.10);
color: rgb(var(--tag-color-rgb));            /* darker shade of the tag color for text */
border: 1px solid rgba(var(--tag-color-rgb), 0.25);
border-radius: 999px;                         /* pill shape */
padding: 4px 12px;
font-size: 13px;
font-weight: 500;
box-shadow: 0 1px 2px rgba(0,0,0,0.04),
            0 0 0 1px rgba(255,255,255,0.4) inset;  /* subtle raised highlight */
```

- Each skill category gets one base hue (e.g. Web Dev = blue, ML/AI = violet, Cybersecurity = rose, Competitive Programming = amber) — subskill tags under it use the same hue at lower opacity, so a profile's tag row visually groups by category at a glance.
- Keep tag color saturation moderate — this is the one place oversaturated color would break the "soft/minimal" feel.
- Hover state: background opacity 0.10 → 0.16, no color change — keeps it calm.

---

## 6. Cards, Buttons, Inputs

- **Cards — revised, this is the fix for "too plain/generic":** the earlier spec made cards flat at rest with shadow only on hover — that produced exactly the generic default-shadcn look being reported. Cards now carry a signature at rest, not just on interaction:
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 16px;
position: relative;
overflow: hidden;
/* colored shadow, not gray — this alone reads as "designed" rather than default */
box-shadow: 0 2px 12px rgba(91, 95, 239, 0.06), 0 1px 2px rgba(91, 95, 239, 0.04);
```
Plus a thin gradient accent bar along the top edge (the card's one signature element — don't also add glass or a heavy border on top of this, one distinguishing treatment per card):
```css
/* ::before pseudo-element */
content: "";
position: absolute;
top: 0; left: 0; right: 0;
height: 3px;
background: linear-gradient(90deg, var(--primary), var(--secondary));
```
Hover: shadow deepens and colors stay tinted, not just darker gray:
```css
box-shadow: 0 8px 24px rgba(91, 95, 239, 0.12), 0 2px 6px rgba(91, 95, 239, 0.08);
transform: translateY(-2px);
```
Dark mode: same structure, shadow color shifts to use `secondary`'s hex at the same low opacities (a colored shadow needs a lighter base color to read against a dark surface — pure `primary`'s dark-mode value works fine here too, test both).

- **Buttons:** solid `primary` fill for main actions, radius `12px`, no harsh drop shadow — a soft `0 2px 8px rgba(91,95,239,0.25)` glow under primary buttons only.
- **Inputs:** `surface` background, `border` 1px, focus ring `primary` at 40% opacity — no glass/neumorphism on form inputs, they need to read as clearly interactive and legible above all else.

---

## 7. Icons & Motion

- **Icons:** lucide-react (already available, pairs natively with shadcn/ui) — consistent 1.5px stroke weight throughout.
- **Motion:** subtle only — 150–200ms ease-out on hover/tap states, card lift on hover (`translateY(-2px)`), no bouncy/springy easing (reads as playful-childish rather than clean-modern). Page transitions: simple fade, no slide gimmicks.

---

## 8. Dark Mode Notes

Light is default per your choice, but build dark mode alongside from day one rather than retrofitting it — glass/neumorphic effects are the hardest thing to adapt after the fact since opacity values that look right on white surfaces go muddy on dark ones. Test every glass/tag component in both modes as you build it, not at the end.
