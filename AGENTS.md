# AGENTS.md — AI Coding Agent Guide

This document provides context and guidelines for AI coding agents (Copilot, Gemini, Claude, etc.) working on the `cc-statement-analyzer` codebase.

---

## Project Overview

**cc-statement-analyzer** is a privacy-first, fully stateless web application that parses encrypted credit card PDF statements using AI and produces an interactive spending dashboard. The core principle is **zero data persistence** — no accounts, no database, no cookies, no localStorage.

**Tech stack:** Next.js 15 (App Router) · TypeScript (strict) · pdfjs-dist · @google/generative-ai (Gemini 2.5 Flash Lite) · Recharts · Vanilla CSS

---

## Architecture

```
Browser:  DropZone → pdf.js (decrypt) → PII sanitizer → POST /api/parse
Server:   /api/parse → Gemini 2.5 Flash Lite → secondary PII scrub → JSON response
Browser:  validator → aggregator → React state → dashboard (charts, table, KPI cards)
```

- **PDF decryption happens entirely client-side** using `pdf.js`. The password never leaves the browser.
- **PII sanitization** runs client-side before any network request (regex-based stripping of card numbers, SSNs, account numbers, names).
- **The API route** (`src/app/api/parse/route.ts`) calls Gemini with a structured output schema and performs a secondary PII scrub on the response.
- **All state lives in React** (`useState`/`useReducer` in `page.tsx`). Closing the tab destroys everything.

---

## Critical Constraints (Non-Negotiable)

These are **security invariants** that must never be violated:

1. **Never log financial data.** No `console.log`, `console.debug`, or any logging of: PDF passwords, extracted text, transaction data, or raw API responses. This applies to both client and server code.

2. **Never persist data.** Do not introduce `localStorage`, `sessionStorage`, cookies, IndexedDB, or any database. The app is stateless by design.

3. **Never send the password to the server.** PDF decryption must remain client-side via `pdf.js`.

4. **Never send raw PDF content to the server.** Only sanitized extracted text goes to `/api/parse`.

5. **Never expose `GOOGLE_API_KEY` to the client.** It must only be accessed in server-side code (API routes).

6. **Always sanitize before API calls.** Run `sanitizeText()` from `src/lib/sanitizer.ts` on extracted text before sending to the server.

7. **Always scrub API responses.** Run PII scrub patterns on merchant/text fields returned by Gemini before sending to the client.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Inter font and metadata
│   ├── page.tsx                # Main SPA — owns the AppState state machine
│   ├── globals.css             # Design system tokens and global styles
│   ├── api/parse/route.ts      # POST endpoint — Gemini structured output call
│   └── privacy/page.tsx        # Static privacy policy page
│
├── components/                 # All UI components + components.css
│   ├── Header.tsx              # Dark mode toggle, contextual nav actions
│   ├── DropZone.tsx            # File upload (drag-and-drop + browse)
│   ├── PasswordInput.tsx       # Masked password with show/hide toggle
│   ├── AnalyzeButton.tsx       # Primary CTA, disabled until file selected
│   ├── ProcessingStatus.tsx    # Animated step-by-step progress indicator
│   ├── PrivacyBadge.tsx        # Always-visible privacy explainer
│   ├── SummaryCards.tsx        # 3× KPI cards (total spend, top category, top merchant)
│   ├── CategoryChart.tsx       # Recharts donut chart
│   ├── TimelineChart.tsx       # Recharts bar chart with daily/weekly toggle
│   ├── TransactionTable.tsx    # Sortable table with inline category editing
│   ├── ExportMenu.tsx          # CSV/JSON export dropdown
│   ├── ErrorMessage.tsx        # Inline error display
│   ├── CountUp.tsx             # Number animation component
│   └── icons.tsx               # SVG icon components
│
├── hooks/
│   ├── useFileUpload.ts        # File selection, validation, state
│   ├── useParsing.ts           # Full pipeline: extract → sanitize → API → validate → aggregate
│   └── useDarkMode.ts          # Theme toggle with system preference detection
│
├── lib/
│   ├── pdf-extractor.ts        # pdf.js: decrypt → extract text → wipe memory
│   ├── sanitizer.ts            # Regex PII stripping (runs client-side, pre-API)
│   ├── aggregator.ts           # Group by category, compute totals and percentages
│   ├── validators.ts           # Validate Gemini JSON against Transaction schema
│   ├── export.ts               # Generate CSV/JSON Blobs for download
│   └── format.ts               # Currency and number formatting
│
└── types/
    └── index.ts                # Transaction, Category, DashboardData, AppState, error classes
