# DESIGN.md

The visual system for the personalized onboarding demo. Derived from the Hims homepage, the adaptive-question diagram, the Fella plan-approval and comparison charts, the MyChart/Apple Health connect sheet, and the Maximus paywall (see `docs/reference-frames/`).

**Rule of the system: one warm, calm, editorial surface.** Cream paper, near-black ink, a single rust accent, and route colors that carry meaning (green = ready/direct, purple = exploring/nurture). Nothing is neon, nothing is a gradient except the chart fills. Every color, font and string used by a screen comes from a token or the brand config, never hard-coded, because the same build is re-skinned per company.

---

## 1. Brand-agnostic contract

Two files decide everything company-specific:

- `lib/brand.js` — name, wordmark style, palette overrides, product names, pricing, legal/disclaimer copy.
- `app/globals.css` — the token layer. Brand overrides set the same custom properties on `:root`.

A component may never contain: a company name, a drug brand name, a price, or a hex code. If a screen needs one, it reads it from the brand config. Renaming the demo for the next prospect must be a one-file edit.

```js
// lib/brand.js
export const brand = {
  name: "Hairo",            // display name, appears in the wordmark
  wordmark: "serif-italic", // "serif-italic" | "sans-bold"
  accent: "#9C3818",
  category: "hair loss",
  productLine: ["finasteride", "minoxidil"],
};
```

---

## 2. Color

Sampled from the reference images, not invented.

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--paper` | `#F8F4EC` | Page background. The warm cream of every reference. |
| `--paper-warm` | `#F4F0E4` | Cards, grouped panels, the assistant's own surface. |
| `--paper-cream` | `#FCF8F0` | Plan/aha screens, one step brighter than `--paper`. |
| `--surface` | `#FFFFFF` | Option rows, inputs, stat cards. Always on top of paper. |
| `--line` | `#E4DED0` | 1px borders. Warm, never gray. |
| `--line-strong` | `#CFC6B4` | Dividers under sections, chart gridlines. |

### Ink
| Token | Value | Use |
|---|---|---|
| `--ink` | `#1C1C18` | Headlines, option labels, primary buttons. |
| `--ink-soft` | `#4A463F` | Body copy, helper text. |
| `--ink-muted` | `#8A8375` | Captions, legal, inline answer hints (`under a year / 1 to 3 years`). |

### Accent and meaning
| Token | Value | Use |
|---|---|---|
| `--rust` | `#9C3818` | The brand accent: wordmark, stat numerals (90% / 80%), links. **Never a button fill.** |
| `--rust-tint` | `#F6EAE4` | Rust backgrounds at 8% weight. |
| `--ready` | `#38744C` | The direct route: badges, selected option, success. |
| `--ready-tint` | `#E8F1EA` | Selected-option fill on the ready path. |
| `--nurture` | `#6858C4` | The exploring route: badges, selected option. |
| `--nurture-tint` | `#EFEDFA` | Selected-option fill on the nurture path. |
| `--olive` | `#8C9860` | The approval banner bar. |
| `--amber` | `#F8C04A` | Chart "goal" markers and the milestone highlight only. |
| `--chart-plan` | `#2C5C40` | The "with your plan" line. Deep green. |
| `--chart-base` | `#7FA8BE` | The "without treatment" line. Desaturated blue. |

### Contrast rules
- Body copy is `--ink-soft` on `--paper` (≥ 7:1). `--ink-muted` is for text ≥ 14px that is never the only carrier of meaning.
- `--rust` on `--paper` passes at ≥ 16px semibold; it is used for numerals and the wordmark, not for paragraphs.
- Route color is never the only signal: the selected option also gets a 2px border and a check.

### No dark mode
Single warm light theme. `color-scheme: light` is declared so the browser does not auto-invert. This is a pitch demo shown on one machine; a dark variant is a later brand-pack concern.

---

## 3. Typography

Two families, loaded with `next/font/google` and subset to latin.

- **Display — Newsreader** (serif). Question headlines, plan headlines, stat numerals, the wordmark in italic. This is what makes the Fella/Hims screens read as editorial rather than SaaS.
- **UI — Inter** (variable sans). Options, buttons, body, labels, everything else.

| Token | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `--t-display` | 34/1.15 | 400 | Newsreader | Screen headline ("Which best represents your hair loss and goals?") |
| `--t-display-sm` | 26/1.2 | 400 | Newsreader | Card headline ("Two quick checks and your plan is ready.") |
| `--t-stat` | 40/1 | 400 | Newsreader | 90% / 80% / weights on charts |
| `--t-body` | 16/1.55 | 400 | Inter | Paragraphs, option labels |
| `--t-option` | 15/1.4 | 450 | Inter | Option rows |
| `--t-label` | 11/1, `0.14em` tracking, uppercase | 600 | Inter | Section labels (`SCREEN 2A · FOR THE MAN WHO IS READY`, `YOUR PLAN, BUILDING AS YOU ANSWER`) |
| `--t-caption` | 13/1.5 | 400 | Inter | Footnotes, disclaimers |

