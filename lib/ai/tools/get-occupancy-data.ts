import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import type { GroupedBarChartSpec } from "@/lib/ai/chart-types";
import { roomRates } from "@/lib/db/schema";

export type OccupancyDay = {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
};

export type OccupancyDataSummary = {
  avgOccupancy: number;
  avgOccupancyLastYear: number | null;
  change: number | null;
  asOfDate: string;
  dateRange: string;
};

export type OccupancyDataSuccess = {
  current: OccupancyDay[];
  comparison: OccupancyDay[] | null;
  summary: OccupancyDataSummary;
  chart?: GroupedBarChartSpec;
};

export type OccupancyDataError = {
  error: string;
  details?: string;
  availableRange?: { start: string; end: string };
};

export type OccupancyDataResponse = OccupancyDataSuccess | OccupancyDataError;

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

const readableDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const readableWeekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const readableFullDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

// Helper function to get occupancy data for a date range
async function getOccupancyForDateRange(
  startDate: string,
  endDate: string,
  asOfDate: string
) {
  console.log("🔍 [getOccupancyForDateRange] Query:", {
    startDate,
    endDate,
    asOfDate,
  });

  const results = await db
    .select({
      day: roomRates.day,
      totalRooms: sql<number>`count(*)`,
      confirmedRooms: sql<number>`count(case when ${roomRates.status} = 'confirmed' and (${roomRates.dateBooked} is null or ${roomRates.dateBooked} <= ${asOfDate}) then 1 end)`,
      occupancyRate: sql<number>`round(
        count(case when ${roomRates.status} = 'confirmed' and (${roomRates.dateBooked} is null or ${roomRates.dateBooked} <= ${asOfDate}) then 1 end) * 100.0 / count(*),
        2
      )`,
    })
    .from(roomRates)
    .where(
      sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
    )
    .groupBy(roomRates.day)
    .orderBy(roomRates.day);

  console.log("📊 [getOccupancyForDateRange] Results:", {
    rowCount: results.length,
    dateRange: `${startDate} to ${endDate}`,
    asOfDate,
    sampleData: results.slice(0, 3),
  });

  return results.map((row) => ({
    date: row.day,
    totalRooms: Number(row.totalRooms),
    occupiedRooms: Number(row.confirmedRooms),
    occupancyRate: Number(row.occupancyRate),
  }));
}

