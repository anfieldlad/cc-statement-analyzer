# UI/UX Implementation Plan: cc-statement-analyzer

> **Author:** UI/UX Engineer
> **Date:** 2026-05-04
> **Source:** [PRODUCT_IMPLEMENTATION_PLAN.md](./PRODUCT_IMPLEMENTATION_PLAN.md)

---

## 1. Design Philosophy

### Guiding Principles

1. **Trust Through Transparency** — The UI must visually communicate safety at every step. Users are handing over sensitive financial data; the interface should feel secure, calm, and trustworthy.
2. **Progressive Disclosure** — Show only what's needed at each step. Don't overwhelm with options before the user has even uploaded a file.
3. **One-Page Flow** — The entire experience lives on a single page. No navigation, no routing. The screen transforms as the user progresses through the pipeline.
4. **Delight in the Details** — Smooth transitions, thoughtful micro-animations, and polished typography turn a utility tool into something users enjoy using.

### Design Tone

| Attribute | Direction |
|---|---|
| Mood | Professional, minimal, trustworthy |
| Color Palette | Dark mode primary; muted accent colors (no harsh neons) |
| Typography | Clean sans-serif (Inter or similar); generous spacing |
| Iconography | Outlined, consistent stroke weight; minimal use |
| Density | Spacious — financial data needs room to breathe |
| Motion | Smooth and purposeful; never flashy or distracting |

---

## 2. User Flow

The application follows a **linear, single-page flow** with four distinct states:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│          │     │              │     │              │     │              │
│  UPLOAD  │────▶│  PROCESSING  │────▶│   RESULTS    │────▶│   EXPORT     │
│          │     │              │     │              │     │  (optional)  │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │                  │                    │                     │
     │                  │                    │                     │
  Drop file +      Animated progress    Transaction table     Download CSV
  Enter password   with step labels     + Charts + KPIs       or JSON
