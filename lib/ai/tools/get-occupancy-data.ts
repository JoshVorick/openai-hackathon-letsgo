import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { roomRates } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

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
  }) => {
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
      };

      console.log("✅ [getOccupancyData] RESPONSE:", {
        currentRecords: currentOccupancy.length,
        comparisonRecords: comparisonOccupancy?.length || 0,
        avgOccupancy,
        avgOccupancyLastYear,
        change,
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