export const getOccupancyData = tool({
  description:
    "Get hotel occupancy rates for date range with year-over-year comparison 'as of' today. DATA AVAILABLE: 2024-01-01 to 2026-03-12 only. Use dates within this range.",
  inputSchema: z.object({
    startDate: z
      .string()
      .describe(
        "Start date in YYYY-MM-DD format (must be 2024-01-01 or later)"
      ),
    endDate: z
      .string()
      .describe(
        "End date in YYYY-MM-DD format (must be 2026-03-12 or earlier)"
      ),
    includeYoYComparison: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include same period last year comparison"),
    asOfDate: z
      .string()
      .optional()
      .describe(
        "Only count bookings made before this date (defaults to today)"
      ),
  }),
  execute: async ({
    startDate,
    endDate,
    includeYoYComparison = true,
    asOfDate,
  }): Promise<OccupancyDataResponse> => {
    try {
      const today = asOfDate || new Date().toISOString().split("T")[0];

      console.log("🚀 [getOccupancyData] API CALL:", {
        startDate,
        endDate,
        includeYoYComparison,
        asOfDate: today,
        timestamp: new Date().toISOString(),
      });

      // Validate date range - our data is only available from 2024-01-01 to 2026-03-12
      const dataStart = new Date("2024-01-01");
      const dataEnd = new Date("2026-03-12");
      const reqStart = new Date(startDate);
      const reqEnd = new Date(endDate);

      if (reqStart < dataStart || reqEnd > dataEnd) {
        console.log("❌ [getOccupancyData] DATE RANGE ERROR");
        return {
          error: "Date range outside available data",
          details: `Requested dates ${startDate} to ${endDate} are outside our data range (2024-01-01 to 2026-03-12).`,
          availableRange: { start: "2024-01-01", end: "2026-03-12" },
        };
      }

      // Get current period occupancy
      const currentOccupancy = await getOccupancyForDateRange(
        startDate,
        endDate,
        today
      );

      let comparisonOccupancy: typeof currentOccupancy | null = null;
      if (includeYoYComparison) {
        // Calculate same period last year
        const startLastYear = new Date(startDate);
        startLastYear.setFullYear(startLastYear.getFullYear() - 1);
        const endLastYear = new Date(endDate);
        endLastYear.setFullYear(endLastYear.getFullYear() - 1);
        const asOfLastYear = new Date(today);
        asOfLastYear.setFullYear(asOfLastYear.getFullYear() - 1);

        const startLastYearStr = startLastYear.toISOString().split("T")[0];
        const endLastYearStr = endLastYear.toISOString().split("T")[0];
        const asOfLastYearStr = asOfLastYear.toISOString().split("T")[0];

        console.log("📅 [getOccupancyData] YoY Comparison:", {
          currentPeriod: `${startDate} to ${endDate}`,
          historicalPeriod: `${startLastYearStr} to ${endLastYearStr}`,
          asOfDate: asOfLastYearStr,
        });

        // Check if historical dates are within our data range
        if (
          new Date(startLastYearStr) >= dataStart &&
          new Date(endLastYearStr) <= dataEnd
        ) {
          comparisonOccupancy = await getOccupancyForDateRange(
            startLastYearStr,
            endLastYearStr,
            asOfLastYearStr
          );
        } else {
          console.log(
            "⚠️ [getOccupancyData] Historical dates outside data range, skipping YoY comparison"
          );
        }
      }

      // Calculate summary statistics
      const avgOccupancy =
        currentOccupancy.length > 0
          ? Math.round(
              (currentOccupancy.reduce(
                (sum, day) => sum + day.occupancyRate,
                0
              ) /
                currentOccupancy.length) *
                100
            ) / 100
          : 0;

      const avgOccupancyLastYear =
        comparisonOccupancy && comparisonOccupancy.length > 0
          ? Math.round(
              (comparisonOccupancy.reduce(
                (sum, day) => sum + day.occupancyRate,
                0
              ) /
                comparisonOccupancy.length) *
                100
            ) / 100
          : null;

      const change =
        avgOccupancyLastYear !== null
          ? Math.round((avgOccupancy - avgOccupancyLastYear) * 100) / 100
          : null;

      let chart: GroupedBarChartSpec | undefined;

      if (currentOccupancy.length > 0) {
        const comparisonLookup = new Map<string, OccupancyDay>();
        if (comparisonOccupancy) {
          for (const day of comparisonOccupancy) {
            const dateObj = new Date(day.date);
            const key = `${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
            comparisonLookup.set(key, day);
          }
        }

        const categories = currentOccupancy.map(({ date }) => {
          const dateObj = new Date(date);
          return `${readableWeekday.format(dateObj)} ${readableDate.format(dateObj)}`;
        });

        const currentYear = new Date(currentOccupancy[0].date).getFullYear();
        const currentSeriesValues = currentOccupancy.map((day) =>
          Number.isFinite(day.occupancyRate) ? Number(day.occupancyRate) : null
        );

        const currentColor = "#2563eb"; // blue-600
        const comparisonColor = "#f97316"; // orange-500

        const series: GroupedBarChartSpec["series"] = [
          {
            id: `current-${currentYear}`,
            label: `${currentYear} occupancy`,
            values: currentSeriesValues,
            color: currentColor,
          },
        ];

        if (comparisonOccupancy && comparisonOccupancy.length > 0) {
          const comparisonYear = new Date(
            comparisonOccupancy[0].date
          ).getFullYear();

          const comparisonSeriesValues = currentOccupancy.map((day) => {
            const dayObj = new Date(day.date);
            const key = `${dayObj.getMonth() + 1}-${dayObj.getDate()}`;
            const match = comparisonLookup.get(key);
            return match && Number.isFinite(match.occupancyRate)
              ? Number(match.occupancyRate)
              : null;
          });

          series.push({
            id: `comparison-${comparisonYear}`,
            label: `${comparisonYear} occupancy`,
            values: comparisonSeriesValues,
            color: comparisonColor,
          });
        }

        const asOfDisplay = readableFullDate.format(new Date(today));
        const changeInsight = (() => {
          if (change === null) {
            return;
          }
          if (change === 0) {
            return "Occupancy is flat versus last year.";
          }

          const magnitude = percentFormatter.format(Math.abs(change));
          return change > 0
            ? `Occupancy is up ${magnitude} pts vs last year.`
            : `Occupancy is down ${magnitude} pts vs last year.`;
        })();

        chart = {
          kind: "grouped-bar",
          title: "Upcoming occupancy vs last year",
          subtitle: `As of ${asOfDisplay}`,
          categories,
          series,
          yAxisLabel: "Occupancy (%)",
          valueFormatter: "percentage",
          maxValue: 100,
          insight: changeInsight,
          footnote:
            comparisonOccupancy && comparisonOccupancy.length > 0
              ? undefined
              : "Year-over-year comparison unavailable for this range.",
        } satisfies GroupedBarChartSpec;
      }

      const result = {
        current: currentOccupancy,
        comparison: comparisonOccupancy,
        summary: {
          avgOccupancy,
          avgOccupancyLastYear,
          change,
          asOfDate: today,
          dateRange: `${startDate} to ${endDate}`,
        },
        chart,
      };

      console.log("✅ [getOccupancyData] RESPONSE:", {
        currentRecords: currentOccupancy.length,
        comparisonRecords: comparisonOccupancy?.length || 0,
        avgOccupancy,
        avgOccupancyLastYear,
        change,
        hasChart: Boolean(chart),
      });

      return result;
    } catch (error) {
      console.error("❌ [getOccupancyData] ERROR:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        error: "Failed to fetch occupancy data",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
