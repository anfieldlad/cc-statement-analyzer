"use client";

import type { DashboardData } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { formatCurrency } from "@/lib/format";
import { CountUp } from "./CountUp";

interface SummaryCardsProps {
  data: DashboardData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const topCategoryColor = data.topCategory
    ? CATEGORY_COLORS[data.topCategory.category]
    : "var(--accent-primary)";
  const fmt = (n: number) => formatCurrency(n, data.currency);

  return (
    <div className="summary-grid">
      <div
        className="summary-card fade-in"
        style={{ ["--card-accent" as string]: "var(--accent-primary)" }}
      >
        <div className="summary-label">Total Spend</div>
        <div className="summary-value">
          <CountUp value={data.totalSpend} format={fmt} />
        </div>
        <div className="summary-sub">
          {data.transactions.length} transaction
          {data.transactions.length === 1 ? "" : "s"}
        </div>
      </div>

      <div
        className="summary-card fade-in"
        style={{ ["--card-accent" as string]: topCategoryColor }}
      >
        <div className="summary-label">Top Category</div>
        <div className="summary-value">
          {data.topCategory?.category ?? "—"}
        </div>
        <div className="summary-sub">
          {data.topCategory ? fmt(data.topCategory.total) : ""}
        </div>
      </div>

      <div
        className="summary-card fade-in"
        style={{ ["--card-accent" as string]: "var(--accent-success)" }}
      >
        <div className="summary-label">Top Merchant</div>
        <div
          className="summary-value"
          style={{
            fontSize: "1.5rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.topMerchant?.name ?? ""}
        >
          {data.topMerchant?.name ?? "—"}
        </div>
        <div className="summary-sub">
          {data.topMerchant ? fmt(data.topMerchant.total) : ""}
        </div>
      </div>
    </div>
  );
}