**Wordmark:** brand name in Newsreader italic, lowercase, `--rust`, 20px, `-0.01em`. Mirrors the *hims* mark without copying it.

Rules: one display element per screen; never set body copy in the serif; uppercase only in `--t-label`; measure caps at 62ch.

---

## 4. Space, radius, elevation

4px base scale: `4 8 12 16 20 24 32 40 56 72`.

| Token | Value |
|---|---|
| `--r-sm` | 8px — inputs, chips |
| `--r-md` | 12px — option rows, stat cards |
| `--r-lg` | 16px — panels, plan cards |
| `--r-pill` | 999px — buttons, badges |

Elevation is mostly borders, not shadows. Allowed shadows:
- Resting card: `0 1px 2px rgba(28,28,24,.04)`
- Hovered option: `0 2px 8px rgba(28,28,24,.06)`
- Paywall "most popular" card: `0 4px 16px rgba(28,28,24,.08)` plus a 2px route-colored border.

Layout: conversation column `min(680px, 100% - 32px)`, centered, with a 72px top pad. Plan and paywall screens may widen to 760px. Everything works at 400px wide.

---

## 5. Components

### 5.1 Conversation shell
The spine of the demo. A single scrolling column; each turn is a block, not a chat bubble grid.

- **Assistant turn:** optional `--t-label` eyebrow, display headline, optional helper line in `--ink-soft`, then the input component. No avatar, no name, no bubble. The assistant *is* the page.
- **User reply:** right-aligned pill, `--paper-warm` fill, `--ink`, `--r-pill`, 15px. It stays in the transcript above as history.
- **Thinking state:** three 5px dots in `--ink-muted`, 1.2s staggered opacity. Never a spinner, never "AI is thinking".
- **Transitions:** answered turns collapse to a compact one-line summary (`Goal · ready to start ASAP` with a pencil affordance) so the column keeps moving.

### 5.2 Option rows (the intent question)
From the diagram. Full-width white rows, stacked 8px apart.

```
┌──────────────────────────────────────────────┐
│ Receding hairline, want to slow its progress │   surface, 1px --line, --r-md, 14px 16px pad
└──────────────────────────────────────────────┘
```
- Hover: border `--line-strong`, shadow, 1px rise.
- Selected: 2px border and tint in the route color — `--ready` for the ASAP answer, `--nurture` for exploring — plus a check glyph at the right. This is the moment the demo's whole point becomes visible, so the color is the message.
- Keyboard: 1–9 selects, focus ring is 2px `--rust` at 2px offset.
- Multi-select variants keep a square check; single-select commits on click with no extra Continue button.

### 5.3 Free-text input
Always present under the options: a single-line field, `--surface`, `--r-pill`, with the placeholder *"…or tell me in your own words"*. Submitting free text is what shows off extraction, so it must never feel secondary: full width, same height as an option row.

### 5.4 Inline question row (the direct route)
A white row with the question in `--ink` and the allowed answers inline in `--ink-muted`, separated by ` / ` — exactly as in the diagram (`When did you first notice it? · under a year / 1 to 3 years / longer`). Each hint is itself the tappable answer.

### 5.5 Plan-building card
`--paper-warm` panel, `--t-label` eyebrow "YOUR PLAN, BUILDING AS YOU ANSWER", then one line of plan text in `--t-display-sm`. Each new fact re-renders it with a 250ms cross-fade and a brief `--ready-tint` flash on the changed line. This is the "the LLM is listening" cue on the direct route.

### 5.6 Stat cards (the nurture route)
Two cards side by side, stacking under 560px. Numeral in `--t-stat` `--rust`, caption in `--t-caption` `--ink-soft`. White fill, 1px `--line`. Numbers must carry a source footnote in `--ink-muted`.

### 5.7 Route badge
Small caps pill above a card: `--t-label`, white text, fill `--ready` or `--nurture`, 4px 10px, `--r-pill`. Above it, the screen label in the same route color (`SCREEN 2A · FOR THE MAN WHO IS READY`). In the product these become invisible; in the demo they are the legend.

### 5.8 Connect health records sheet
Adapted from the MyChart/Apple Health screens — **generic, not Epic-branded.** Reproducing the MyChart or Epic marks in a demo we hand to another company is a trademark problem, so we ship our own sheet with the same shape.

- A teal-slate header band (`#3C5C63`), white title "Health Connections", and a Close affordance.
- Center: two rounded app tiles with an arrow between them — the phone on the left, a records folder on the right — then the primary line *Connect to "Health Records"*.
- Below: a searchable list of health systems, each row white with a logo slot, a name, and a "Connect" pill.
- States: idle → connecting (three-step checklist ticking: *Locating your records · Reading medications and labs · Summarizing*) → connected (green check, "12 records imported"). The connecting state is scripted in the demo and takes about 2.5s; it should never look instant, because the retrieval is the point.

### 5.9 Projection chart (the aha moment)
Inline SVG, no chart library, ~340px tall, full column width.

