import Link from "next/link";
import type { Metadata } from "next";
import "../../components/components.css";
import "./privacy.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy Policy — Spending Insights",
  description:
    "What we do and don't do with your credit card statement data. Plain language, no dark patterns.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header
        rightSlot={
          <Link href="/" className="btn btn-ghost">
            ← Back
          </Link>
        }
      />
      <main>
        <div className="container privacy-page">
          <header className="privacy-page-header">
            <h1>Privacy Policy</h1>
            <p className="privacy-page-meta">
              Last updated: 2026-05-04 · Plain English. No dark patterns.
            </p>
          </header>

          <section className="privacy-section">
            <h2>The short version</h2>
            <ul className="privacy-bullets">
              <li>
                We do <strong>not</strong> store your PDF, your password, your
                extracted text, or your transactions on any server.
              </li>
              <li>
                We do <strong>not</strong> use cookies, localStorage, analytics,
                or trackers for your financial data.
              </li>
              <li>
                We <strong>do</strong> send the sanitized text of your statement
                to Google&apos;s Gemini API so it can categorize transactions.
                You should know about this — see below.
              </li>
              <li>
                When you close the browser tab, every piece of your data is
                gone.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>What happens to your PDF, step by step</h2>
            <ol className="privacy-steps">
              <li>
                <strong>You drop a PDF and (optionally) type a password.</strong>{" "}
                Both stay in your browser&apos;s memory. Neither is uploaded
                anywhere at this stage.
              </li>
              <li>
                <strong>The PDF is decrypted in your browser</strong> using{" "}
                <code>pdf.js</code>. The password is used only to unlock the
                file locally and is then dropped. It never reaches our server
                and it never reaches Google.
              </li>
              <li>
                <strong>Text is extracted from the PDF, also in your browser.</strong>{" "}
                The original PDF bytes are released from memory immediately
                afterward.
              </li>
              <li>
                <strong>The text is sanitized in your browser.</strong> Before
                anything leaves your device, regex patterns strip:
                <ul>
                  <li>16-digit card numbers and 15-digit Amex card numbers</li>
                  <li>US SSN-shaped strings</li>
                  <li>Long digit runs (16+ digits)</li>
                  <li>
                    Account numbers near the words &ldquo;account&rdquo;,
                    &ldquo;acct&rdquo;, &ldquo;a/c&rdquo;
                  </li>
                  <li>
                    Names near the words &ldquo;name&rdquo;,
                    &ldquo;cardholder&rdquo;, &ldquo;holder&rdquo;
                  </li>
                </ul>
                These are replaced with placeholders like{" "}
                <code>[CARD_REDACTED]</code>.
              </li>
              <li>
                <strong>
                  The sanitized text is POSTed to our serverless function at{" "}
                  <code>/api/parse</code>.
                </strong>{" "}
                This is the first time anything leaves your device.
              </li>
              <li>
                <strong>
                  Our server forwards that text to Google&apos;s Gemini API
                </strong>{" "}
                (model: <code>gemini-2.5-flash-lite</code>). Google parses it
                into structured transactions and returns the JSON.
              </li>
              <li>
                <strong>Our server runs a second PII scrub</strong> on the
                merchant strings Google returns, then sends the result back to
                your browser.
              </li>
              <li>
                <strong>The dashboard is built and rendered in your browser.</strong>{" "}
                Nothing about this session is written to any database, log file,
                or storage anywhere.
              </li>
            </ol>
          </section>

          <section className="privacy-section privacy-callout">
            <h2>About Google Gemini — be transparent with yourself</h2>
            <p>
              For the AI categorization to work, the sanitized text of your
              statement is sent to Google&apos;s Generative AI API. We do not
              control what Google does with that data on their side. You should
              read Google&apos;s own terms before using this app:
            </p>
            <ul className="privacy-bullets">
              <li>
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gemini API Additional Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Privacy Policy
                </a>
              </li>
            </ul>
            <p>
              At the time of writing, Google&apos;s paid Gemini API tier states
              that prompts and responses are <em>not</em> used to improve their
              models, while the free tier may be used for that purpose. Verify
              the current terms yourself — they can change.
            </p>
            <p>
              The sanitizer in this app is a regex layer, not a guarantee. It
              catches common PII patterns but cannot perfectly identify every
              piece of personal information that might appear in a statement. If
              your bank includes unusual identifiers in the document text, those
              may pass through.
            </p>
          </section>

          <section className="privacy-section">
            <h2>What we don&apos;t do</h2>
            <ul className="privacy-bullets">
              <li>No accounts. No login. No email collection.</li>
              <li>
                No database. No object storage. No file uploads to S3 or
                similar.
              </li>
              <li>
                No analytics for your statement data. No Google Analytics, no
                Mixpanel, no Segment.
              </li>
              <li>
                No third-party scripts that could read your transactions in the
                browser.
              </li>
              <li>
                No advertising trackers. No fingerprinting on financial data.
              </li>
              <li>
                No server-side logging of request bodies, response bodies,
                passwords, or extracted text.
              </li>
            </ul>
            <p className="privacy-note">
              The only data the hosting infrastructure (Vercel) sees in normal
              operation is standard request metadata: your IP address, the
              timestamp of the request, and the response status code. We do not
              add any logging on top of that.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Local browser storage</h2>
            <p>
              We store one tiny preference in <code>localStorage</code>: your
              dark/light theme choice (key: <code>ccsa-theme</code>). That is
              the only thing this app writes to your browser. No cookies, no
              session storage, no IndexedDB.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Open source</h2>
            <p>
              You shouldn&apos;t have to take our word for any of this. The full
              source code is available — read it, audit it, run it yourself with
              your own Google API key. Specifically:
            </p>
            <ul className="privacy-bullets">
              <li>
                <code>src/lib/pdf-extractor.ts</code> — PDF decryption and text
                extraction (browser-only).
              </li>
              <li>
                <code>src/lib/sanitizer.ts</code> — PII scrubbing patterns.
              </li>
              <li>
                <code>src/app/api/parse/route.ts</code> — the only server-side
                code path. The Gemini call lives here.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>Changes to this policy</h2>
            <p>
              If we change how data flows through the app, we update this page
              and the &ldquo;Last updated&rdquo; date. Material changes — for
              example, switching AI providers, or adding any form of persistence
              — will be called out here.
            </p>
          </section>

          <div className="privacy-footer-link">
            <Link href="/" className="btn btn-secondary">
              ← Back to the app
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
