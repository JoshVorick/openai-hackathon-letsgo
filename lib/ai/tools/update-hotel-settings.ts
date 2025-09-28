import { tool } from "ai";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { companySettings } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export const updateHotelSettings = tool({
  description: "Update hotel configuration and company information",
  inputSchema: z.object({
    updates: z
      .record(z.union([z.string(), z.null()]))
      .describe("Key-value pairs of fields to update"),
    reason: z.string().optional().describe("Reason for settings change"),
  }),
  execute: async ({ updates, reason }) => {
    try {
      // Get current settings first
      const currentSettings = await db.select().from(companySettings).limit(1);

      if (currentSettings.length === 0) {
        return {
          success: false,
          error: "No hotel settings found to update",
          details: "Company settings have not been configured yet",
        };
      }

      // Build update object with only valid fields
      const validFields = ["name", "address", "url", "contact", "phoneNumber"];
      const updateData: any = {
        updatedAt: sql`now()`,
      };

      const updatedFields: string[] = [];

      for (const [key, value] of Object.entries(updates)) {
        if (validFields.includes(key)) {
          updateData[key] = value;
          updatedFields.push(key);
        }
      }

      if (updatedFields.length === 0) {
        return {
          success: false,
          error: "No valid fields provided for update",
          details: `Valid fields are: ${validFields.join(", ")}`,
        };
      }

      // Perform the update
      await db.update(companySettings).set(updateData);

      // Get updated settings
      const newSettings = await db.select().from(companySettings).limit(1);

      return {
        success: true,
        updatedFields,
        currentSettings: {
          id: newSettings[0].id,
          name: newSettings[0].name,
          address: newSettings[0].address,
          url: newSettings[0].url,
          contact: newSettings[0].contact,
          phoneNumber: newSettings[0].phoneNumber,
          updatedAt: newSettings[0].updatedAt,
        },
        reason: reason || "No reason provided",
      };
    } catch (error) {
      console.error("Error updating hotel settings:", error);
      return {
        success: false,
        error: "Failed to update hotel settings",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
