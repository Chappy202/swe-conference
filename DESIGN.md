---
version: alpha
name: Dispute Triage Dashboard
description: Internal banking operations dashboard for Standard Bank South Africa. Desktop-first dispute triage and routing tool with Standard Bank corporate branding.
colors:
  primary: "#0033A1"
  secondary: "#003DA5"
  tertiary: "#0072CE"
  neutral: "#F5F5F5"
  surface: "#FFFFFF"
  on-surface: "#374151"
  on-surface-variant: "#6B7280"
  error: "#EF4444"
  warning: "#F59E0B"
  success: "#10B981"
  priority-p1: "#DC2626"
  priority-p2: "#D97706"
  priority-standard: "#6B7280"
  status-reported: "#6366F1"
  status-investigation: "#0072CE"
  status-escalated: "#DC2626"
  status-resolved: "#10B981"
  status-referred: "#8B5CF6"
  dark-navy: "#001C3D"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.04em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-padding: 24px
  card-padding: 20px
  table-cell-padding: 12px
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "#002680"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px 24px
  badge-p1:
    backgroundColor: "#FEE2E2"
    textColor: "{colors.priority-p1}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-p2:
    backgroundColor: "#FEF3C7"
    textColor: "{colors.priority-p2}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-standard:
    backgroundColor: "#F3F4F6"
    textColor: "{colors.priority-standard}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-status-reported:
    backgroundColor: "#EEF2FF"
    textColor: "{colors.status-reported}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-status-investigation:
    backgroundColor: "#E0F2FE"
    textColor: "{colors.status-investigation}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-status-escalated:
    backgroundColor: "#FEE2E2"
    textColor: "{colors.status-escalated}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-status-resolved:
    backgroundColor: "#D1FAE5"
    textColor: "{colors.status-resolved}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-status-referred:
    backgroundColor: "#EDE9FE"
    textColor: "{colors.status-referred}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  table-header:
    backgroundColor: "#F9FAFB"
    textColor: "{colors.on-surface}"
    padding: "{spacing.table-cell-padding}"
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    padding: "{spacing.table-cell-padding}"
  table-row-hover:
    backgroundColor: "#F9FAFB"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  input-field-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
---

# Dispute Triage Dashboard — Design System

## Overview

The Dispute Triage Dashboard is an internal operations tool built for Standard Bank South Africa's banking ops teams. It embodies the "It Can Be" ethos through confident, clear design that empowers ops users to process fraud disputes quickly and accurately.

This is a desktop-first, data-dense application designed for daily power users who process many cases per shift. The interface prioritises instant visual comprehension — priority levels are colour-coded for at-a-glance triage, status progression is always visible, and rule traces are transparent so the ops user understands why the system made each recommendation.

The visual language is institutional and professional. Standard Bank's signature deep blue anchors the chrome, while the content area stays clean and neutral to let data breathe. Every element serves a function; there is no decorative ornamentation.

### Design Philosophy: Opinionated Constraint

This design system exists to make decisions for you, not to offer options. When building a new screen or component, the answer should already be here. If you're choosing between two approaches and this document doesn't resolve the choice — that's a gap to fill, not a license to improvise.

The system optimises for:

1. **Scan speed** — An ops user glances at the dashboard and knows which case needs attention next without reading a single word of body text.
2. **Trust** — Every recommendation is explained. Every action has a confirmation step. Nothing happens behind the user's back.
3. **Stamina** — This screen is open for 8-hour shifts. Low-contrast backgrounds, restrained colour usage, and generous whitespace reduce cognitive fatigue.
4. **Precision** — Financial data demands accuracy in formatting, alignment, and labelling. No ambiguity.

---

## Anti-AI-Slop Rules

Concrete, checkable rules that distinguish "designed by someone who ships product" from "default LLM output." These rules exist because AI-generated interfaces converge on the same visual fingerprint — and that fingerprint signals "prototype" to any experienced user.

### Blocked Patterns (must never appear)

