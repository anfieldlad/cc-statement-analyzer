import type { Transaction } from "@/types";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function currencyDecimals(currency: string): number {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions();
    return parts.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function transactionsToCsv(
  transactions: Transaction[],
  currency: string
): string {
  const header = `Date,Merchant,Raw Descriptor,Amount (${currency}),Category`;
  const decimals = currencyDecimals(currency);
  const rows = transactions.map((t) =>
    [
      t.date,
      escapeCsvField(t.merchant),
      escapeCsvField(t.rawMerchant),
      t.amount.toFixed(decimals),
      t.category,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function transactionsToJson(
  transactions: Transaction[],
  currency: string
): string {
  return JSON.stringify({ currency, transactions }, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(
  transactions: Transaction[],
  currency: string
): void {
  downloadFile(
    transactionsToCsv(transactions, currency),
    `transactions-${Date.now()}.csv`,
    "text/csv;charset=utf-8"
  );
}

export function downloadJson(
  transactions: Transaction[],
  currency: string
): void {
  downloadFile(
    transactionsToJson(transactions, currency),
    `transactions-${Date.now()}.json`,
    "application/json;charset=utf-8"
  );
}
