import { tool } from "ai";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { companySettings } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

// Function to get coordinates from address using a geocoding service
function getCoordinatesFromAddress(
  address: string
): Promise<{ latitude: number; longitude: number }> {
  // For demo purposes, using The Ned NoMad coordinates
  // In a real app, you'd use a geocoding API like Google Maps or OpenCage
  return {
    latitude: 40.7455, // The Ned NoMad NYC coordinates
    longitude: -73.9883,
  };
}

export const getWeather = tool({
  description:
    "Get current weather and historical comparison for the hotel location",
  inputSchema: z.object({
    includeHistorical: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include weather from same day last year"),
    daysBack: z
      .number()
      .optional()
      .default(365)
      .describe("How many days back for historical data"),
  }),
  execute: async ({ includeHistorical = true, daysBack = 365 }) => {
    try {
      // Get hotel settings to get the address
      const settings = await db.select().from(companySettings).limit(1);

      if (settings.length === 0) {
        return {
          error: "Hotel settings not found",
          details: "Cannot determine hotel location for weather data",
        };
      }

      const hotelAddress = settings[0].address;
      const coordinates = await getCoordinatesFromAddress(hotelAddress);

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Get current weather
      const currentResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      const currentWeather = await currentResponse.json();

      let historicalWeather: any = null;

      if (includeHistorical) {
        // Calculate historical date
        const historicalDate = new Date(today);
        historicalDate.setDate(historicalDate.getDate() - daysBack);
        const historicalDateStr = historicalDate.toISOString().split("T")[0];

        // Get historical weather
        const historicalResponse = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&start_date=${historicalDateStr}&end_date=${historicalDateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
        );

        historicalWeather = await historicalResponse.json();
      }

      return {
        location: {
          address: hotelAddress,
          coordinates,
        },
        current: {
          date: todayStr,
          temperature: currentWeather.current?.temperature_2m,
          temperatureMax: currentWeather.daily?.temperature_2m_max?.[0],
          temperatureMin: currentWeather.daily?.temperature_2m_min?.[0],
          weatherCode: currentWeather.current?.weather_code,
          windSpeed: currentWeather.current?.wind_speed_10m,
        },
        historical: historicalWeather
          ? {
              date: historicalWeather.daily?.time?.[0],
              temperatureMax: historicalWeather.daily?.temperature_2m_max?.[0],
              temperatureMin: historicalWeather.daily?.temperature_2m_min?.[0],
              weatherCode: historicalWeather.daily?.weather_code?.[0],
            }
          : null,
        comparison:
          historicalWeather && currentWeather.daily
            ? {
                temperatureMaxChange:
                  (currentWeather.daily.temperature_2m_max?.[0] || 0) -
                  (historicalWeather.daily?.temperature_2m_max?.[0] || 0),
                temperatureMinChange:
                  (currentWeather.daily.temperature_2m_min?.[0] || 0) -
                  (historicalWeather.daily?.temperature_2m_min?.[0] || 0),
              }
            : null,
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return {
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
