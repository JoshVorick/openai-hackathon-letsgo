"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CompetitorPricePoint } from "@/lib/demo/mock-hotel";

type CompetitorPricingChartProps = {
  data: CompetitorPricePoint[];
  className?: string;
};

// Transform the data for Recharts format
function transformDataForChart(data: CompetitorPricePoint[]) {
  return data.map((point) => ({
    date: point.date,
    yourPrice: point.yourPrice,
    competitor1: point.competitor1,
    competitor2: point.competitor2,
    competitor3: point.competitor3,
    competitor4: point.competitor4,
  }));
}

// Hotel names and colors visible in dark mode
const chartConfig = {
  yourPrice: {
    label: "The Ned",
    color: "hsl(220, 70%, 50%)", // Blue
  },
  competitor1: {
    label: "Edition Nomad",
    color: "hsl(160, 60%, 45%)", // Teal
  },
  competitor2: {
    label: "W Union Square",
    color: "hsl(30, 80%, 55%)", // Orange
  },
  competitor3: {
    label: "Ritz Carlton Nomad",
    color: "hsl(280, 65%, 60%)", // Purple
  },
  competitor4: {
    label: "Fifth Avenue Hotel",
    color: "hsl(340, 75%, 55%)", // Pink
  },
} satisfies ChartConfig;

export function CompetitorPricingChart({
  data,
  className = "",
}: CompetitorPricingChartProps) {
  const chartData = useMemo(() => transformDataForChart(data), [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex h-64 items-center justify-center text-neutral-400 ${className}`}
      >
        No pricing data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-400 text-xs uppercase tracking-widest">
            Competitive Analysis
          </p>
          <h2 className="mt-1 font-semibold text-neutral-50 text-xl">
            Pricing vs. competitors (90-day outlook)
          </h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-neutral-300 text-xs">
          Daily rates
        </span>
      </div>

      <ChartContainer
        className="aspect-auto h-[250px] w-full"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="date"
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[200px] p-2"
                hideIndicator={false}
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
            }
          />
          <Line
            dataKey="yourPrice"
            dot={false}
            stroke="var(--color-yourPrice)"
            strokeWidth={3}
            type="monotone"
          />
          <Line
            dataKey="competitor1"
            dot={false}
            stroke="var(--color-competitor1)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="competitor2"
            dot={false}
            stroke="var(--color-competitor2)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="competitor3"
            dot={false}
            stroke="var(--color-competitor3)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="competitor4"
            dot={false}
            stroke="var(--color-competitor4)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>

      {/* Simple legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map(
          (key) => (
            <div className="flex items-center gap-2" key={key}>
              <div
                className="h-0.5 w-3 rounded"
                style={{ backgroundColor: `var(--color-${key})` }}
              />
              <span
                className={
                  key === "yourPrice"
                    ? "font-medium text-neutral-200"
                    : "text-neutral-400"
                }
              >
                {chartConfig[key].label}
              </span>
            </div>
          )
        )}
      </div>

      <p className="text-neutral-400 text-xs">
        The Ned pricing is shown in blue. Competitor hotel rates are displayed
        for comparison across the 90-day forward outlook.
      </p>
    </div>
  );
}
