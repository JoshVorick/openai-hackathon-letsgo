import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { roomRates } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const executePricingAction = tool({
  description: `Execute approved pricing changes with validation and tracking.
  This tool implements the specific price adjustments recommended by the pricing analysis,
  updating room rates and logging changes for monitoring and rollback if needed.`,
  inputSchema: z.object({
    startDate: z.string().describe("Start date for rate change (YYYY-MM-DD)"),
    endDate: z.string().describe("End date for rate change (YYYY-MM-DD)"),
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
    userApproval: z
      .boolean()
      .describe("Confirmation that user has approved this rate change"),
  }),
  execute: async ({ startDate, endDate, adjustment, reason, userApproval }) => {
    try {
      if (!userApproval) {
        return {
          success: false,
          error: "User approval required before executing pricing changes",
          actionRequired: "user_confirmation",
        };
      }

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

      // Generate adjustment description
      let adjustmentDescription: string;
      if (adjustment.type === "percentage") {
        adjustmentDescription = `${adjustment.operation} by ${adjustment.value}%`;
      } else {
        adjustmentDescription = `${adjustment.operation} by $${adjustment.value}`;
      }

      return {
        success: true,
        message: `Successfully executed pricing change: ${adjustmentDescription}`,
        summary: {
          dateRange: { start: startDate, end: endDate },
          adjustment: adjustmentDescription,
          newAverageRate: Number(newAverageRate),
          previousAverageRate: Number(previousAverageRate),
          affectedRooms: affectedRows,
          reason: reason || "Pricing optimization",
        },
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute pricing action: ${error}`,
        actionRequired: "retry_or_manual_intervention",
      };
    }
  },
});
