"use client";

import type { GroupedBarChartSpec } from "@/lib/ai/chart-types";
import { cn } from "@/lib/utils";
import { GroupedBarChart } from "./grouped-bar-chart";

type OccupancySummary = {
  avgOccupancy: number;
  avgOccupancyLastYear: number | null;
  change: number | null;
  asOfDate: string;
  dateRange: string;
};

type OccupancyChartCardProps = {
  chart: GroupedBarChartSpec;
  summary: OccupancySummary;
  className?: string;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const readableFullDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatPercent = (value: number | null) =>
  value === null ? "—" : `${percentFormatter.format(value)}%`;

const formatDelta = (value: number | null) => {
  if (value === null) {
    return "—";
  }

  const formatted = percentFormatter.format(Math.abs(value));
  if (value === 0) {
    return "0 pts";
  }

  return value > 0 ? `+${formatted} pts` : `-${formatted} pts`;
};

const parseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateRange = (raw: string) => {
  const parts = raw.split(" to ");
  if (parts.length !== 2) {
    return raw;
  }

  const start = parseDate(parts[0]);
  const end = parseDate(parts[1]);

  if (!start || !end) {
    return raw;
  }

  return `${readableFullDate.format(start)} – ${readableFullDate.format(end)}`;
};

export function OccupancyChartCard({
  chart,
  summary,
  className,
}: OccupancyChartCardProps) {
  const asOfDate = parseDate(summary.asOfDate);
  const asOfLabel = asOfDate
    ? readableFullDate.format(asOfDate)
    : summary.asOfDate;

  return (
    <div className={cn("space-y-4", className)}>
      <GroupedBarChart spec={chart} />

      <div className="grid gap-4 rounded-md border border-border/70 bg-muted/30 p-4 text-sm md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Average Occupancy
          </p>
          <p className="font-semibold text-base md:text-lg">
            {formatPercent(summary.avgOccupancy)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Same Period Last Year
          </p>
          <p className="font-semibold text-base md:text-lg">
            {formatPercent(summary.avgOccupancyLastYear)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            YoY Change
          </p>
          <p
            className={cn("font-semibold text-base md:text-lg", {
              "text-emerald-600": (summary.change ?? 0) > 0,
              "text-red-600": (summary.change ?? 0) < 0,
            })}
          >
            {formatDelta(summary.change)}
          </p>
        </div>

        <div className="space-y-1 md:col-span-3">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Coverage
          </p>
          <p>
            {formatDateRange(summary.dateRange)}
            <span className="text-muted-foreground"> · As of {asOfLabel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
