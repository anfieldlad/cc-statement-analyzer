"use client";

import type { CategorySummary, Category } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { formatCurrency } from "@/lib/format";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";

interface CategoryChartProps {
  data: CategorySummary[];
  currency: string;
  activeCategory: Category | null;
  onSelect: (category: Category | null) => void;
}

interface TooltipPayload {
  payload?: CategorySummary;
}

function ChartTooltip({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0] as TooltipPayload;
  const summary = item.payload;
  if (!summary) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{summary.category}</div>
      <div className="chart-tooltip-meta">
        {formatCurrency(summary.total, currency)} ·{" "}
        {summary.percentage.toFixed(1)}%
      </div>
    </div>
  );
}

export function CategoryChart({
  data,
  currency,
  activeCategory,
  onSelect,
}: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Category Breakdown</h3>
        </div>
        <div className="empty-state">No categorized expenses</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Category Breakdown</h3>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              animationDuration={800}
              onClick={(entry) => {
                const cat = (entry as unknown as { category: Category })
                  .category;
                onSelect(activeCategory === cat ? null : cat);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category]}
                  stroke="var(--bg-surface)"
                  strokeWidth={2}
                  opacity={
                    !activeCategory || activeCategory === entry.category
                      ? 1
                      : 0.35
                  }
                  style={{ cursor: "pointer", transition: "opacity 200ms" }}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {data.map((entry) => (
          <div
            key={entry.category}
            className="legend-item"
            data-active={activeCategory === entry.category ? "true" : "false"}
            onClick={() =>
              onSelect(
                activeCategory === entry.category ? null : entry.category
              )
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(
                  activeCategory === entry.category ? null : entry.category
                );
              }
            }}
          >
            <span
              className="legend-dot"
              style={{ backgroundColor: CATEGORY_COLORS[entry.category] }}
            />
            <span className="legend-label">{entry.category}</span>
            <span className="legend-value">
              {formatCurrency(entry.total, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
