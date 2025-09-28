import { tool } from "ai";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { services } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const updateRateClamps = tool({
  description: "Update rate limits (min/max prices) for specified services",
  inputSchema: z.object({
    updates: z.array(
      z.object({
        serviceName: z
          .string()
          .describe("Name of service to update (e.g., 'Base Rate')"),
        minRate: z.number().optional().describe("New minimum rate"),
        maxRate: z.number().optional().describe("New maximum rate"),
      })
    ),
    reason: z.string().optional().describe("Reason for rate clamp change"),
  }),
  execute: async ({ updates, reason }) => {
    try {
      const updatedServices: any[] = [];

      for (const update of updates) {
        // First get the current values
        const currentService = await db
          .select()
          .from(services)
          .where(eq(services.name, update.serviceName))
          .limit(1);

        if (currentService.length === 0) {
          throw new Error(`Service '${update.serviceName}' not found`);
        }

        const current = currentService[0];
        const oldClamps = {
          min: Number(current.rateLowerUsd),
          max: Number(current.rateUpperUsd),
        };

        // Build update object with only provided fields
        const updateData: any = {
          updatedAt: sql`now()`,
        };

        if (update.minRate !== undefined) {
          updateData.rateLowerUsd = update.minRate.toString();
        }
        if (update.maxRate !== undefined) {
          updateData.rateUpperUsd = update.maxRate.toString();
        }

        // Perform the update
        await db
          .update(services)
          .set(updateData)
          .where(eq(services.name, update.serviceName));

        // Get updated values for response
        const newClamps = {
          min: update.minRate !== undefined ? update.minRate : oldClamps.min,
          max: update.maxRate !== undefined ? update.maxRate : oldClamps.max,
        };

        updatedServices.push({
          serviceName: update.serviceName,
          oldClamps,
          newClamps,
        });
      }

      return {
        success: true,
        updatedServices,
        reason: reason || "No reason provided",
      };
    } catch (error) {
      console.error("Error updating rate clamps:", error);
      return {
        success: false,
        error: "Failed to update rate clamps",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
