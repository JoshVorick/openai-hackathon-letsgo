import { tool } from "ai";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { companySettings } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const getHotelSettings = tool({
  description: "Get hotel configuration and company information",
  inputSchema: z.object({
    fields: z
      .array(z.string())
      .optional()
      .describe("Specific fields to retrieve"),
  }),
  execute: async ({ fields }) => {
    try {
      // Get the company settings (assuming there's only one company record)
      const settings = await db.select().from(companySettings).limit(1);

      if (settings.length === 0) {
        return {
          error: "No hotel settings found",
          details: "Company settings have not been configured yet",
        };
      }

      const hotelSettings = settings[0];

      // If specific fields are requested, filter the response
      if (fields && fields.length > 0) {
        const filteredSettings: any = {};
        for (const field of fields) {
          if (field in hotelSettings) {
            filteredSettings[field] = (hotelSettings as any)[field];
          }
        }
        return filteredSettings;
      }

      // Return all settings (excluding internal fields)
      return {
        id: hotelSettings.id,
        name: hotelSettings.name,
        address: hotelSettings.address,
        url: hotelSettings.url,
        contact: hotelSettings.contact,
        phoneNumber: hotelSettings.phoneNumber,
        createdAt: hotelSettings.createdAt,
        updatedAt: hotelSettings.updatedAt,
      };
    } catch (error) {
      console.error("Error fetching hotel settings:", error);
      return {
        error: "Failed to fetch hotel settings",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
