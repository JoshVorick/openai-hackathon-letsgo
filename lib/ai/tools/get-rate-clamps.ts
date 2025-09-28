import { tool } from "ai";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { services } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const getRateClamps = tool({
  description: "Get current rate limits (min/max prices) for all services",
  inputSchema: z.object({
    serviceNames: z
      .array(z.string())
      .optional()
      .describe("Filter by specific service names"),
  }),
  execute: async ({ serviceNames }) => {
    try {
      const baseQuery = db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          minRate: services.rateLowerUsd,
          maxRate: services.rateUpperUsd,
        })
        .from(services);

      // Apply filter if service names are provided
      const rateClamps =
        serviceNames && serviceNames.length > 0
          ? await baseQuery.where(inArray(services.name, serviceNames))
          : await baseQuery;

      return {
        rateClamps: rateClamps.map((clamp) => ({
          serviceName: clamp.serviceName,
          serviceId: clamp.serviceId,
          minRate: Number(clamp.minRate),
          maxRate: Number(clamp.maxRate),
        })),
      };
    } catch (error) {
      console.error("Error fetching rate clamps:", error);
      return {
        error: "Failed to fetch rate clamps",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