```

---

## Key Types

```typescript
type Category = "Dining" | "Groceries" | "Transportation" | "Entertainment"
  | "Utilities" | "Healthcare" | "Shopping" | "Subscriptions" | "Travel" | "Other";

interface Transaction {
  date: string;          // "YYYY-MM-DD"
  merchant: string;      // Display name
  rawMerchant: string;   // Original from Gemini
  amount: number;        // Positive = expense, negative = credit
  category: Category;
}

type AppState =
  | { stage: "upload" }
  | { stage: "processing"; step: ProcessingStep; progress: number }
  | { stage: "results"; data: DashboardData }
  | { stage: "error"; message: string; recoverable: boolean };
```

---

## Code Conventions

### TypeScript
- **Strict mode** is enabled. Do not use `any` — use proper types or `unknown`.
- All shared types live in `src/types/index.ts`.
- Error types use custom classes: `PdfError` and `ParseError` with typed error codes.

### Styling
- **Vanilla CSS only** — no Tailwind, no CSS-in-JS, no styled-components.
- Design tokens are defined as CSS custom properties in `src/app/globals.css`.
- Component styles live in `src/components/components.css`.
- Use the existing token system (`--bg-primary`, `--bg-surface`, `--accent-primary`, `--space-md`, etc.).
- Dark mode is the default theme.

### Components
- All components are React functional components with TypeScript props interfaces.
- Components are in `src/components/` — one component per file.
- Component names match file names (e.g., `DropZone.tsx` exports `DropZone`).
- Keep components focused and reusable.

### State Management
- The app state machine lives in `src/app/page.tsx` using `useState<AppState>`.
- No external state libraries (no Redux, no Zustand, no Jotai).
- Transitions: `upload → processing → results` or `upload → processing → error`.

### Hooks
- Custom hooks live in `src/hooks/`.
- `useParsing` orchestrates the full pipeline and is the primary hook for the main page.

### API Routes
- Single API route: `POST /api/parse` in `src/app/api/parse/route.ts`.
- Accepts `{ text: string }`, returns `{ transactions: Transaction[], currency?: string }` or `{ error: string }`.
- Uses Gemini structured output (not free-text parsing).

---

## Common Tasks

### Adding a new transaction category
1. Add the category to the `Category` type union in `src/types/index.ts`.
2. Add it to the `CATEGORIES` array in the same file.
3. Add a color mapping in `CATEGORY_COLORS`.
4. Update the enum list in the Gemini schema in `src/app/api/parse/route.ts`.
5. Update the system prompt in the same file if needed.

### Adding a new component
1. Create `src/components/MyComponent.tsx` with a typed props interface.
2. Add styles to `src/components/components.css` using existing design tokens.
3. Import and use in `src/app/page.tsx` or parent component.

### Modifying the Gemini prompt or schema
- File: `src/app/api/parse/route.ts`
- The schema uses `@google/generative-ai`'s `SchemaType` for structured output.
- Test changes against real bank statement text to verify accuracy.

### Adding a new processing step
1. Add the step to `ProcessingStep` type in `src/types/index.ts`.
2. Update `ProcessingStatus.tsx` to display the new step.
3. Update `useParsing.ts` to set the step during the pipeline.

---

## Environment Variables

| Variable | Required | Scope | Description |
|---|---|---|---|
| `GOOGLE_API_KEY` | Yes | Server-only | Google AI Studio API key for Gemini |

Template file: `.env.local.example`

---

## Build & Run

```bash
npm install           # Install dependencies
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build
npm run typecheck     # Type checking (tsc --noEmit)
npm run lint          # ESLint
```

---

## Planning Documents

Refer to these for deeper context on design decisions and requirements:

- **[CCSA.md](./docs/CCSA.md)** — Original project specification
- **[PRODUCT_IMPLEMENTATION_PLAN.md](./docs/PRODUCT_IMPLEMENTATION_PLAN.md)** — User stories, acceptance criteria, phased delivery
- **[UIUX_IMPLEMENTATION_PLAN.md](./docs/UIUX_IMPLEMENTATION_PLAN.md)** — Design system, wireframes, animation specs, responsive breakpoints
- **[ENGINEERING_IMPLEMENTATION_PLAN.md](./docs/ENGINEERING_IMPLEMENTATION_PLAN.md)** — Architecture, module specs, API contracts, security checklist
