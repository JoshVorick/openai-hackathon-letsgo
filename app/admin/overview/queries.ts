import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { companySettings, rooms, services } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

export async function getHotelOverview() {
  // Get company settings
  const company = await db.select().from(companySettings).limit(1);

  // Get all services
  const allServices = await db.select().from(services);

  // Get total room count
  const totalRoomsResult = await db.select({ count: count() }).from(rooms);

  return {
    company: company[0],
    services: allServices,
    totalRooms: totalRoomsResult[0].count,
  };
}

export async function getMonthlyOccupancy() {
  // Get occupancy data for each month in 2024 and 2025 up to current date
  const monthlyData = await db.execute(sql`
    WITH monthly_stats AS (
      SELECT 
        DATE_TRUNC('month', day) as month,
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as reserved_rooms
      FROM "RoomRates"
      WHERE day < '2025-09-27'
        AND day >= '2024-01-01'
      GROUP BY DATE_TRUNC('month', day)
      ORDER BY month
    )
    SELECT 
      TO_CHAR(month, 'Mon YYYY') as month,
      total_rooms,
      reserved_rooms,
      ROUND((reserved_rooms::numeric / total_rooms::numeric) * 100, 1) as occupancy_rate
    FROM monthly_stats
  `);

  return (monthlyData as any).rows.map((row: any) => ({
    month: row.month,
    totalRooms: Number.parseInt(row.total_rooms, 10),
    reservedRooms: Number.parseInt(row.reserved_rooms, 10),
    occupancyRate: Number.parseFloat(row.occupancy_rate),
  }));
}

export async function getUpcomingWeekRates() {
  // Get rates for the week of Sep 29 - Oct 5, 2025
  const startDate = "2025-09-29";
  const endDate = "2025-10-05";

  const weekData = await db.execute(sql`
    WITH daily_stats AS (
      SELECT 
        day,
        "priceUsd" as price,
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as reserved_rooms,
        COUNT(CASE WHEN status = 'empty' THEN 1 END) as available_rooms
      FROM "RoomRates"
      WHERE day >= ${startDate} AND day <= ${endDate}
      GROUP BY day, "priceUsd"
      ORDER BY day
    )
    SELECT 
      day,
      price,
      total_rooms,
      reserved_rooms,
      available_rooms,
      ROUND((reserved_rooms::numeric / total_rooms::numeric) * 100, 1) as occupancy_rate,
      TO_CHAR(day, 'Dy') as day_name
    FROM daily_stats
  `);

  return (weekData as any).rows.map((row: any) => ({
    date: row.day,
    dayName: row.day_name,
    price: Number.parseFloat(row.price),
    totalRooms: Number.parseInt(row.total_rooms, 10),
    reservedRooms: Number.parseInt(row.reserved_rooms, 10),
    availableRooms: Number.parseInt(row.available_rooms, 10),
    occupancyRate: Number.parseFloat(row.occupancy_rate),
  }));
}
