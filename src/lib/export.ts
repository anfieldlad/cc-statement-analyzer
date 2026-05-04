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
  content: BlobPart,
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

export async function downloadExcel(
  transactions: Transaction[],
  currency: string
): Promise<void> {
  const xlsx = await import("xlsx");
  
  const decimals = currencyDecimals(currency);
  const rows = transactions.map((t) => ({
    Date: t.date,
    Merchant: t.merchant,
    "Raw Descriptor": t.rawMerchant,
    [`Amount (${currency})`]: Number(t.amount.toFixed(decimals)),
    Category: t.category,
  }));

  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Transactions");
  
  const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
  downloadFile(
    excelBuffer,
    `transactions-${Date.now()}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}
