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

export const CATEGORIES: readonly Category[] = [
  "Dining",
  "Groceries",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Subscriptions",
  "Travel",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<Category, string> = {
  Dining: "#ff6b6b",
  Groceries: "#51cf66",
  Transportation: "#339af0",
  Entertainment: "#9775fa",
  Utilities: "#fcc419",
  Healthcare: "#f06595",
  Shopping: "#20c997",
  Subscriptions: "#5c7cfa",
  Travel: "#ff922b",
  Other: "#868e96",
};

export interface Transaction {
  date: string;
  merchant: string;
  rawMerchant: string;
  amount: number;
  category: Category;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  currency: string;
  totalSpend: number;
  topCategory: CategorySummary | null;
  topMerchant: { name: string; total: number } | null;
  byCategory: CategorySummary[];
  byDate: { date: string; total: number }[];
  transactions: Transaction[];
  rejectedCount: number;
}

export type ProcessingStep =
  | "decrypting"
  | "extracting"
  | "sanitizing"
  | "parsing"
  | "validating";

export type AppState =
  | { stage: "upload" }
  | { stage: "processing"; step: ProcessingStep; progress: number }
  | { stage: "results"; data: DashboardData }
  | { stage: "error"; message: string; recoverable: boolean };

export class PdfError extends Error {
  constructor(
    public code:
      | "INVALID_PASSWORD"
      | "CORRUPTED_PDF"
      | "EXTRACTION_FAILED"
      | "FILE_TOO_LARGE",
    message: string
  ) {
    super(message);
    this.name = "PdfError";
  }
}

export class ParseError extends Error {
  constructor(
    public code:
      | "API_TIMEOUT"
      | "API_RATE_LIMIT"
      | "INVALID_RESPONSE"
      | "SERVICE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: "Incorrect password. Please try again.",
  CORRUPTED_PDF:
    "We couldn't read this PDF. It may be corrupted or unsupported.",
  EXTRACTION_FAILED:
    "Failed to extract text from this PDF. Try a different file.",
  FILE_TOO_LARGE: "This file is too large (max 10MB).",
  API_TIMEOUT: "Processing took too long. Try again or use a smaller file.",
  API_RATE_LIMIT:
    "Our service is busy right now. Please try again in a moment.",
  INVALID_RESPONSE: "We had trouble understanding this statement. Try again.",
  SERVICE_ERROR: "Something went wrong on our end. Please try again later.",
  NO_TRANSACTIONS:
    "We couldn't find any transactions in this PDF. Make sure you uploaded a credit card statement.",
};