```

**Key transitions:**
- Upload → Processing: Triggered by user clicking "Analyze" after providing file + password
- Processing → Results: Automatic once AI finishes; smooth fade/slide transition
- Users can always go "Back" to upload a new file (resets everything)

---

## 3. Screen Layouts & Wireframes

### 3.1 Upload Screen (Default State)

This is the first thing users see. Must immediately communicate: **what this app does** and **why it's safe**.

```
┌──────────────────────────────────────────────────────────┐
│  🔒 cc-statement-analyzer                    [Dark Mode] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│          Understand your spending.                       │
│          Without giving up your privacy.                 │
│                                                          │
│   ┌──────────────────────────────────────────────┐       │
│   │                                              │       │
│   │      ┌──────┐                                │       │
│   │      │  📄  │                                │       │
│   │      └──────┘                                │       │
│   │                                              │       │
│   │    Drag & drop your PDF statement here       │       │
│   │         or  [Browse Files]                   │       │
│   │                                              │       │
│   │    Accepted: .pdf up to 10MB                 │       │
│   │                                              │       │
│   └──────────────────────────────────────────────┘       │
│                                                          │
│   ┌──────────────────────────────────────────────┐       │
│   │  🔑  PDF Password                     [👁]  │       │
│   └──────────────────────────────────────────────┘       │
│   Leave blank if your PDF is not password-protected      │
│                                                          │
│              [ ▶ Analyze Statement ]                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  🛡️ Your Privacy                                        │
│                                                          │
│  • Your password never leaves this device                │
│  • No data is stored — ever                              │
│  • Close the tab and everything is gone                  │
│  • No accounts, no cookies, no tracking                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Drop zone has a prominent dashed border with hover/drag-over highlight effect
- After file is selected, drop zone transforms to show file name, size, and a ✕ to remove
- Password field is optional (some PDFs aren't encrypted); show/hide toggle via eye icon
- "Analyze Statement" button is disabled until a file is selected
- Privacy section is always visible — not hidden in a footer or modal

---

### 3.2 Processing Screen

Replaces the upload area with an animated progress indicator.

```
┌──────────────────────────────────────────────────────────┐
│  🔒 cc-statement-analyzer                    [Dark Mode] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│              Analyzing your statement...                 │
│                                                          │
│      ✅ Uploading              ← completed               │
│      ✅ Decrypting PDF         ← completed               │
│      ⏳ Extracting transactions ← in progress            │
│      ○  Categorizing                                     │
│      ○  Building dashboard                               │
│                                                          │
│           ━━━━━━━━━━━━━━━━━░░░░░░  65%                  │
│                                                          │
│           Estimated: ~8 seconds remaining                │
│                                                          │
│                  [Cancel]                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Each step transitions from ○ (pending) → ⏳ (active, with subtle pulse animation) → ✅ (done)
- Progress bar fills smoothly; percentage updates in real time
- Estimated time shown if processing exceeds 3 seconds
- Cancel button returns to upload screen and wipes all data
- On error: the active step turns ❌ red with a plain-language error message + "Try Again" button

---

### 3.3 Results Screen — Dashboard

The core experience. Three sections stacked vertically: **KPI Cards → Charts → Transaction Table**.

```
┌──────────────────────────────────────────────────────────┐
│  🔒 cc-statement-analyzer     [Upload New] [Export ↓]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  April 2026 Statement Summary                            │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ Total Spend│  │ Top        │  │ Top        │         │
│  │            │  │ Category   │  │ Merchant   │         │
│  │  $2,847.50 │  │  Dining    │  │  Grab Food │         │
│  │            │  │  $680.00   │  │  $420.00   │         │
│  └────────────┘  └────────────┘  └────────────┘         │
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │ Category Breakdown  │  │ Spending Over Time  │       │
│  │                     │  │                     │       │
│  │      ┌─────┐        │  │  █                  │       │
│  │   ┌──┤     ├──┐     │  │  █  █               │       │
│  │   │  │Dine │  │     │  │  █  █     █         │       │
│  │   │  │     │  │     │  │  █  █  █  █  █      │       │
│  │   │  └─────┘  │     │  │  █  █  █  █  █  █   │       │
│  │   └───────────┘     │  │  ───────────────── │       │
│  │                     │  │  W1  W2  W3  W4     │       │
│  │  ● Dining    $680   │  │  [Daily] [Weekly]   │       │
│  │  ● Grocery   $450   │  │                     │       │
│  │  ● Transport $320   │  │                     │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                          │
│  Transactions (47)                      🔍 Search        │
│  ┌────────┬──────────────┬─────────┬───────────┐        │
│  │ Date ▼ │ Merchant     │ Amount  │ Category  │        │
│  ├────────┼──────────────┼─────────┼───────────┤        │
│  │ Apr 28 │ Grab Food    │ $45.00  │ [Dining ▼]│        │
│  │ Apr 27 │ Tokopedia    │ $120.00 │ [Shop.. ▼]│        │
│  │ Apr 27 │ PLN Electric │ $85.00  │ [Util. ▼] │        │
│  │ Apr 26 │ Spotify      │ $9.99   │ [Subs. ▼] │        │
│  │ ...    │              │         │           │        │
│  └────────┴──────────────┴─────────┴───────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Design Notes:**
- **KPI Cards:** Count-up animation on first render (0 → $2,847.50). Each card has a subtle gradient background matching its theme.
- **Category Chart:** Donut chart preferred over pie (cleaner). Hover a segment → tooltip with amount + percentage. Clicking a segment filters the transaction table.
- **Timeline Chart:** Default to weekly view. Toggle between daily/weekly. Bars animate up on first load.
- **Transaction Table:** Sortable by any column (click header). Category column is an inline dropdown — changing it immediately updates the charts above (US-06). Optional search/filter input.
- **Header:** "Upload New" resets everything. "Export ↓" opens a small menu for CSV or JSON download.

---

### 3.4 Error States

Every error must be **visible, understandable, and recoverable**.

| Scenario | Display |
|---|---|
| Wrong file type (not PDF) | Inline warning below drop zone: "Only PDF files are accepted" |
| File too large (>10MB) | Inline warning: "File is too large. Maximum size is 10MB" |
| Incorrect password | Alert below password field: "Incorrect password. Please try again." — password field clears |
| Corrupted/unreadable PDF | Processing step shows ❌: "We couldn't read this PDF. It may be corrupted or in an unsupported format." + "Try Again" |
| AI processing timeout (>60s) | Processing step shows ❌: "Processing took too long. This might be a very large statement. Try again or use a smaller file." |
| AI service unavailable | Processing step shows ❌: "Our processing service is temporarily unavailable. Please try again in a few minutes." |

**Principle:** Never show technical error codes or stack traces. Always provide a next action ("Try Again", "Upload a different file").

---

### 3.5 Empty / Edge States

| State | Handling |
|---|---|
| No transactions found in PDF | Show friendly message: "We couldn't find any transactions in this PDF. Make sure you uploaded a credit card statement." |
| Single transaction | Dashboard still renders; charts show a single item gracefully |
| All transactions same category | Donut chart shows single segment; summary cards still calculate correctly |
| Very long merchant names | Truncate with ellipsis in table; full name on hover tooltip |

---

## 4. Design System

### 4.1 Color Palette

**Dark Mode (Default)**

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--bg-surface` | `#12121a` | Cards, panels, drop zone |
| `--bg-elevated` | `#1a1a2e` | Hover states, active elements |
| `--text-primary` | `#e8e8ed` | Main body text |
| `--text-secondary` | `#8888a0` | Labels, hints, placeholders |
| `--accent-primary` | `#6c63ff` | Primary buttons, active states, links |
| `--accent-success` | `#34d399` | Success indicators, completed steps |
| `--accent-warning` | `#fbbf24` | Warnings, caution messages |
| `--accent-error` | `#f87171` | Errors, destructive actions |
| `--border` | `#1e1e2e` | Subtle borders, dividers |

**Chart Category Colors (10 categories)**

| Category | Color | Hex |
|---|---|---|
| Dining | Coral | `#ff6b6b` |
| Groceries | Mint | `#51cf66` |
| Transportation | Sky Blue | `#339af0` |
| Entertainment | Purple | `#9775fa` |
| Utilities | Amber | `#fcc419` |
| Healthcare | Pink | `#f06595` |
| Shopping | Teal | `#20c997` |
| Subscriptions | Indigo | `#5c7cfa` |
| Travel | Orange | `#ff922b` |
| Other | Gray | `#868e96` |

### 4.2 Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Page headline | Inter | 700 | 32px / 2rem |
| Section title | Inter | 600 | 20px / 1.25rem |
| KPI number | Inter | 700 | 36px / 2.25rem |
| KPI label | Inter | 400 | 14px / 0.875rem |
| Body text | Inter | 400 | 16px / 1rem |
| Table header | Inter | 600 | 13px / 0.8125rem |
| Table cell | Inter | 400 | 14px / 0.875rem |
| Small label / hint | Inter | 400 | 12px / 0.75rem |
| Button | Inter | 600 | 15px / 0.9375rem |

### 4.3 Spacing Scale

Base unit: `4px`. All spacing uses multiples:

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Tight gaps (icon-to-text) |
| `--space-sm` | 8px | Inline element spacing |
| `--space-md` | 16px | Component internal padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Card padding |
| `--space-2xl` | 48px | Section vertical margins |
| `--space-3xl` | 64px | Major layout gaps |

### 4.4 Border Radius

| Element | Radius |
|---|---|
| Buttons | 8px |
| Cards / Panels | 12px |
| Drop zone | 12px (with dashed border) |
| Input fields | 8px |
| Donut chart | N/A (circular) |
| Tooltips | 6px |

### 4.5 Shadows & Depth

| Level | Shadow | Usage |
|---|---|---|
| Surface | `0 1px 3px rgba(0,0,0,0.3)` | Cards at rest |
| Elevated | `0 4px 12px rgba(0,0,0,0.4)` | Hover cards, dropdowns |
| Overlay | `0 8px 24px rgba(0,0,0,0.5)` | Modals, tooltips |

---

## 5. Interaction & Animation Spec

### 5.1 Micro-Animations

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Drop zone drag-over | Border color pulse + subtle scale(1.01) | 300ms | ease-in-out |
| File selected | Drop zone contracts; file info slides in | 400ms | ease-out |
| "Analyze" button | Subtle glow pulse when enabled | 2s loop | ease-in-out |
| Processing steps | Fade + slide down each step sequentially | 300ms each | ease-out |
| Processing spinner | Step icon pulse animation | 1.5s loop | ease-in-out |
| Screen transition (upload → processing) | Cross-fade with slight slide-up | 500ms | ease-out |
| Screen transition (processing → results) | Cross-fade with slight slide-up | 600ms | ease-out |
| KPI numbers | Count-up from 0 | 800ms | ease-out |
| Donut chart | Segments animate in clockwise | 800ms | ease-out |
| Bar chart | Bars grow upward from baseline | 600ms stagger 50ms | ease-out |
| Table rows | Fade in with stagger | 300ms stagger 30ms | ease-out |
| Category edit (dropdown) | Chart segments smoothly resize | 400ms | ease-in-out |
| Error appearance | Shake + fade in | 400ms | ease-out |

### 5.2 Hover & Focus States

| Element | Hover | Focus |
|---|---|---|
| Buttons | Lighten 10% + slight translate-Y(-1px) | Accent outline ring (2px offset) |
| Table rows | Row background → `--bg-elevated` | — |
| Chart segments | Segment expands slightly + tooltip appears | — |
| Drop zone | Border becomes solid accent color | Accent outline ring |
| Input fields | Border → `--accent-primary` | Accent outline ring |
| Cards | Subtle shadow elevation increase | — |

---

## 6. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Mobile | < 640px | Single column; KPI cards stack vertically; charts stack vertically; table scrolls horizontally |
| Tablet | 640px – 1024px | KPI cards in a row; charts stack vertically; table full width |
| Desktop | > 1024px | KPI cards in a row; charts side-by-side (2 columns); table full width |

### Mobile-Specific Adjustments

- Drop zone becomes tap-to-browse only (no drag-and-drop on mobile)
- KPI numbers reduce to 28px font size
- Chart legends move below charts instead of inline
- Transaction table scrolls horizontally with sticky first column (Date)
- "Export" button moves into a bottom action bar

---

## 7. Accessibility Requirements

| Requirement | Implementation |
|---|---|
| Color contrast | All text meets WCAG 2.1 AA (≥ 4.5:1 for body, ≥ 3:1 for large text) |
| Keyboard navigation | Full tab navigation through upload → password → analyze → table → export |
| Screen reader | All charts have `aria-label` descriptions; table uses semantic `<table>` markup |
| Focus indicators | Visible focus ring on all interactive elements (no outline:none) |
| Reduced motion | Respect `prefers-reduced-motion` — disable all animations when set |
| Touch targets | All interactive elements ≥ 44×44px on mobile |
| Error announcements | Errors use `role="alert"` for screen reader announcement |
| Drop zone | Keyboard-accessible file input as fallback; `aria-dropeffect` attribute |

---

## 8. Component Inventory

All components needed to build the UI, mapped to user stories:

| Component | User Story | Description |
|---|---|---|
| **Header** | — | App logo, dark mode toggle, contextual actions (Upload New, Export) |
| **DropZone** | US-01 | Drag-and-drop area with browse fallback; shows file info on selection |
| **PasswordInput** | US-02 | Masked input with show/hide toggle; optional field |
| **PrivacyBadge** | US-04 | Always-visible privacy explainer section |
| **AnalyzeButton** | — | Primary CTA; disabled until file selected; glow animation when ready |
| **ProcessingStatus** | US-07 | Step-by-step progress with animated indicators and progress bar |
| **SummaryCards** | US-10 | Three KPI cards: Total Spend, Top Category, Top Merchant |
| **CategoryChart** | US-08 | Interactive donut chart with legend and hover tooltips |
| **TimelineChart** | US-09 | Bar chart with daily/weekly toggle |
| **TransactionTable** | US-05, US-06 | Sortable table with inline category dropdown editing |
| **ExportMenu** | US-12 | Dropdown with CSV and JSON download options |
| **ErrorMessage** | US-03 | Inline or step-level error display with recovery action |
| **SearchFilter** | — | Optional text filter for the transaction table |

---

## 9. Delivery Alignment

How UX deliverables map to the PO's phased delivery plan:

| PO Phase | UX Deliverables |
|---|---|
| **Phase 1 — Foundation** | Design system (colors, type, spacing, tokens), Header, PrivacyBadge, DropZone (visual only), dark mode |
| **Phase 2 — Upload** | DropZone (interactive), PasswordInput, AnalyzeButton, ErrorMessage states, file validation feedback |
| **Phase 3 — AI Categorization** | ProcessingStatus (animated), TransactionTable (sortable + editable), screen transition (upload → processing → results) |
| **Phase 4 — Dashboard** | SummaryCards (with count-up), CategoryChart, TimelineChart, responsive layout, chart ↔ table interactions, all micro-animations |
| **Phase 5 — Polish & Launch** | ExportMenu, mobile optimizations, accessibility audit, reduced-motion support, final animation polish |
