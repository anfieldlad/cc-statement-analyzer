import { CATEGORIES, type Category, type Transaction } from "@/types";
import { scrubField } from "./sanitizer";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}

function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" && (CATEGORIES as readonly string[]).includes(value)
  );
}

export interface ValidationResult {
  valid: Transaction[];
  rejected: number;
}

export function validateTransactions(input: unknown): ValidationResult {
  if (!Array.isArray(input)) {
    return { valid: [], rejected: 0 };
  }

  const valid: Transaction[] = [];
  let rejected = 0;

  for (const item of input) {
    if (!item || typeof item !== "object") {
      rejected++;
      continue;
    }
    const r = item as Record<string, unknown>;
    const date = r.date;
    const merchantRaw = r.merchant;
    const rawMerchantRaw = r.rawMerchant;
    const amount = r.amount;
    const category = r.category;

    if (typeof date !== "string" || !isValidDate(date)) {
      rejected++;
      continue;
    }
    if (typeof merchantRaw !== "string") {
      rejected++;
      continue;
    }
    const merchant = scrubField(merchantRaw.trim()).slice(0, 200);
    if (!merchant || /^\d+$/.test(merchant)) {
      rejected++;
      continue;
    }
    const rawMerchant =
      typeof rawMerchantRaw === "string" && rawMerchantRaw.trim().length > 0
        ? scrubField(rawMerchantRaw.trim()).slice(0, 500)
        : merchant;
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount === 0
    ) {
      rejected++;
      continue;
    }
    if (!isCategory(category)) {
      rejected++;
      continue;
    }

    valid.push({ date, merchant, rawMerchant, amount, category });
  }

  return { valid, rejected };
}
