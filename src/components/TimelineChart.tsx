"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { aggregateByWeek } from "@/lib/aggregator";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateShort,
} from "@/lib/format";

interface TimelineChartProps {
  byDate: { date: string; total: number }[];
  currency: string;
}

interface TooltipPayload {
  payload?: { date: string; total: number };
}

function ChartTooltip({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0] as TooltipPayload;
  if (!item.payload) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">
        {formatDateShort(item.payload.date)}
      </div>
      <div className="chart-tooltip-meta">
        {formatCurrency(item.payload.total, currency)}
      </div>
    </div>
  );
}

export function TimelineChart({ byDate, currency }: TimelineChartProps) {
  const [view, setView] = useState<"daily" | "weekly">("weekly");

  const data = useMemo(
    () => (view === "weekly" ? aggregateByWeek(byDate) : byDate),
    [byDate, view]
  );

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Spending Over Time</h3>
        </div>
        <div className="empty-state">No timeline data</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Spending Over Time</h3>
        <div className="chart-toggle" role="tablist">
          <button
            type="button"
            data-active={view === "daily"}
            onClick={() => setView("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            data-active={view === "weekly"}
            onClick={() => setView("weekly")}
          >
            Weekly
          </button>
        </div>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrencyCompact(v, currency)}
            />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
              cursor={{ fill: "var(--bg-elevated)" }}
            />
            <Bar
              dataKey="total"
              fill="var(--accent-primary)"
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
