import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { roomRates } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const getRoomRates = tool({
  description: "Get current room rates for specified date range",
  inputSchema: z.object({
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
  }),
  execute: async ({ startDate, endDate }) => {
    try {
      // Get rates for the date range
      const rates = await db
        .select({
          day: roomRates.day,
          averageRate: sql<number>`round(avg(${roomRates.priceUsd}::numeric), 2)`,
          minRate: sql<number>`min(${roomRates.priceUsd}::numeric)`,
          maxRate: sql<number>`max(${roomRates.priceUsd}::numeric)`,
          totalRooms: sql<number>`count(*)`,
        })
        .from(roomRates)
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        )
        .groupBy(roomRates.day)
        .orderBy(roomRates.day);

      // Calculate overall summary
      const overallAverageRate =
        rates.length > 0
          ? Math.round(
              (rates.reduce((sum, day) => sum + day.averageRate, 0) /
                rates.length) *
                100
            ) / 100
          : 0;

      return {
        rates: rates.map((rate) => ({
          date: rate.day,
          averageRate: Number(rate.averageRate),
          minRate: Number(rate.minRate),
          maxRate: Number(rate.maxRate),
          totalRooms: rate.totalRooms,
        })),
        summary: {
          overallAverageRate,
          dateRange: { start: startDate, end: endDate },
        },
      };
    } catch (error) {
      console.error("Error fetching room rates:", error);
      return {
        error: "Failed to fetch room rates",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
