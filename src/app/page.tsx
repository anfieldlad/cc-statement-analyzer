"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "../components/components.css";
import { Header } from "@/components/Header";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { DropZone } from "@/components/DropZone";
import { PasswordInput } from "@/components/PasswordInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionTable } from "@/components/TransactionTable";
import { ExportMenu } from "@/components/ExportMenu";
import { UploadIcon } from "@/components/icons";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useParsing } from "@/hooks/useParsing";
import type { Category, Transaction } from "@/types";

const CategoryChart = dynamic(
  () => import("@/components/CategoryChart").then((m) => m.CategoryChart),
  { ssr: false }
);

const TimelineChart = dynamic(
  () => import("@/components/TimelineChart").then((m) => m.TimelineChart),
  { ssr: false }
);

export default function Home() {
  const upload = useFileUpload();
  const { state, start, reset, updateTransactions } = useParsing();
  const [password, setPassword] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const handleAnalyze = async () => {
    if (!upload.file) return;
    await start(upload.file, password);
    setPassword("");
  };

  const handleReset = () => {
    upload.clear();
    setPassword("");
    setActiveCategory(null);
    reset();
  };

  const handleCategoryEdit = (index: number, next: Category) => {
    if (state.stage !== "results") return;
    const updated: Transaction[] = state.data.transactions.map((t, i) =>
      i === index ? { ...t, category: next } : t
    );
    updateTransactions(updated);
  };

  const headerActions =
    state.stage === "results" ? (
      <>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleReset}
          aria-label="Upload new statement"
        >
          <UploadIcon width={16} height={16} /> Upload New
        </button>
        <ExportMenu
          transactions={state.data.transactions}
          currency={state.data.currency}
        />
      </>
    ) : null;

  return (
    <>
      <Header rightSlot={headerActions} />
      <main>
        <div className="container">
          {state.stage === "upload" && (
            <>
              <div className="hero fade-in">
                <h1>
                  Understand your spending.
                  <br />
                  Without giving up your <span className="accent">privacy</span>.
                </h1>
                <p>
                  Drop your encrypted credit card PDF. Get categorized
                  insights. Nothing is stored.
                </p>
              </div>
              <div className="upload-card fade-in">
                <DropZone file={upload.file} onFile={upload.setFile} />
                {upload.error && (
                  <ErrorMessage>{upload.error}</ErrorMessage>
                )}
                <PasswordInput value={password} onChange={setPassword} />
                <AnalyzeButton
                  enabled={!!upload.file}
                  onClick={handleAnalyze}
                />
              </div>
              <PrivacyBadge />
            </>
          )}

          {state.stage === "processing" && (
            <ProcessingStatus
              step={state.step}
              progress={state.progress}
              onCancel={handleReset}
            />
          )}

          {state.stage === "error" && (
            <div className="error-screen fade-in">
              <h2>Something went wrong</h2>
              <p>{state.message}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReset}
              >
                Try Again
              </button>
            </div>
          )}

          {state.stage === "results" && (
            <div className="results fade-in">
              <div>
                <div className="results-title">Statement Summary</div>
                <div className="results-subtitle">
                  {state.data.transactions.length} transactions parsed ·
                  Currency: {state.data.currency}
                  {state.data.rejectedCount > 0
                    ? ` · ${state.data.rejectedCount} rows skipped`
                    : ""}
                </div>
              </div>

              <SummaryCards data={state.data} />

              <div className="charts-grid">
                <CategoryChart
                  data={state.data.byCategory}
                  currency={state.data.currency}
                  activeCategory={activeCategory}
                  onSelect={setActiveCategory}
                />
                <TimelineChart
                  byDate={state.data.byDate}
                  currency={state.data.currency}
                />
              </div>

              <TransactionTable
                transactions={state.data.transactions}
                currency={state.data.currency}
                filterCategory={activeCategory}
                onClearFilter={() => setActiveCategory(null)}
                onCategoryChange={handleCategoryEdit}
              />
            </div>
          )}
        </div>
      </main>
      <footer className="app-footer">
        <div className="container">
          Copyright by <a href="https://badai.tech/" target="_blank" rel="noopener noreferrer">BAD AI</a>
        </div>
      </footer>
    </>
  );
}
