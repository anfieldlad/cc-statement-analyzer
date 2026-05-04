# cc-statement-analyzer

A privacy-first web app that parses encrypted credit card PDF statements and produces a categorized spending dashboard. Nothing is stored — close the tab and everything is gone.

## How it works

1. **Client-side decryption.** The PDF is decrypted in your browser using `pdf.js`. The password never leaves the device.
2. **Client-side sanitization.** Card numbers, account numbers, SSNs, and likely names are stripped via regex *before* any network request.
3. **Server-side parsing.** Sanitized text is sent to a Next.js API route, which calls Google Gemini 2.5 Flash Lite with a structured-output schema.
4. **Server-side scrub.** Each merchant string in the response is re-checked for PII patterns.
5. **Client-side dashboard.** Aggregation, charts, and the transaction table are computed in React. No persistence — no DB, no localStorage, no cookies.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| PDF | `pdfjs-dist` (client-only, dynamic import) |
| LLM | `@google/generative-ai`, `gemini-2.5-flash-lite` |
| Charts | Recharts |
| Styling | Vanilla CSS with custom properties |
| Hosting | Vercel |

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and set GOOGLE_API_KEY=...
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Google AI Studio API key. Server-only — never exposed to the client. |

## Project structure

```
src/
  app/
    layout.tsx              Root layout, Inter font, metadata
    page.tsx                SPA entry — owns the upload → processing → results state machine
    globals.css             Design system tokens (dark mode default)
    api/parse/route.ts      POST endpoint — Gemini SDK call with structured output
  components/
    Header, PrivacyBadge, DropZone, PasswordInput, AnalyzeButton,
    ProcessingStatus, SummaryCards, CategoryChart, TimelineChart,
    TransactionTable, ExportMenu, ErrorMessage, CountUp, icons
  hooks/
    useFileUpload, useParsing, useDarkMode
  lib/
    pdf-extractor, sanitizer, aggregator, validators, export, format
  types/
    index.ts                Transaction, Category, AppState, error classes
```

## Scripts

```bash
npm run dev         # local dev server
npm run build       # production build
npm run start       # serve production build
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
```

## Privacy invariants

| Invariant | How it's enforced |
|---|---|
| Password never sent to server | Decryption runs in `pdf.js` in the browser |
| Raw PDF never sent to server | Only sanitized text is POSTed to `/api/parse` |
| No PII in API request | Client-side regex sanitizer (`src/lib/sanitizer.ts`) |
| No PII in API response | Server-side `scrubField` re-runs on merchant strings |
| No logging of financial data | No `console.log` on text/transactions/passwords |
| No persistence | No DB, no localStorage, no sessionStorage, no cookies |

## Deployment

1. Push the repo to GitHub and import the project in Vercel.
2. In Vercel → Settings → Environment Variables, set `GOOGLE_API_KEY`.
3. The default Next.js build settings work as-is.

## License

[MIT](./LICENSE)
