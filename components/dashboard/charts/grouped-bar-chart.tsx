"use client";

import type { GroupedBarChartSpec } from "@/lib/ai/chart-types";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = ["#2563eb", "#f97316", "#22c55e", "#a855f7"];

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type GroupedBarChartProps = {
  spec: GroupedBarChartSpec;
  className?: string;
};

const formatValue = (
  value: number,
  formatter: GroupedBarChartSpec["valueFormatter"]
) => {
  if (!Number.isFinite(value)) {
    return "—";
  }

  switch (formatter) {
    case "percentage":
      return `${percentFormatter.format(value)}%`;
    case "currency":
      return currencyFormatter.format(value);
    case "number":
    default:
      return numberFormatter.format(value);
  }
};

const buildTicks = (
  maxValue: number,
  formatter: GroupedBarChartSpec["valueFormatter"]
) => {
  if (maxValue <= 0) {
    return [0];
  }

  const segments = 4;
  const step = maxValue / segments;

  return Array.from({ length: segments + 1 }, (_, index) => {
    const raw = step * index;
    const rounded = formatter === "percentage" ? Math.min(100, raw) : raw;
    return Math.round(rounded * 10) / 10;
  }).reverse();
};

export function GroupedBarChart({ spec, className }: GroupedBarChartProps) {
  const {
    title,
    subtitle,
    categories,
    series,
    insight,
    footnote,
    yAxisLabel,
    valueFormatter = "number",
  } = spec;

  const normalisedSeries = series.map((entry, index) => ({
    ...entry,
    color: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const allValues = normalisedSeries.flatMap((entry) =>
    entry.values.filter((value) => value !== null && value !== undefined)
  ) as number[];

  const maxValueCandidate = spec.maxValue ?? Math.max(...allValues, 0);
  const maxValue = maxValueCandidate > 0 ? maxValueCandidate : 1;
  const ticks = buildTicks(maxValue, valueFormatter);

  const layoutByCategory = (count: number) => {
    if (count >= 14) return { groupGap: 12, barMaxWidth: 12, seriesGap: 4 };
    if (count >= 10) return { groupGap: 14, barMaxWidth: 14, seriesGap: 6 };
    if (count >= 6) return { groupGap: 16, barMaxWidth: 18, seriesGap: 6 };
    return { groupGap: 20, barMaxWidth: 22, seriesGap: 8 };
  };

  const { groupGap, barMaxWidth, seriesGap } = layoutByCategory(categories.length);
  const seriesCount = normalisedSeries.length || 1;

  const computedBarWidth = Math.min(
    barMaxWidth,
    Math.max(10, Math.floor(48 / seriesCount))
  );

  const groupWidth =
    computedBarWidth * seriesCount + seriesGap * (seriesCount - 1) + 8;

  const chartHeight = 180;
  const margin = { top: 12, right: 12, bottom: 42, left: 56 };
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const svgWidth =
    margin.left +
    margin.right +
    categories.length * groupWidth +
    Math.max(0, categories.length - 1) * groupGap;

  const valueToY = (value: number) =>
    margin.top + innerHeight - (value / maxValue) * innerHeight;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h4 className="font-semibold text-sm md:text-base">{title}</h4>
        {subtitle && (
          <p className="text-muted-foreground text-xs md:text-sm">{subtitle}</p>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <svg
          aria-labelledby={`${title}-chart-title`}
          height={chartHeight}
          role="img"
          width={svgWidth}
        >
          <title id={`${title}-chart-title`}>{title}</title>

          {/* Gridlines */}
          {ticks.map((tick) => {
            const y = valueToY(tick);
            return (
              <g key={`grid-${tick}`}>
                <line
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.2}
                  x1={margin.left}
                  x2={svgWidth - margin.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="var(--muted-foreground)"
                  fontSize={10}
                  textAnchor="end"
                  x={margin.left - 8}
                  y={y + 3}
                >
                  {formatValue(tick, valueFormatter)}
                </text>
              </g>
            );
          })}

          {/* Axis label */}
          {yAxisLabel && (
            <text
              fill="var(--muted-foreground)"
              fontSize={10}
              textAnchor="middle"
              transform={`translate(${margin.left - 36}, ${
                margin.top + innerHeight / 2
              }) rotate(-90)`}
            >
              {yAxisLabel}
            </text>
          )}

          {/* Bars */}
          {categories.map((category, index) => {
            const groupX =
              margin.left +
              index * (groupWidth + groupGap) +
              (groupWidth -
                (computedBarWidth * seriesCount +
                  seriesGap * (seriesCount - 1))) /
                2;

            return (
              <g key={`group-${category}`}>
                {normalisedSeries.map((seriesEntry, seriesIndex) => {
                  const rawValue = seriesEntry.values[index];
                  if (!(typeof rawValue === "number" && Number.isFinite(rawValue))) {
                    return null;
                  }

                  const height = (rawValue / maxValue) * innerHeight;
                  const x =
                    groupX + seriesIndex * (computedBarWidth + seriesGap);
                  const y = margin.top + innerHeight - height;

                  return (
                    <rect
                      aria-label={`${seriesEntry.label} on ${category}: ${formatValue(
                        rawValue,
                        valueFormatter
                      )}`}
                      fill={seriesEntry.color}
                      height={height}
                      key={`${seriesEntry.id}-${category}`}
                      rx={2}
                      width={computedBarWidth}
                      x={x}
                      y={y}
                    />
                  );
                })}

                <text
                  fill="var(--muted-foreground)"
                  fontSize={10}
                  textAnchor="middle"
                  x={groupX + (computedBarWidth * seriesCount + seriesGap * (seriesCount - 1)) / 2}
                  y={chartHeight - 16}
                >
                  {category}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            stroke="var(--border)"
            x1={margin.left}
            x2={svgWidth - margin.right}
            y1={margin.top + innerHeight}
            y2={margin.top + innerHeight}
          />
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
        {normalisedSeries.map((entry) => (
          <span className="flex items-center gap-2" key={entry.id}>
            <span
              aria-hidden="true"
              className="size-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.label}</span>
          </span>
        ))}
      </div>

      {insight && <p className="text-sm font-medium">{insight}</p>}
      {footnote && <p className="text-muted-foreground text-xs">{footnote}</p>}

      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th>Category</th>
              {normalisedSeries.map((entry) => (
                <th key={entry.id}>{entry.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, categoryIndex) => (
              <tr key={`${category}-data`}>
                <td>{category}</td>
                {normalisedSeries.map((entry) => (
                  <td key={`${entry.id}-${category}-data`}>
                    {entry.values[categoryIndex] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
