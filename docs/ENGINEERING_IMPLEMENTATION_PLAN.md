# Engineering Implementation Plan: cc-statement-analyzer

> **Author:** Senior Tech Architect
> **Date:** 2026-05-04
> **Source:** [PRODUCT_IMPLEMENTATION_PLAN.md](./PRODUCT_IMPLEMENTATION_PLAN.md) · [UIUX_IMPLEMENTATION_PLAN.md](./UIUX_IMPLEMENTATION_PLAN.md)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER                                    │
│                                                                     │
│  ┌──────────┐   ┌───────────┐   ┌────────────┐   ┌─────────────┐  │
│  │ DropZone │──▶│ pdf.js    │──▶│ sanitizer  │──▶│ POST        │  │
│  │ + Pass   │   │ (decrypt  │   │ (strip PII │   │ /api/parse  │  │
│  │ Input    │   │  + extract│   │  via regex) │   │             │  │
│  └──────────┘   └───────────┘   └────────────┘   └──────┬──────┘  │
│                                                          │         │
│  ┌──────────────────────────────────────────────────────┐│         │
│  │                 React State                          ││         │
│  │  transactions[] → aggregator → charts + table        ││         │
│  └──────────────────────────────────────────────────────┘│         │
└─────────────────────────────────────────────────────────┼──────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS                                │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────────────────────────┐  │
│  │ /api/parse        │──▶│ Google Generative AI SDK              │  │
│  │ (Next.js Route)   │   │ Model: gemini-2.5-flash-lite         │  │
│  │                   │◀──│ Response: JSON (structured output)    │  │
│  └──────────────────┘    └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR-capable, Vercel-native, API routes built-in |
| Language | TypeScript (strict mode) | Type safety for financial data handling |
| PDF processing | pdf.js (client-side) | Password never leaves browser; zero server exposure |
| LLM provider | Google Gemini 2.5 Flash Lite | Cost-efficient, fast, structured JSON output support |
| LLM SDK | `@google/generative-ai` | Official Google SDK for Node.js |
| Charting | Recharts | React-native, composable, good animation support |
| Styling | Vanilla CSS (custom properties) | No build-time CSS framework dependency; full control |
| State management | React useState/useReducer | Single-page app; no need for external state library |
| Database | None | Fully stateless by product requirement |
| Deployment | Vercel | Zero-config for Next.js; serverless API routes |

---

## 2. Tech Stack & Dependencies

### Production Dependencies

```
next                    → Framework
react / react-dom       → UI library
pdfjs-dist              → Client-side PDF decryption & text extraction
@google/generative-ai   → Google Gemini API SDK
recharts                → Charting library (donut, bar)
```

### Development Dependencies

```
typescript              → Type checking
@types/react            → React type definitions
@types/node             → Node.js type definitions
eslint                  → Linting
eslint-config-next      → Next.js ESLint rules
```

### Environment Variables

```env
# .env.local (never committed)
GOOGLE_API_KEY=your_gemini_api_key_here
```

Single environment variable. No database URLs, no auth secrets, no analytics keys.

---

## 3. Project Structure

```
cc-statement-analyzer/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, metadata, Inter font
│   │   ├── page.tsx                   # Main SPA entry — orchestrates all views
│   │   ├── globals.css                # Design system tokens + global styles
│   │   └── api/
│   │       └── parse/
│   │           └── route.ts           # POST endpoint — Gemini API call
│   │
│   ├── components/
│   │   ├── Header.tsx                 # App header + dark mode toggle
│   │   ├── PrivacyBadge.tsx           # Zero-trust privacy explainer
│   │   ├── DropZone.tsx               # Drag-and-drop PDF upload
│   │   ├── PasswordInput.tsx          # Secure masked password field
│   │   ├── AnalyzeButton.tsx          # Primary CTA button
│   │   ├── ProcessingStatus.tsx       # Step-by-step progress indicator
│   │   ├── SummaryCards.tsx           # 3x KPI cards (total, top category, top merchant)
│   │   ├── CategoryChart.tsx          # Donut chart (Recharts)
│   │   ├── TimelineChart.tsx          # Bar chart (Recharts)
│   │   ├── TransactionTable.tsx       # Sortable table with inline category edit
│   │   ├── ExportMenu.tsx             # CSV/JSON download dropdown
│   │   └── ErrorMessage.tsx           # Reusable error display
│   │
│   ├── lib/
│   │   ├── pdf-extractor.ts           # pdf.js wrapper: decrypt → extract text → wipe
│   │   ├── sanitizer.ts              # Regex PII stripping (card numbers, names, SSNs)
│   │   ├── aggregator.ts             # Group transactions by category, calc totals
│   │   ├── validators.ts             # Validate Gemini JSON response against schema
│   │   └── export.ts                 # Generate CSV/JSON blobs for download
│   │
│   ├── types/
│   │   └── index.ts                   # All TypeScript interfaces
│   │
│   └── hooks/
│       ├── useFileUpload.ts           # File selection + validation logic
│       ├── useParsing.ts              # Orchestrates extract → sanitize → API → validate
│       └── useDarkMode.ts             # Dark mode toggle with system preference detection
│
├── .env.local                         # GOOGLE_API_KEY (gitignored)
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. Core Module Specifications

### 4.1 TypeScript Interfaces — `src/types/index.ts`

```typescript
// Raw transaction from Gemini
export interface Transaction {
  date: string;          // "YYYY-MM-DD"
  merchant: string;
  amount: number;        // positive = expense, negative = payment/credit
  category: Category;
}

// Fixed set of categories
export type Category =
  | "Dining"
  | "Groceries"
  | "Transportation"
  | "Entertainment"
  | "Utilities"
  | "Healthcare"
  | "Shopping"
  | "Subscriptions"
  | "Travel"
  | "Other";

// Aggregated data for dashboard
export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  totalSpend: number;
  topCategory: CategorySummary;
  topMerchant: { name: string; total: number };
  byCategory: CategorySummary[];
  byDate: { date: string; total: number }[];
  transactions: Transaction[];
}