- Two lines over a 12-month x-axis with ticks at **Today · 8 weeks · 4 months · 12 months**.
- `--chart-base` (desaturated blue): *Average without treatment* — declines steadily.
- `--chart-plan` (deep green): *With your plan* — declines slightly, then flattens and lifts. The green line is drawn on top, with a soft green area fill beneath it (`--chart-plan` at 10% → 0%).
- Milestone dots at each tick on the plan line, with a pill label on the final dot.
- An `--amber` marker for the goal line only.
- Legend below as two dots with labels, like the Fella chart.
- Y axis is unlabeled and gridlines are dashed `--line-strong`: this is a projection, not a measurement.
- Caption, required: *"Projection based on clinical averages. Individual results vary."*
- Motion: both paths draw left-to-right over 900ms (`stroke-dasharray`), the plan line 150ms behind the baseline; dots pop 120ms after their path passes. Disabled under `prefers-reduced-motion`.

### 5.10 Plan-ready header
From the Fella approval screen, with the copy fixed.

- A full-width `--olive` bar, white `--t-label` text.
- **Copy change:** not "YOUR APPROVAL EXPIRES IN 10:57". We use *"Your plan is held for 15:00"* and the headline *"Your personalized plan is ready for provider review."* Claiming approval before a clinician has reviewed anything is exactly what a healthcare compliance team flags, and the CEO in the room will know it.
- Below: wordmark, serif headline, a star-rating line, a small attribute tag (e.g. `PATTERN · Crown thinning`), a three-line "what you get" paragraph with the key phrase bolded, then the chart.

### 5.11 Paywall
Structure from Maximus, **repainted in our palette** — no Maximus blue.

- Three stacked cards: 6 months, 3 months (highlighted), Monthly.
- Highlighted card: 2px `--ready` border, `--paper-cream` fill, the elevated shadow, and a `MOST POPULAR` badge in `--amber` with `--ink` text.
- Each card: term in `--t-display-sm`, price right-aligned (`$XX/mo` with the billed-total line beneath in `--ink-muted`), a one-line promise, and a green savings line.
- Inside the highlighted card, the **month timeline**: a 1px vertical `--line-strong` rail with 7px `--ready` dots, each row `MONTH 1` in `--t-label` over a `--t-body` phrase.
  - Month 1 — Shedding slows
  - Month 2 — First new growth
  - Months 3–4 — Visible coverage
  - Month 6+ — Full results
  The timeline copy is personalized from the intake and comes from the plan object, not from static markup.
- Testimonial block in `--rust-tint` with a 5-star row, quote in Newsreader italic, attribution in `--t-caption`.
- CTA: full-width `--ink` pill, white text, 52px tall, sticky at the bottom of the viewport on mobile.
- Social proof line above the cards: *"1,000+ men started their protocol this month."*

### 5.12 Buttons
- **Primary:** `--ink` fill, white text, `--r-pill`, 14px 24px, `--t-option` at 600. Label carries an arrow (`See my plan →`). Hover darkens to `#000`, active scales to .98.
- **Secondary:** transparent with a 1px `--line-strong` border, `--ink` text.
- **Text:** `--rust`, underlined on hover.
- Minimum target 44px; disabled is 40% opacity with no pointer events.

---

## 6. Motion

One easing curve, `cubic-bezier(.2,.7,.3,1)`, and three durations: 150ms (state), 250ms (enter), 900ms (chart draw).

- New turn: fade in with an 8px rise.
- Options: 40ms stagger, capped at 6 items.
- Selection: tint fills from the left over 200ms.
- Screen change: outgoing turn collapses to its summary line while the new turn rises — never a full-page swap.
- All of it inside `@media (prefers-reduced-motion: reduce)` guards that drop to simple fades.

---

## 7. Accessibility

- Focus is always visible: 2px `--rust` ring, 2px offset.
- Options are real `<button>`s in a `<fieldset>` with a `<legend>`; the live transcript region is `aria-live="polite"`.
- The chart has a text alternative stating both end values.
- Color is never the only channel (route color pairs with a badge and a check).
- Full keyboard path from first question to checkout.

---

## 8. Voice and copy

Second person, short sentences, no exclamation marks, no emoji. The assistant acknowledges before it asks (*"Got it — that skips three questions."*). It never says "AI", never apologizes, never uses clinical jargon without a plain-language gloss. Numbers always carry their source. Anything that sounds like a diagnosis or a prescription decision is written by the rules layer, not the model, and always names the human: *"a licensed provider reviews this within 24 hours."*

---

## 9. Implementation notes

- Tokens live in `app/globals.css` under `:root`; components use `var(--token)` only.
- Fonts via `next/font/google` in `app/layout.js`, exposed as `--font-display` and `--font-ui`.
- Component styles as CSS Modules next to each component. No CSS-in-JS, no Tailwind — a token file is easier to hand to a company's designer.
- Charts are hand-written SVG in `components/charts/`, driven by a plan object, so the same component serves hair loss, weight loss or testosterone.
- Motion via `motion` (already a dependency) for turn transitions; CSS for everything smaller.
