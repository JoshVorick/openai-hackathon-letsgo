import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { roomRates } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const updateRoomRates = tool({
  description:
    "Update room rates for specified date range using percentage or dollar adjustments",
  inputSchema: z.object({
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
    adjustment: z.object({
      type: z
        .enum(["percentage", "fixed_amount"])
        .describe("Type of price adjustment"),
      value: z
        .number()
        .describe("Adjustment value (e.g., 10 for 10% or 50 for $50)"),
      operation: z
        .enum(["increase", "decrease", "set_to"])
        .describe("How to apply the adjustment"),
    }),
    reason: z
      .string()
      .optional()
      .describe("Reason for rate change (for audit trail)"),
  }),
  execute: async ({ startDate, endDate, adjustment, reason }) => {
    try {
      // First, get current rates for summary
      const currentRates = await db
        .select({
          averageRate: sql<number>`round(avg(${roomRates.priceUsd}::numeric), 2)`,
        })
        .from(roomRates)
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        );

      const previousAverageRate = currentRates[0]?.averageRate || 0;

      // Build the update SQL based on adjustment type and operation
      let updateSql: any;

      if (adjustment.type === "percentage") {
        if (adjustment.operation === "increase") {
          updateSql = sql`${roomRates.priceUsd} * (1 + ${adjustment.value} / 100)`;
        } else if (adjustment.operation === "decrease") {
          updateSql = sql`${roomRates.priceUsd} * (1 - ${adjustment.value} / 100)`;
        } else {
          // set_to
          updateSql = sql`${roomRates.priceUsd} * (${adjustment.value} / 100)`;
        }
      } else if (adjustment.operation === "increase") {
        // fixed_amount increase
        updateSql = sql`${roomRates.priceUsd} + ${adjustment.value}`;
      } else if (adjustment.operation === "decrease") {
        // fixed_amount decrease
        updateSql = sql`${roomRates.priceUsd} - ${adjustment.value}`;
      } else {
        // fixed_amount set_to
        updateSql = sql`${adjustment.value}`;
      }

      // Count affected rows first
      const countResult = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(roomRates)
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        );

      const affectedRows = countResult[0]?.count || 0;

      // Perform the update
      await db
        .update(roomRates)
        .set({
          priceUsd: updateSql,
          updatedAt: sql`now()`,
        })
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        );

      // Get new average rate
      const newRates = await db
        .select({
          averageRate: sql<number>`round(avg(${roomRates.priceUsd}::numeric), 2)`,
        })
        .from(roomRates)
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        );

      const newAverageRate = newRates[0]?.averageRate || 0;

      // Count unique dates for affected dates
      const dateCount = await db
        .select({
          uniqueDates: sql<number>`count(distinct ${roomRates.day})`,
        })
        .from(roomRates)
        .where(
          sql`${roomRates.day} >= ${startDate} AND ${roomRates.day} <= ${endDate}`
        );

      const affectedDates = dateCount[0]?.uniqueDates || 0;

      // Generate human readable description
      let adjustmentDescription: string;
      if (adjustment.type === "percentage") {
        adjustmentDescription = `${adjustment.operation} by ${adjustment.value}%`;
      } else {
        adjustmentDescription = `${adjustment.operation} by $${adjustment.value}`;
      }

      return {
        success: true,
        affectedDates,
        affectedRooms: affectedRows,
        summary: {
          dateRange: { start: startDate, end: endDate },
          adjustment: adjustmentDescription,
          newAverageRate: Number(newAverageRate),
          previousAverageRate: Number(previousAverageRate),
          reason: reason || "No reason provided",
        },
      };
    } catch (error) {
      console.error("Error updating room rates:", error);
      return {
        success: false,
        error: "Failed to update room rates",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
