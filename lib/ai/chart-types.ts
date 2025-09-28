export type ChartValueFormatter = "percentage" | "currency" | "number";

export type GroupedBarChartSeries = {
  id: string;
  label: string;
  values: Array<number | null>;
  color?: string;
};

export type GroupedBarChartSpec = {
  kind: "grouped-bar";
  title: string;
  subtitle?: string;
  categories: string[];
  series: GroupedBarChartSeries[];
  yAxisLabel?: string;
  valueFormatter?: ChartValueFormatter;
  maxValue?: number;
  insight?: string;
  footnote?: string;
};

export type InsightChartSpec = GroupedBarChartSpec;
