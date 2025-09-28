import { tool } from "ai";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { services, type ServiceClamp } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const updateServiceClamp = tool({
  description:
    "Update the clamp metadata for a given service, typically used to tighten or loosen weekend restrictions.",
  inputSchema: z.object({
    serviceName: z
      .string()
      .describe("Name of the service whose clamp configuration should be updated."),
    clamp: z
      .object({
        target: z
          .enum(["weekend", "weekday", "all"])
          .describe("Which segment of the stay pattern this clamp targets."),
        minRate: z
          .number()
          .optional()
          .describe("Optional minimum rate threshold to enforce."),
        maxRate: z
          .number()
          .optional()
          .describe("Optional maximum rate threshold to enforce."),
        direction: z
          .enum(["tighten", "loosen"])
          .describe("Whether to tighten (raise floors) or loosen (lower floors) the clamp."),
        notes: z
          .string()
          .optional()
          .describe("Human-readable notes that explain the intent of the clamp."),
      })
      .describe("The clamp payload to persist."),
    reason: z
      .string()
      .optional()
      .describe("Why the clamp is changing, used for logging and audit trails."),
  }),
  execute: async ({ serviceName, clamp, reason }) => {
    try {
      const [existing] = await db
        .select({
          id: services.id,
          currentClamp: services.clamp,
        })
        .from(services)
        .where(eq(services.name, serviceName))
        .limit(1);

      if (!existing) {
        throw new Error(`Service '${serviceName}' not found`);
      }

      const updatedClamp: ServiceClamp = {
        ...clamp,
      };

      await db
        .update(services)
        .set({
          clamp: updatedClamp,
          updatedAt: sql`now()`,
        })
        .where(eq(services.id, existing.id));

      return {
        success: true,
        serviceId: existing.id,
        previousClamp: existing.currentClamp,
        newClamp: updatedClamp,
        reason: reason ?? "No reason supplied",
      };
    } catch (error) {
      console.error("Error updating service clamp:", error);
      return {
        success: false,
        error: "Failed to update service clamp",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
