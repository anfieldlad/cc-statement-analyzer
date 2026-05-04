# Project Specification: cc-statement-analyzer

## 1. Project Overview
A secure, intelligent application designed to aggregate, categorize, and summarize credit card bills from PDF statements. The core focus is on **privacy and security**—ensuring that PDF passwords and raw financial data are never stored, logged, or exposed, while leveraging Large Language Models (LLMs) to smartly parse messy banking formats.

## 2. Privacy & Security Strategy (Zero-Trust)
To handle the password requirement safely, the application employs an **Ephemeral Processing Architecture**:
* **Decryption at Runtime:** The user provides the PDF and the decryption password locally or via a secure, transient connection.
* **In-Memory Processing:** The document is decrypted strictly in system memory (RAM).
* **Zero Logging:** The password, raw extracted text, and the original PDF are never written to disk or logged in server telemetry.
* **Data Wiping:** Immediately after the text is extracted and parsed, memory buffers are explicitly wiped.

## 3. Recommended Tech Stack
* **Frontend:** Next.js (React) for a clean, single-page drag-and-drop interface.
* **PDF Processing Engine:** `pdf.js` for completely client-side extraction, or `pdfplumber` within an isolated Python serverless function for in-memory backend extraction.
* **Parsing Engine (LLM API):** OpenAI (GPT-4o) or Google Gemini API. The LLM will interpret the raw, unstructured text and extract it into a strict JSON schema.
* **Database (Optional):** PostgreSQL via **Supabase** to store only the *final aggregated and anonymized summaries* (e.g., "Dining: $200", "Tech Subscriptions: $45") for historical tracking.
* **Deployment & Infrastructure:** **Vercel** for hosting the frontend and serverless endpoints.
* **Security & Auditing:** **Snyk** integration on the repository to continuously monitor and audit the PDF parsing dependencies for vulnerabilities.
* **Development Support:** **GitHub Copilot** to accelerate boilerplate generation and regex fallback logic.

## 4. Core Logic Pipeline
1. **Ingestion:** The user uploads a PDF and securely inputs their decryption password.
2. **Extraction:** The app unlocks the PDF in memory, strips away visual formatting, and extracts raw string data.
3. **LLM Prompting:** The raw text is passed to the LLM API with a strict system prompt: 
   > *"Extract all transactions from this raw credit card statement text. Output a JSON array containing 'Date', 'Merchant', 'Amount', and 'Category'. Map each merchant to a standard category. Do not return any personally identifiable information (PII) or account numbers."*
4. **Aggregation:** The application takes the structured JSON output from the LLM, groups the transactions by category, and calculates total expenditures.
5. **Visualization:** A dashboard displays clear, interactive charts breaking down the monthly spending habits.

## 5. Next Steps for Development
* Initialize the `cc-statement-analyzer` repository and link it to Vercel.
* Gather sample encrypted PDFs from your specific bank(s) to test standard formatting and extraction fidelity.
* Set up the Next.js boilerplate and define the UI flow for secure password entry.
* Engineer the LLM system prompt and test it against the extracted text to ensure accurate, consistent JSON generation.