// Application state machine
export type AppState =
  | { stage: "upload" }
  | { stage: "processing"; step: ProcessingStep }
  | { stage: "results"; data: DashboardData }
  | { stage: "error"; message: string; recoverable: boolean };

export type ProcessingStep =
  | "decrypting"
  | "extracting"
  | "sanitizing"
  | "parsing"
  | "validating";
```

---

### 4.2 PDF Extractor — `src/lib/pdf-extractor.ts`

**Purpose:** Client-side PDF decryption and text extraction using pdf.js.

```
Input:  File (PDF blob) + password (string | undefined)
Output: string (raw extracted text)
Throws: "INVALID_PASSWORD" | "CORRUPTED_PDF" | "EXTRACTION_FAILED"
```

**Key behaviors:**
- Load PDF with `pdfjs-dist` using `getDocument({ data: arrayBuffer, password })`
- Iterate all pages, extract text content via `page.getTextContent()`
- Concatenate all text items with newline separators
- After extraction: explicitly null the `ArrayBuffer`, PDF document, and page references
- Never log or `console.log` any extracted content
- Handle pdf.js error codes: `PasswordException` (wrong password), `InvalidPDFException` (corrupted)

**Worker setup:**
- Configure pdf.js worker via CDN or bundled worker file
- `pdfjs.GlobalWorkerOptions.workerSrc` must be set in the component that calls this module

---

### 4.3 PII Sanitizer — `src/lib/sanitizer.ts`

**Purpose:** Strip personally identifiable information from extracted text before sending to Gemini.

```
Input:  string (raw extracted text)
Output: string (sanitized text)
```

**Regex patterns to strip:**

| Pattern | Target | Replacement |
|---|---|---|
| `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b` | Credit card numbers (16-digit) | `[CARD_REDACTED]` |
| `\b\d{4}[\s-]?\d{6}[\s-]?\d{5}\b` | Amex card numbers (15-digit) | `[CARD_REDACTED]` |
| `\b\d{3}-\d{2}-\d{4}\b` | US SSN | `[SSN_REDACTED]` |
| `\b\d{16}\b` | Generic long number sequences | `[NUM_REDACTED]` |
| `\b[A-Z][a-z]+\s[A-Z][a-z]+\b` (near "name"/"holder") | Cardholder names (contextual) | `[NAME_REDACTED]` |
| `\b\d{6,10}\b` (near "account"/"acct") | Account numbers | `[ACCT_REDACTED]` |

**Important:** Sanitizer runs client-side before the API call. This is the first layer of PII defense.

---

### 4.4 API Route — `src/app/api/parse/route.ts`

**Purpose:** Serverless endpoint that receives sanitized text and calls Gemini 2.5 Flash Lite.

```
POST /api/parse
Body: { text: string }
Response: { transactions: Transaction[] } | { error: string }
```

**Implementation:**

```typescript
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const transactionSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      date:     { type: SchemaType.STRING,  description: "Transaction date in YYYY-MM-DD format" },
      merchant: { type: SchemaType.STRING,  description: "Merchant or payee name" },
      amount:   { type: SchemaType.NUMBER,  description: "Transaction amount (positive = expense, negative = credit)" },
      category: { type: SchemaType.STRING,  enum: [
        "Dining", "Groceries", "Transportation", "Entertainment",
        "Utilities", "Healthcare", "Shopping", "Subscriptions", "Travel", "Other"
      ]},
    },
    required: ["date", "merchant", "amount", "category"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: transactionSchema,
  },
});
```

**System prompt:**

```
You are a financial data extraction engine. Extract ALL transactions from this
credit card statement text. For each transaction provide date, merchant, amount,
and category. Map merchants to: Dining, Groceries, Transportation, Entertainment,
Utilities, Healthcare, Shopping, Subscriptions, Travel, Other. Amounts are positive
for expenses and negative for payments/credits. Do NOT include any account numbers,
cardholder names, or PII.
```

**Error handling:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Missing/empty `text` body | 400 | `{ error: "No text provided" }` |
| `GOOGLE_API_KEY` not set | 500 | `{ error: "Service configuration error" }` |
| Gemini API timeout (>30s) | 504 | `{ error: "Processing timed out" }` |
| Gemini API rate limit | 429 | `{ error: "Service busy, try again" }` |
| Invalid JSON response | 500 | `{ error: "Failed to parse transactions" }` |
| Any other error | 500 | `{ error: "An unexpected error occurred" }` |

**Post-response PII scrub:** After receiving Gemini's JSON, run a secondary regex check on all `merchant` and `date` string fields to catch any PII that leaked through. Strip if found.

**Security:** The API route never logs the request body or response body. No `console.log` on any financial data.

---

### 4.5 Aggregator — `src/lib/aggregator.ts`

**Purpose:** Transform raw `Transaction[]` into `DashboardData` for visualization.

```
Input:  Transaction[]
Output: DashboardData
```

**Logic:**

1. **byCategory:** Group transactions by `category`, sum amounts, calculate percentage of total
2. **byDate:** Group transactions by `date`, sum amounts per day
3. **totalSpend:** Sum all positive amounts (expenses only, exclude credits)
4. **topCategory:** Category with highest total
5. **topMerchant:** Group by merchant, find highest total
6. Sort `byCategory` descending by total. Sort `byDate` ascending by date.

---

### 4.6 Validators — `src/lib/validators.ts`

**Purpose:** Validate the JSON array returned by Gemini matches the expected `Transaction[]` schema.

**Validation rules:**

| Field | Rule |
|---|---|
| `date` | Matches `YYYY-MM-DD` format; is a valid calendar date |
| `merchant` | Non-empty string; max 200 chars; no digit-only strings |
| `amount` | Finite number; not NaN; not zero |
| `category` | Must be one of the 10 defined `Category` values |

**On validation failure:** Filter out invalid transactions (don't reject the whole batch). Return valid ones + count of rejected for UI warning.

---

### 4.7 Export — `src/lib/export.ts`

**Purpose:** Generate downloadable CSV and JSON files from `Transaction[]`.

**CSV format:**
```
Date,Merchant,Amount,Category
2026-04-28,Grab Food,45.00,Dining
2026-04-27,Tokopedia,120.00,Shopping
```

**JSON format:** Pretty-printed array of transaction objects.

**Implementation:** Create `Blob`, generate `URL.createObjectURL`, trigger download via hidden `<a>` element with `download` attribute. Revoke object URL after download starts.

---

## 5. Data Flow & Security

### Request Lifecycle

```
1. User drops PDF + enters password
   ↓