| # | Pattern | Why it's a tell | What to do instead |
|---|---------|-----------------|-------------------|
| 1 | **Default Tailwind indigo/violet as accent** (`#6366f1`, `#4f46e5`, `#8b5cf6`, `#7c3aed`) | The single most recognisable marker of AI-generated UI | Use `colors.primary` (#0033A1) exclusively for interactive accent. Indigo/violet reserved only for the "Reported" status badge where it has semantic meaning. |
| 2 | **Purple-to-blue gradient backgrounds** | Screams "AI landing page." Adds no information. | Flat solid colours. The page background is `#F5F5F5`. Cards are `#FFFFFF`. No gradients anywhere. |
| 3 | **Emoji as icons** (sparkles, rocket, fire, lightning) | Consumer app aesthetic. Unprofessional for banking ops. | No emoji in the UI. Period. Use Lucide React icons at 1.5px stroke weight with `currentColor`. |
| 4 | **Cards nested inside cards** | Creates visual noise, wastes space, confuses hierarchy | One level of card containment maximum. If you need sub-grouping, use a subtle divider line or background tint — not another card. |
| 5 | **Decorative blob/wave SVG backgrounds** | Meaningless geometry that adds no information | No decorative backgrounds. The neutral `#F5F5F5` page colour provides all the visual separation needed. |
| 6 | **Generic microcopy** ("Get Started", "Learn More", "Elevate your workflow") | Signals template, not product | Every label should be domain-specific. "Begin Investigation", "Add Transaction", "View Rule Trace" — name the action, not the mechanic. |
| 7 | **Centered hero sections with oversized numbers** | Dashboard pattern that optimises for demo screenshots, not daily use | Data lives in tables and cards in the content flow. No "big number" vanity metrics. |
| 8 | **`box-shadow` heavier than `md` on standard elements** | The "floating card" aesthetic breaks the grounded, institutional feel | Maximum shadow for page-level elements is `md`. Only modals get `lg`. |
| 9 | **Rounded corners > 12px on containers** | Playful, consumer-app aesthetic | Max radius for cards/modals is 12px (`rounded.xl`). Buttons and inputs use 6px. Only badges use `rounded-full`. |

### Soft Tells (should fix)

- **Uniform spacing everywhere.** If every section has exactly the same padding, the page reads as mechanical. Vary density intentionally — data tables are compact (12px cell padding), recommendation cards breathe more (20px padding + 4px priority border).
- **Accent colour used more than twice per viewport.** Standard Bank Blue appears in the header and primary action buttons. That's it for solid accent fills. Overuse dilutes importance.
- **All columns same width in a table.** Real data has hierarchy. The "Customer" and "Status" columns earn more width than "ID". Size columns by content importance, not equal distribution.
- **Loading states that are just a spinner.** Use skeleton screens that match the shape of the content being loaded. This tells the user what's coming, not just "please wait."

### How This System Has Soul

The 80/20 rule: 80% proven patterns (data tables, card layouts, form fields) + 20% distinctive choices that could only belong to this product:

- **Priority border on recommendation cards.** A 4px solid left border in priority colour (red/amber/grey) is the one bold visual move. It's domain-specific — it means "this is the triage severity" and nothing else.
- **Rule trace transparency.** Most systems hide their logic. We show every rule that fired, with the input values and thresholds. This is the product's signature UX pattern.
- **Terminal state finality.** Resolved and Referred disputes lose their action buttons entirely. The visual weight of the page drops. You can feel that the case is closed.
- **ZAR formatting.** The `R` prefix with thousands separators is a South African financial convention. It's never "R 10,000" (no space) or "ZAR 10000" (no formatting). It's `R16,500`. This small detail signals that someone who understands the domain built this.
- **Keyboard shortcut hints.** Table rows respond to Enter/Space. The rule trace expands on click. These affordances are discovered, not announced.

---

## Colors

### Palette Strategy

Standard Bank Blue (#0033A1) is the foundation — used for navigation, primary actions, and brand presence. The colour system is structured in layers:

- **Brand layer** — Primary (#0033A1), secondary (#003DA5), and tertiary (#0072CE) blues establish trust and institutional authority. These are the only blues used for interactive elements.
- **Priority layer** — Red (P1), amber (P2), and grey (Standard) provide instant visual triage without requiring the user to read text. These colours are reserved *exclusively* for priority indicators — never reuse P1 red for non-priority UI.
- **Status layer** — Distinct hues for each dispute lifecycle status (indigo, blue, red, green, purple) so the dashboard is scannable at a glance.
- **Neutral layer** — Light greys and white keep the interface calm. The ops user stares at this screen for hours; low-contrast backgrounds reduce fatigue.
- **Semantic layer** — Success green, warning amber, and error red follow universal conventions for system feedback (toasts, validation, confirmations).

### Colour Budgeting

Each screen should use colour with intention:

| Screen zone | Allowed colours |
|-------------|----------------|
| Header chrome | `dark-navy` background, white text |
| Page background | `neutral` (#F5F5F5) |
| Cards / surfaces | `surface` (#FFFFFF) with 1px `#E5E7EB` border |
| Primary actions | `primary` (#0033A1) button fills |
| Priority indicators | Only the three priority badge colours |
| Status indicators | Only the five status badge colours |
| Body text | `on-surface` (#374151) for primary, `on-surface-variant` (#6B7280) for secondary |
| Validation / feedback | `error`, `warning`, `success` — and only in context of system feedback |

If you find yourself reaching for a colour not in this table, stop. You're adding visual noise.

### Contrast Requirements

All text/background combinations must meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI components). Badge text on tinted backgrounds has been selected to pass these thresholds.

---

## Typography

### Inter — A Deliberate Choice

Inter is used throughout. Yes, it's common in AI-generated interfaces. We use it anyway because:

1. Its tall x-height and open apertures are unmatched for readability at 12-14px — critical for data tables with dense financial information.
2. It ships with tabular figures (`font-feature-settings: "tnum"`) which are essential for currency columns.
3. Standard Bank's internal tooling already uses Inter, so ops users encounter a familiar typeface.

The AI-slop concern with Inter is about *lazy default selection*, not the typeface itself. We differentiate by how we *use* it — tight letter-spacing on headlines (-0.02em), generous line-height on body text (1.5-1.6), and a clear size/weight hierarchy that most AI-generated UIs flatten.

### Monospace: JetBrains Mono

Used exclusively for rule trace output and technical identifiers (transaction IDs, timestamps in raw format). This creates a visual signal: "this is computed/system data" vs. "this is human-readable content."

### Type Scale & Hierarchy

| Token | Size | Weight | Tracking | Line Height | Use Case |
|-------|------|--------|----------|-------------|----------|
| `headline-lg` | 32px | 700 (Bold) | -0.02em | 1.2 | Page titles only: "All Disputes", "Dispute #42" |
| `headline-md` | 24px | 600 (Semi) | -0.01em | 1.3 | Section headers: "Linked Transactions", "Rule Trace" |
| `headline-sm` | 20px | 600 (Semi) | 0 | 1.4 | Card titles, modal headers |
| `body-lg` | 18px | 400 (Regular) | 0 | 1.6 | Recommendation text (the one prominent prose element) |
| `body-md` | 16px | 400 (Regular) | 0 | 1.5 | Standard paragraph text, descriptions |
| `body-sm` | 14px | 400 (Regular) | 0 | 1.5 | Table cells, form field values, button labels |
| `label-lg` | 14px | 600 (Semi) | 0 | 1 | Table headers, form labels, badge text |
| `label-md` | 12px | 500 (Medium) | 0.02em | 1 | Metadata, timestamps, counts |
| `label-sm` | 11px | 500 (Medium) | 0.04em | 1 | Fine print, help text below inputs |
| `mono` | 13px | 400 (Regular) | 0 | 1.5 | Rule trace values, transaction IDs |

### Type Rules

1. **Maximum two sizes per card.** A card uses `headline-sm` for its title and `body-sm` or `label-md` for content. Never three or more font sizes in a single card.
2. **Weight creates hierarchy, not size alone.** Within a table row, use 600-weight for the customer name and 400-weight for other cells — same size, different emphasis.
3. **Never use 300 (Light) weight.** Minimum is 400. Light weights look washed out on Windows and reduce readability at small sizes.
4. **Tabular figures for all numbers.** Currency amounts and dates must use `font-variant-numeric: tabular-nums` so columns align vertically.
5. **No ALL-CAPS body text.** Only `label-sm` and `label-md` may use uppercase via `text-transform: uppercase`. Using caps on larger text feels aggressive in a professional tool.

### Font Loading

Load Inter from Google Fonts with `font-display: swap`. Include weights 400, 500, 600, and 700. The system font stack (`system-ui, -apple-system, sans-serif`) serves as fallback. Load JetBrains Mono at weight 400 only.

---

## Layout & Spacing

### The 8px Grid

All spacing derives from an **8px base unit**. This creates consistent vertical and horizontal rhythm across cards, tables, and form elements. Every measurement should be a multiple of 4px (half-grid for fine adjustments) or 8px.

### Page Structure

- **Minimum viewport:** 1024px (internal tool, no mobile requirement)
- **Maximum content width:** 1280px (`max-w-7xl`), centred with `container-padding` (24px) on each side
- **Header:** Fixed height 64px (`h-16`), full-width, dark-navy background
- **Main content:** Below header, with `py-8` (32px top/bottom padding)

### Visual Rhythm — Alternating Density

A page that uses identical spacing everywhere reads as mechanical and template-generated. This system deliberately alternates between dense and breathing zones:

| Zone type | Padding/gap | Example |
|-----------|-------------|---------|
| **Dense** | 12px cell padding, 8px gaps | Data table rows, badge groups, filter checkboxes |
| **Standard** | 16-20px padding, 16px gaps | Card interiors, form field groups |
| **Breathing** | 24-32px padding, 24px gaps | Spaces between major sections, below page title, around recommendation card |

The pattern on a typical detail page:

```
[Page title + actions]     ← breathing (32px below header)
[Info cards row]           ← standard (20px card padding)
                           ← breathing (32px gap)
[Recommendation card]      ← standard (20px + 4px priority border)
                           ← breathing (32px gap)
[Rule trace section]       ← dense when expanded (12px between rule lines)
                           ← breathing (32px gap)
[Transactions table]       ← dense (12px cell padding, tight rows)
```

This rhythm creates visual anchors. Dense zones feel like "the work" — where data lives. Breathing zones signal "section boundary" without needing an explicit divider.

### Content Density

This is a data-dense application. Spacing should feel generous enough to be readable but compact enough to show meaningful amounts of data without scrolling:

- Card padding: 20px — enough breathing room without wasting space
- Table row height: ~48px (12px vertical padding + content)
- Form field spacing: 16px between fields, 24px between groups
- Section spacing: 32px between major sections on a page

---

## Elevation & Depth

### Philosophy: Grounded and Solid

Banking interfaces should feel stable and authoritative. Heavy drop shadows and floating elements undermine that perception. This system uses:

- **Minimal shadows** — Cards get a subtle `sm` or `md` shadow to lift off the page background, nothing more.
- **Borders over shadows** — A 1px border (#E5E7EB) provides separation without visual weight.
- **Colour differentiation** — The neutral background (#F5F5F5) behind white cards creates depth without any shadow at all.
- **Modal overlay** — The one exception: modals use the `lg` shadow and a semi-transparent navy overlay to clearly separate them from the page context.

### Elevation Scale

| Token | Use | Value |
|-------|-----|-------|
| `none` | Tables, inline form elements | No shadow |
| `sm` | Subtle lift (card hover state) | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | Cards at rest | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` |
| `lg` | Modals, dropdowns | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` |

**Rule:** Never use more than 2 elevation levels on a single screen (e.g., card at `md` + modal at `lg`). Flat hierarchy keeps things scannable.

---

## Shapes

### Conservative Rounding

Banking tools favour sharpness and precision. Rounded corners are used sparingly and consistently:

| Element | Radius | Token | Rationale |
|---------|--------|-------|-----------|
| Buttons | 6px | `rounded.md` | Squared enough to feel institutional |
| Input fields | 6px | `rounded.md` | Matches buttons for visual consistency |
| Cards | 8px | `rounded.lg` | Slight softness without being playful |
| Modals | 12px | `rounded.xl` | The most "friendly" element — it's a dialogue |
| Badges/pills | 9999px | `rounded.full` | Meant to look like discrete tags |
| Tables | 8px outer only | `rounded.lg` | Internal cells are square-cornered |

### No Circles, No Orbs

Avoid circular avatars, orbs, or radial decorations. Use rounded rectangles for all container shapes. The only circular element should be small status indicator dots (if ever needed).

---

## Component Anatomy & Composition

This section defines how to build components consistently. Every component in this system follows the same structural principles.

### Component Layering Model

Each component is built from exactly these layers, in this order:

```
1. Container   — Background, border, radius, shadow, padding
2. Layout      — Flexbox/grid arrangement of children
3. Content     — Text, icons, data
4. State       — Visual changes for hover, focus, active, disabled, loading, error
```

When building a new component, define each layer explicitly. If a layer doesn't apply (e.g., no border), state that — don't leave it ambiguous.

### Composition Rules

| Rule | Rationale |
|------|-----------|
| **One card level maximum** | A card inside a card is noise. If a card needs sub-sections, use a divider (`border-b border-slate-200`) or a tinted region (`bg-slate-50 rounded-md p-3`). |
| **Labels above inputs, not beside** | Left-aligned labels above inputs scan faster than side-by-side layouts for form-heavy workflows. |
| **Actions at the end of the reading flow** | Buttons appear at the bottom of cards, the right side of title rows, or the bottom of modals. Never floating in the middle of content. |
| **Group related data visually** | Customer info is one card. Dispute summary is another. Don't mix concerns in a single container. |
| **Consistent internal alignment** | Within a card, all text starts at the same left edge. Labels and values form a clear two-column rhythm, even if not using an explicit grid. |
| **Badge first, text after** | In table rows, coloured badges (status, priority) appear before their label text, not after. The colour is what the user's eye catches first. |

### Spacing Within Components

| Component | Internal structure |
|-----------|-------------------|
| **Card** | 20px padding all sides. Title at top (`headline-sm`), then 12px gap, then content. If card has a footer action, 16px top border separating it. |
| **Table** | No outer padding on the table itself (it fills its container). Header row: 12px padding, `bg-gray-50`. Body rows: 12px padding, `border-b border-slate-100`. |
| **Form group** | Label (`label-lg`) → 4px gap → Input (40px height) → 4px gap → Help text or error (`label-sm`). Between field groups: 16px. Between form sections: 24px. |
| **Badge** | 2px vertical padding, 10px horizontal. Text is `label-md` (12px, 500 weight). No icon inside badges — text only. |
| **Button** | 12px vertical, 24px horizontal. Icon (if present) is 16px, with 8px gap to label text. Icon + text or text alone — never icon alone without `aria-label`. |
| **Modal** | 24px padding. Title row (`headline-sm` + close button) → 16px gap → Body content → 24px gap → Action buttons (right-aligned, 12px gap between buttons). |

### Building a New Component (Checklist)

Before building any new component, verify:

- [ ] Does it already exist in this system? Check the component list first.
- [ ] What layer does it live at? (Is it a card-level container, an inline element, or a page-level section?)
- [ ] Does it use only tokens from this document? (No magic numbers, no arbitrary hex values.)
- [ ] Does it have a `data-testid`? (Every interactive element needs one.)
- [ ] What are its states? (Default, hover, focus, active, disabled, loading, error — define each.)
- [ ] Does it respect the one-card-level rule?
- [ ] Does it follow the density zone it lives in? (Dense zone = 12px gaps. Standard = 16-20px.)

---

## Icons

### System: Lucide React

All icons come from the [Lucide icon set](https://lucide.dev/) via `lucide-react`. This provides a consistent monoline style throughout the application.

### Usage Rules

| Rule | Detail |
|------|--------|
| **Stroke width** | 1.5px (Lucide default). Never adjust to 2px or 1px. |
| **Size** | 16px for inline with text, 20px for standalone icon buttons, 24px for page-level decorative use |
| **Colour** | Always `currentColor` — icons inherit text colour from their parent |
| **Accessibility** | Icon-only buttons require `aria-label`. Icons beside text are decorative (`aria-hidden="true"`). |
| **No emoji** | Never use emoji as icons. Not in headers, not in buttons, not in lists, not anywhere. |
| **Semantic pairing** | Icons reinforce text, never replace it. A filter icon beside "Filters" is fine. A filter icon alone as a section header is not. |

### Approved Icon Mapping

| Concept | Icon name | Context |
|---------|-----------|---------|
| Back navigation | `ArrowLeft` | "Back to Dashboard" links |
| Add / Create | `Plus` | "Add Transaction", "New Dispute" buttons |
| Remove / Delete | `X` | Remove transaction, close modal |
| Expand / Collapse | `ChevronDown` / `ChevronUp` | Rule trace accordion |
| Sort ascending | `ArrowUp` | Sort direction toggle |
| Sort descending | `ArrowDown` | Sort direction toggle |
| Warning / Alert | `AlertTriangle` | P1 recommendation header |
| Success / Resolved | `CheckCircle` | Resolution confirmation |
| Error / Failed | `XCircle` | Error states, declined |
| Info | `Info` | Help text, tooltips |
| Search / Filter | `Filter` | Filter bar section |
| Clock / Time | `Clock` | Transaction timestamps, age calculations |

---

## State Design

Every component has states. Undefined states are where UI breaks down. This section defines the visual language for each state.

### Loading States

**Never use a bare spinner.** Loading states should predict the shape of content:

- **Tables:** Skeleton rows — 5 rows of animated `bg-slate-200` bars matching column widths. Rows are 48px tall. Use `animate-pulse`.
- **Cards:** Ghost rectangles matching the card's internal layout (title bar + 3 content lines).
- **Buttons:** Replace label text with "Processing..." or action-specific text ("Submitting...", "Resolving..."). Add a small spinner (16px) to the left of text. Disable the button.
- **Full page:** Never a blank page with a centered spinner. Show the page shell (header, back link, title placeholder) immediately, then skeleton the content area.

### Empty States

Empty states are design opportunities, not error conditions:

- **Message:** Specific to context. "No disputes match your filters" (not "No data found"). "No transactions linked yet — add the first one below" (not "Empty").
- **Visual:** A single muted icon (24px, `text-slate-400`) above the message. No illustrations, no cartoon graphics.
- **Action:** If the user can fix the empty state, provide a CTA. "Clear filters" or "Add Transaction" button.
- **Placement:** Centered vertically and horizontally within the container that would hold the content.

### Error States

- **Inline errors (validation):** Red border (`border-red-500`) on the field + error message below in `text-red-600 text-sm`. Message appears on blur, not on every keystroke.
- **Section errors (API failures):** Red-bordered alert box within the section. Contains: what went wrong (brief), what to do ("Please try again"). Includes a "Retry" button.
- **Page errors (404, network):** Centred message with back navigation. No stack traces, no error codes unless relevant to ops workflow.

### Disabled States

- **Buttons:** `opacity-50`, `cursor-not-allowed`. No hover state change.
- **Inputs:** `bg-slate-50`, `text-slate-400`. Border becomes lighter.
- **Reason:** If a button is disabled, provide a tooltip or adjacent text explaining why. "Select a customer to continue" beside a disabled Submit button.

### Focus States

- **All interactive elements:** 2px solid outline in `colors.tertiary` (#0072CE) with 2px offset. This is the keyboard navigation indicator.
- **Never remove focus outlines.** They are not optional. If the default looks bad, style them — don't remove them.

---

## Information Hierarchy

### The F-Pattern Scanner

Ops users scan the dashboard in an F-shaped pattern: top-left to top-right, then down the left edge. Design for this:

- **Most important column first** (leftmost in tables) — Customer name or status, not ID.
- **Priority and status badges early in the row** — these are what the eye catches in the left-column scan.
- **Page-level actions top-right** — "New Dispute" button in the title row, where the eye lands after scanning the title.
- **Amount column right-aligned** — financial data scans vertically when right-aligned. The decimal points align.

### Data Density Tiers

Not all data deserves equal screen real estate:

| Tier | Treatment | Examples |
|------|-----------|----------|
| **Primary** | Large, high-contrast, positioned in the scan path | Status badge, priority badge, total amount, recommendation text |
| **Secondary** | Standard body text, visible without interaction | Customer name, date raised, merchant names, payment types |
| **Tertiary** | Smaller, muted, or hidden behind interaction | Dispute ID, rule trace details (collapsed by default), individual transaction timestamps |

### Table Column Priority

In the disputes table, columns are ordered by information value, not by database schema:

```
Customer Name > Status > Priority > Total Amount > Date Raised > ID
```

ID is last because it's the least useful for triage decisions. In practice, ops users find disputes by customer name or status, rarely by sequential ID.

---

## Interaction Design

### Click Targets

- **Minimum 44px touch target** for all clickable elements (buttons, links, table rows, checkboxes).
- **Table rows are fully clickable** — the entire row is the click target for navigation, not just the ID or name cell.
- **Checkbox labels are clickable** — clicking the text beside a checkbox toggles it.

### Feedback Timing

| Action | Feedback type | Timing |
|--------|---------------|--------|
| Filter toggle | Table re-renders | Immediate (client-side filter) |
| Sort change | Table re-renders | Immediate (client-side sort) |
| Status transition | Button loading state → page refresh | Show spinner instantly, refresh on API response |
| Form submission | Button loading → redirect | Show spinner instantly, redirect on success |
| Validation error | Field highlight | On blur (not keystroke) |

### Confirmation Patterns

Status transitions are significant actions. The confirmation pattern varies by severity:

| Action | Confirmation |
|--------|-------------|
| Begin Investigation | Direct (no confirmation) — low risk, next logical step |
| Escalate | Direct — urgency matters more than ceremony |
| Resolve | Modal — requires outcome selection (Refunded/Declined/Chargeback) |
| Refer | Direct — equivalent to "pause, need more info" |

### Animation: Almost None

This system uses no animation except:

- `animate-pulse` on skeleton loading states (Tailwind built-in)
- `transition-colors duration-150` on button hover/focus (barely perceptible colour shift)

No page transitions, no slide-in panels, no bouncing elements, no fade-in content. Ops users process cases rapidly; animation is a speed bump.

---

## Microcopy & Voice

### Tone

The interface speaks like a competent colleague: direct, specific, no filler.

| Principle | Example (good) | Anti-example (bad) |
|-----------|---------------|-------------------|
| Name the action, not the mechanic | "Begin Investigation" | "Update Status" |
| Be specific about what went wrong | "Failed to load disputes. Check your connection." | "Something went wrong." |
| Tell the user what to do next | "Select a customer to continue" | "Required field" |
| Use domain language | "Chargeback Initiated" | "Option C" |
| No marketing fluff | "Dispute Triage" | "Intelligent Dispute Management Platform" |

### Button Labels

- Start with a verb: "Add Transaction", "Resolve Dispute", "Clear Filters"
- Never generic: avoid "Submit", "OK", "Continue", "Next" without context
- Action buttons describe outcome: "Confirm Resolve" not "Confirm"

### Error Messages

Follow this structure: **What happened** + **What to do**.

- "Failed to create dispute. Please check the transaction details and try again."
- "Customer list could not be loaded. Refresh the page to retry."
- "Amount must be greater than zero."

Never: "An error occurred. Please try again later." (What error? How much later?)

### Empty State Messages

- Context-specific, never generic
- Suggest the next action if one exists
- Acknowledge the state without drama

Good: "No disputes match your current filters. Try adjusting the status or priority selections above."
Bad: "Nothing to see here! Try creating your first dispute to get started."

---

## Do's and Don'ts

### Do

- Use priority colours (red, amber, grey) exclusively for priority indicators. Never use red for a non-critical UI element.
- Maintain WCAG AA contrast ratios on all text. Test badge text against their tinted backgrounds.
- Use the `label-lg` style for table headers — consistency makes scanning faster.
- Keep the page background neutral (#F5F5F5) so white cards have natural contrast.
- Use Standard Bank Blue for all primary interactive elements (buttons, links, active states).
- Show the rule trace prominently on every dispute — transparency builds ops user trust.
- Use `data-testid` attributes on all interactive elements for automated testing.
- Right-align monetary values (ZAR) in table columns. Use `tabular-nums`.
- Format currency as `R16,500` (no space after R, no decimals for whole amounts, two decimals otherwise).
- Group related actions together and use visual weight to indicate the primary action.
- Use the same border radius (6px) on all form-level elements (buttons, inputs, selects) so they feel like a cohesive group.
- Provide visible focus indicators on all interactive elements.
- Show skeleton screens during loading, shaped like the content they're replacing.
- Vary spacing density between sections for visual rhythm.

### Don't

- Don't use red for anything other than P1 priority, error states, or the Escalated status. Overusing red creates alert fatigue.
- Don't use shadows heavier than `md` for standard page elements. Keep the interface grounded.
- Don't mix font families. Inter for content, JetBrains Mono for system values — no exceptions.
- Don't use colour alone to convey meaning. Pair colour with text labels (accessibility requirement).
- Don't round card corners beyond 12px. This is an institutional tool, not a consumer app.
- Don't use animation or transitions beyond subtle hover state changes. Ops users process cases rapidly; animation slows them down.
- Don't centre-align data in tables. Left-align text, right-align numbers.
- Don't use thin font weights (300 or below). The minimum is 400 (regular) for body text.
- Don't place critical actions (Resolve, Escalate) without appropriate confirmation where required by the confirmation pattern table.
- Don't use more than 2 elevation levels on a single screen.
- Don't use gradients. Anywhere. Not on buttons, not on backgrounds, not on text.
- Don't nest cards inside cards. Use dividers or tinted sub-regions instead.
- Don't use emoji in the interface. Not in buttons, not in headings, not in empty states.
- Don't use placeholder image services or stock photography. This is a data tool — there are no images.
- Don't introduce new colours that aren't in the palette. If you're reaching for a hex value not in this document, you're making an unauthorised design decision.
- Don't use `!important` in Tailwind classes. If you need to override something, your component hierarchy is wrong.
- Don't create "vanity metrics" sections (big numbers in the center of a card). Data lives in tables and inline with its context.

---

## Implementation Self-Check

Before shipping any component or screen, verify against this checklist:

### Visual Quality

- [ ] Does this screen pass the "screenshot test"? If someone outside the project sees it, could they tell which product it belongs to? (The deep blue header, priority borders, ZAR formatting, and rule trace transparency are identifiers.)
- [ ] Are there any hex values in the component that aren't from the design tokens?
- [ ] Is the accent colour (Standard Bank Blue) used at most twice per viewport as a solid fill?
- [ ] Are all monetary values right-aligned and using tabular figures?
- [ ] Does the page have visual rhythm (alternating dense/breathing zones)?
- [ ] Are badges readable — text colour passes 4.5:1 contrast against their background tint?

### Anti-Slop

- [ ] No indigo/violet accent on interactive elements (only in the "Reported" status badge)?
- [ ] No gradients anywhere?
- [ ] No emoji used as icons or decoration?
- [ ] No cards nested inside cards?
- [ ] No decorative SVG backgrounds?
- [ ] No rounded corners > 12px on containers?
- [ ] No shadows heavier than `md` on standard elements?
- [ ] All microcopy is domain-specific (no "Get Started", "Learn More", "Something went wrong")?

### Consistency

- [ ] All buttons on the screen use the same radius (6px)?
- [ ] All form elements on the screen are the same height (40px)?
- [ ] Table headers use `label-lg` (14px/600)?
- [ ] Table cells use `body-sm` (14px/400)?
- [ ] Cards all use the same padding (20px) and radius (8px)?
- [ ] Modal uses 12px radius and 24px padding?
- [ ] Page title uses `headline-lg` (32px/700)?

### Accessibility

- [ ] All interactive elements reachable via Tab key?
- [ ] Focus indicators visible and styled (2px tertiary blue outline)?
- [ ] Icon-only buttons have `aria-label`?
- [ ] Colour is not the sole indicator of meaning? (Badges have text + colour.)
- [ ] Form inputs have associated labels?
- [ ] Error messages are linked to their fields via `aria-describedby`?

---

## Tailwind Configuration Reference

These tokens map to Tailwind config to ensure consistency:

```javascript
// tailwind.config.js (extend section)
{
  colors: {
    'sb-primary': '#0033A1',
    'sb-secondary': '#003DA5',
    'sb-tertiary': '#0072CE',
    'sb-dark-navy': '#001C3D',
    'sb-surface': '#FFFFFF',
    'sb-neutral': '#F5F5F5',
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
  },
  fontSize: {
    // Use Tailwind defaults (xs through 4xl) — they align with our scale
  },
  borderRadius: {
    'card': '8px',
    'button': '6px',
    'input': '6px',
    'modal': '12px',
    'badge': '9999px',
  },
}
```

When implementing, prefer Tailwind utility classes that map to these tokens. If a component needs a value not present in the config, that's a signal to reconsider the design — not to add an arbitrary value.
