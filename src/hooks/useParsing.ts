"use client";

import { useCallback, useState } from "react";
import {
  ERROR_MESSAGES,
  ParseError,
  PdfError,
  type AppState,
  type ProcessingStep,
  type Transaction,
} from "@/types";
import { aggregate } from "@/lib/aggregator";

const STEP_PROGRESS: Record<ProcessingStep, number> = {
  decrypting: 15,
  extracting: 35,
  sanitizing: 50,
  parsing: 80,
  validating: 95,
};

export function useParsing() {
  const [state, setState] = useState<AppState>({ stage: "upload" });

  const reset = useCallback(() => {
    setState({ stage: "upload" });
  }, []);

  const setError = useCallback((message: string) => {
    setState({ stage: "error", message, recoverable: true });
  }, []);

  const updateTransactions = useCallback((next: Transaction[]) => {
    setState((prev) => {
      if (prev.stage !== "results") return prev;
      return {
        stage: "results",
        data: aggregate(next, prev.data.currency, prev.data.rejectedCount),
      };
    });
  }, []);

  const start = useCallback(async (file: File, password: string) => {
    const setStep = (step: ProcessingStep) =>
      setState({ stage: "processing", step, progress: STEP_PROGRESS[step] });

    try {
      setStep("decrypting");
      const { extractText } = await import("@/lib/pdf-extractor");

      setStep("extracting");
      const rawText = await extractText(file, password);

      setStep("sanitizing");
      const { sanitize } = await import("@/lib/sanitizer");
      const cleaned = sanitize(rawText);

      if (!cleaned.trim()) {
        setState({
          stage: "error",
          message:
            "We couldn't find any readable text in this PDF. It may be scanned (image-only).",
          recoverable: true,
        });
        return;
      }

      setStep("parsing");
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const codeByStatus: Record<number, string> = {
          429: "API_RATE_LIMIT",
          504: "API_TIMEOUT",
        };
        const code = codeByStatus[res.status] ?? "SERVICE_ERROR";
        throw new ParseError(
          code as never,
          body.error ?? ERROR_MESSAGES[code]
        );
      }

      const payload = (await res.json()) as {
        currency?: string;
        transactions: Transaction[];
        rejected: number;
      };

      setStep("validating");
      if (!payload.transactions || payload.transactions.length === 0) {
        setState({
          stage: "error",
          message: ERROR_MESSAGES.NO_TRANSACTIONS,
          recoverable: true,
        });
        return;
      }

      const currency =
        typeof payload.currency === "string" && payload.currency.length === 3
          ? payload.currency.toUpperCase()
          : "USD";
      const data = aggregate(
        payload.transactions,
        currency,
        payload.rejected ?? 0
      );
      setState({ stage: "results", data });
    } catch (err: unknown) {
      if (err instanceof PdfError) {
        setError(ERROR_MESSAGES[err.code] ?? "Failed to read PDF");
        return;
      }
      if (err instanceof ParseError) {
        setError(ERROR_MESSAGES[err.code] ?? "Failed to parse statement");
        return;
      }
      setError(ERROR_MESSAGES.SERVICE_ERROR);
    }
  }, [setError]);

  return { state, start, reset, updateTransactions };
}