2. [CLIENT] pdf.js decrypts PDF in memory, extracts text
   ↓
3. [CLIENT] sanitizer strips PII via regex
   ↓
4. [CLIENT] Wipes PDF ArrayBuffer + password from memory
   ↓
5. [CLIENT → SERVER] POST /api/parse { text: sanitizedText }
   ↓
6. [SERVER] Calls Gemini 2.5 Flash Lite with structured output schema
   ↓
7. [SERVER] Receives JSON transaction array
   ↓
8. [SERVER] Secondary PII scrub on response
   ↓
9. [SERVER → CLIENT] Returns validated Transaction[]
   ↓
10. [CLIENT] aggregator computes DashboardData
    ↓
11. [CLIENT] React state holds everything — renders charts + table
    ↓
12. [USER CLOSES TAB] All data in memory is destroyed
```

### Security Checklist

| Invariant | Enforced By |
|---|---|
| Password never sent to server | pdf.js runs client-side; password only in React state, nulled after use |
| Raw PDF never sent to server | Only extracted + sanitized text is POSTed |
| No PII in API request | Client-side regex sanitizer (layer 1) |
| No PII in API response | Server-side regex scrub on Gemini output (layer 2) |
| No logging of financial data | No `console.log` on text, transactions, or passwords in production |
| No persistence | No database, no localStorage, no sessionStorage, no cookies |
| API key protected | `GOOGLE_API_KEY` in `.env.local`, accessed only server-side in API route |
| Memory cleanup | ArrayBuffer + password nulled after extraction; all state in React |

---

## 6. Performance Considerations

| Concern | Strategy |
|---|---|
| pdf.js bundle size (~400KB) | Dynamic import (`next/dynamic`) — load only when user drops a file |
| Recharts bundle size (~200KB) | Dynamic import — load only when results are ready |
| Large PDF (50+ pages) | Chunk text into ≤ 4,000 token segments; make parallel Gemini calls; merge results |
| Gemini latency | Typically 2–5 seconds for Flash Lite; show progress indicator |
| Initial page load | Only load upload UI; defer all other components |
| Fonts (Inter) | Load via `next/font/google` — zero layout shift, optimized loading |

---

## 7. Error Handling Strategy

### Error Hierarchy

```
UI Layer (components)
  ↓ catches and displays
