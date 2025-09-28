"use client";

import {
  BarChart3,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RevenueDataPoint = {
  date: string;
  currentYear: number;
  lastYear: number;
  roomType?: string;
  occupancy?: number;
  adr?: number;
  revpar?: number;
};

type RevenueComparisonChartProps = {
  data: RevenueDataPoint[];
  title: string;
  subtitle?: string;
  metric: "revenue" | "adr" | "occupancy" | "revpar";
  chartType?: "bar" | "line";
  className?: string;
};

export function RevenueComparisonChart({
  data,
  title,
  subtitle,
  metric = "revenue",
  chartType = "bar",
  className = "",
}: RevenueComparisonChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const formatValue = (value: number) => {
    switch (metric) {
      case "revenue":
      case "adr":
      case "revpar":
        return formatCurrency(value);
      case "occupancy":
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "revenue":
        return "Revenue";
      case "adr":
        return "Average Daily Rate";
      case "occupancy":
        return "Occupancy Rate";
      case "revpar":
        return "Revenue per Available Room";
      default:
        return "Value";
    }
  };

  const calculateTotalChange = () => {
    const currentTotal = data.reduce(
      (sum, point) => sum + point.currentYear,
      0
    );
    const lastTotal = data.reduce((sum, point) => sum + point.lastYear, 0);
    const changeValue = ((currentTotal - lastTotal) / lastTotal) * 100;
    return {
      change: changeValue,
      isPositive: changeValue >= 0,
      totalCurrent: currentTotal,
      totalLast: lastTotal,
    };
  };

  const { change, isPositive, totalCurrent, totalLast } =
    calculateTotalChange();

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current =
        payload.find((p: any) => p.dataKey === "currentYear")?.value || 0;
      const last =
        payload.find((p: any) => p.dataKey === "lastYear")?.value || 0;
      const difference = current - last;
      const percentChange = last > 0 ? (difference / last) * 100 : 0;

      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-blue-600">
              This Year:{" "}
              <span className="font-semibold">{formatValue(current)}</span>
            </p>
            <p className="text-gray-600">
              Last Year:{" "}
              <span className="font-semibold">{formatValue(last)}</span>
            </p>
            <p
              className={`font-semibold ${percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              Change: {percentChange >= 0 ? "+" : ""}
              {percentChange.toFixed(1)}% ({percentChange >= 0 ? "+" : ""}
              {formatValue(difference)})
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const InternalBarChart = () => (
    <ResponsiveContainer height={300} width="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid className="stroke-gray-200" strokeDasharray="3 3" />
        <XAxis
          className="text-gray-600"
          dataKey="date"
          fontSize={12}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <YAxis
          className="text-gray-600"
          fontSize={12}
          tickFormatter={(value) => {
            if (
              metric === "revenue" ||
              metric === "adr" ||
              metric === "revpar"
            ) {
              return `$${(value / 1000).toFixed(0)}K`;
            }
            return formatValue(value);
          }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey="currentYear"
          fill="#3b82f6"
          name="This Year"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="lastYear"
          fill="#94a3b8"
          name="Last Year"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const InternalLineChart = () => (
    <ResponsiveContainer height={300} width="100%">
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid className="stroke-gray-200" strokeDasharray="3 3" />
        <XAxis
          className="text-gray-600"
          dataKey="date"
          fontSize={12}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <YAxis
          className="text-gray-600"
          fontSize={12}
          tickFormatter={(value) => {
            if (
              metric === "revenue" ||
              metric === "adr" ||
              metric === "revpar"
            ) {
              return `$${(value / 1000).toFixed(0)}K`;
            }
            return formatValue(value);
          }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
          dataKey="currentYear"
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          name="This Year"
          stroke="#3b82f6"
          strokeWidth={3}
          type="monotone"
        />
        <Line
          dataKey="lastYear"
          dot={{ fill: "#94a3b8", strokeWidth: 2, r: 3 }}
          name="Last Year"
          stroke="#94a3b8"
          strokeDasharray="5 5"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={`w-full max-w-full ${className}`}>
      <CardHeader className="px-3 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {chartType === "bar" ? (
                <BarChart3 className="h-4 w-4 text-blue-600" />
              ) : (
                <LineChartIcon className="h-4 w-4 text-blue-600" />
              )}
              <span className="truncate">{title}</span>
            </CardTitle>
            {subtitle && (
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className="text-sm"
              variant={isPositive ? "default" : "destructive"}
            >
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </div>
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-gray-600 text-xs md:flex-row md:gap-4">
          <div>
            <span className="font-medium text-blue-600">This Year:</span>{" "}
            {formatValue(totalCurrent)}
          </div>
          <div>
            <span className="font-medium text-gray-500">Last Year:</span>{" "}
            {formatValue(totalLast)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        <Tabs className="w-full" defaultValue={chartType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger className="flex items-center gap-2" value="bar">
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="line">
              <LineChartIcon className="h-4 w-4" />
              Line Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4" value="bar">
            <InternalBarChart />
          </TabsContent>

          <TabsContent className="mt-4" value="line">
            <InternalLineChart />
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-between text-gray-500 text-xs">
          <span>Showing {getMetricLabel()} comparison vs last year</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span>This Year</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-gray-400" />
              <span>Last Year</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
