"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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

// Hotel names and colors matching app theme
const chartConfig = {
  yourPrice: {
    label: "The Ned",
    color: "#FF922C", // App's primary orange
  },
  competitor1: {
    label: "Edition Nomad",
    color: "#8B7B6D", // App's muted brown
  },
  competitor2: {
    label: "W Union Square",
    color: "#FF6848", // App's secondary orange
  },
  competitor3: {
    label: "Ritz Carlton Nomad",
    color: "#A59281", // App's light brown
  },
  competitor4: {
    label: "Fifth Avenue Hotel",
    color: "#6F6155", // App's darker muted color
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
        className={`flex h-64 items-center justify-center text-[#8F7F71] ${className}`}
      >
        No pricing data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-center font-medium text-[#8F7F71] text-sm">
        Pricing vs. competitors
      </h2>

      <ChartContainer
        className="aspect-auto h-[250px] w-full"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: -30,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <YAxis
            axisLine={false}
            domain={[200, 500]}
            tickLine={false}
            tick={false}
          />
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

    </div>
  );
}