Hook Layer (useFileUpload, useParsing)
  ↓ catches and maps to AppState.error
Lib Layer (pdf-extractor, sanitizer, validators)
  ↓ throws typed errors
API Layer (/api/parse)
  ↓ returns HTTP error codes + JSON error messages
External (Gemini API)
```

### Error Types

```typescript
export class PdfError extends Error {
  constructor(
    public code: "INVALID_PASSWORD" | "CORRUPTED_PDF" | "EXTRACTION_FAILED" | "FILE_TOO_LARGE",
    message: string
  ) {
    super(message);
  }
}

export class ParseError extends Error {
  constructor(
    public code: "API_TIMEOUT" | "API_RATE_LIMIT" | "INVALID_RESPONSE" | "SERVICE_ERROR",
    message: string
  ) {
    super(message);
  }
}
```

### User-Facing Error Messages

| Error Code | User Message |
|---|---|
| `INVALID_PASSWORD` | "Incorrect password. Please try again." |
| `CORRUPTED_PDF` | "We couldn't read this PDF. It may be corrupted or unsupported." |
| `EXTRACTION_FAILED` | "Failed to extract text from this PDF. Try a different file." |
| `FILE_TOO_LARGE` | "This file is too large (max 10MB)." |
| `API_TIMEOUT` | "Processing took too long. Try again or use a smaller file." |
| `API_RATE_LIMIT` | "Our service is busy right now. Please try again in a moment." |
| `INVALID_RESPONSE` | "We had trouble understanding this statement. Try again." |
| `SERVICE_ERROR` | "Something went wrong on our end. Please try again later." |

---

## 8. Phased Engineering Plan

### Phase 1 — Scaffolding (Days 1–2)

| Task | Details |
|---|---|
| Init Next.js 15 | `create-next-app` with TypeScript, App Router, ESLint, `src/` dir, no Tailwind |
| Install dependencies | `pdfjs-dist`, `@google/generative-ai`, `recharts` |
| Design system | `globals.css` with all tokens from UI/UX plan (colors, type, spacing) |
| `.env.local` | `GOOGLE_API_KEY` — add `.env.local` to `.gitignore` |
| Layout + Header | Root layout with Inter font, Header component, dark mode toggle |
| PrivacyBadge | Static privacy explainer section |
| Deploy | Connect to Vercel; verify build + deploy works |

### Phase 2 — PDF Upload (Days 3–5)

| Task | Details |
|---|---|
| DropZone component | Drag-and-drop + click-to-browse; `.pdf` validation; 10MB max; file info display |
| PasswordInput | Masked input with eye toggle; optional field |
| AnalyzeButton | Disabled until file selected; triggers processing pipeline |
| pdf-extractor module | pdf.js integration with worker; decrypt, extract, wipe memory |
| sanitizer module | All PII regex patterns; returns sanitized text |
| useFileUpload hook | File state, validation, error state management |
| ErrorMessage component | Reusable inline error display |
| useParsing hook | Orchestrates: extract → sanitize → api call → validate → aggregate |

### Phase 3 — Gemini Integration (Days 6–9)

| Task | Details |
|---|---|
| `/api/parse` route | POST endpoint; Gemini SDK init; structured output schema; error handling |
| System prompt | Engineer and test against sample statement text |
| validators module | JSON response validation; filter invalid transactions |
| Post-response PII scrub | Secondary regex check on Gemini output |
| ProcessingStatus | Step-by-step progress with animations per UI/UX spec |
| TransactionTable | Sortable columns; inline category dropdown; search filter |
| App state machine | Implement `AppState` transitions in `page.tsx` |
| Screen transitions | Cross-fade upload → processing → results |

### Phase 4 — Dashboard (Days 10–13)

| Task | Details |
|---|---|
| aggregator module | Category grouping, totals, percentages, top merchant logic |
| SummaryCards | 3 KPI cards with count-up animation |
| CategoryChart | Recharts `PieChart` (donut); custom colors; hover tooltip; click-to-filter |
| TimelineChart | Recharts `BarChart`; daily/weekly toggle; animate on entry |
| Responsive layout | CSS Grid/Flexbox; breakpoints at 640px and 1024px per UI/UX spec |
| Chart ↔ table interaction | Clicking donut segment filters table; category edit updates chart |
| Micro-animations | All animations per UI/UX spec (entry, hover, transitions) |

### Phase 5 — Polish & Launch (Days 14–16)

| Task | Details |
|---|---|
| export module | CSV + JSON generation; Blob download |
| ExportMenu component | Dropdown with CSV/JSON options |
| Accessibility | Keyboard nav, focus rings, aria-labels, `prefers-reduced-motion` |
| Mobile polish | Touch targets, horizontal scroll table, stacked layouts |
| Security audit | Verify no logging; inspect Network tab; test with known PII |
| Performance | Dynamic imports for pdf.js + Recharts; Lighthouse ≥ 90 |
| README | Setup guide, architecture overview, env var instructions |
| Production deploy | Final Vercel deployment with production `GOOGLE_API_KEY` |

---

## 9. Testing Strategy

| Layer | Tool | What to Test |
|---|---|---|
| **Unit** | Jest | sanitizer regex patterns, aggregator math, validators, export formatting |
| **Component** | React Testing Library | DropZone interactions, PasswordInput masking, TransactionTable sorting/editing |
| **Integration** | Jest + MSW (Mock Service Worker) | Full pipeline: mock pdf.js output → mock API response → verify dashboard renders |
| **E2E** | Manual (browser) | Upload real encrypted PDFs; verify Network tab for zero PII; test all error states |
| **Security** | Manual | Inspect all XHR payloads; verify no localStorage/cookies; verify memory cleanup |
| **Performance** | Lighthouse | Score ≥ 90 on Performance, Accessibility, Best Practices |

---

## 10. Deployment & CI

### Vercel Configuration

- **Framework:** Next.js (auto-detected)
- **Build command:** `next build`
- **Output:** `.next/` (default)
- **Environment variables:** Set `GOOGLE_API_KEY` in Vercel dashboard → Settings → Environment Variables
- **Region:** Auto (or configure to closest to user base)
- **Serverless function timeout:** Default 10s — may need to increase to 30s for Gemini calls

### .gitignore Essentials

```
node_modules/
.next/
.env.local
.env*.local
*.pem
```

**Critical:** `.env.local` containing `GOOGLE_API_KEY` must never be committed.
