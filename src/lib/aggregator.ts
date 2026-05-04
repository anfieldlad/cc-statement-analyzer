import type { CategorySummary, DashboardData, Transaction } from "@/types";

export function aggregate(
  transactions: Transaction[],
  currency: string,
  rejectedCount = 0
): DashboardData {
  const expenses = transactions.filter((t) => t.amount > 0);
  const totalSpend = expenses.reduce((sum, t) => sum + t.amount, 0);

  // By category
  const catMap = new Map<string, { total: number; count: number }>();
  for (const t of expenses) {
    const existing = catMap.get(t.category) ?? { total: 0, count: 0 };
    existing.total += t.amount;
    existing.count += 1;
    catMap.set(t.category, existing);
  }
  const byCategory: CategorySummary[] = Array.from(catMap.entries())
    .map(([category, { total, count }]) => ({
      category: category as CategorySummary["category"],
      total,
      count,
      percentage: totalSpend > 0 ? (total / totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // By date
  const dateMap = new Map<string, number>();
  for (const t of expenses) {
    dateMap.set(t.date, (dateMap.get(t.date) ?? 0) + t.amount);
  }
  const byDate = Array.from(dateMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top merchant
  const merchMap = new Map<string, number>();
  for (const t of expenses) {
    merchMap.set(t.merchant, (merchMap.get(t.merchant) ?? 0) + t.amount);
  }
  let topMerchant: { name: string; total: number } | null = null;
  for (const [name, total] of merchMap.entries()) {
    if (!topMerchant || total > topMerchant.total) {
      topMerchant = { name, total };
    }
  }

  return {
    currency,
    totalSpend,
    topCategory: byCategory[0] ?? null,
    topMerchant,
    byCategory,
    byDate,
    transactions,
    rejectedCount,
  };
}

export function aggregateByWeek(
  byDate: { date: string; total: number }[]
): { date: string; total: number }[] {
  const weekMap = new Map<string, number>();
  for (const { date, total } of byDate) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day;
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    const key = weekStart.toISOString().slice(0, 10);
    weekMap.set(key, (weekMap.get(key) ?? 0) + total);
  }
  return Array.from(weekMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
