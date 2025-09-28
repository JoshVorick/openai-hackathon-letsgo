import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roomRates } from "./schema";

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

async function seedRealisticBookings() {
  console.log("Adding realistic booking patterns...");

  try {
    // Get date range for recent months (more realistic for testing)
    const startDate = "2024-09-01";
    const endDate = "2024-12-31";

    console.log(`Creating bookings for ${startDate} to ${endDate}`);

    // Create realistic occupancy patterns:
    // - Weekends: 75-85% occupancy
    // - Weekdays: 55-65% occupancy
    // - Holiday periods: 90%+ occupancy

    const updates: Array<{ date: string; occupancyRate: number }> = [];
    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      let occupancyRate: number;
      // Weekend (Friday, Saturday, Sunday)
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        occupancyRate = 0.75 + Math.random() * 0.1; // 75-85%
      } else {
        occupancyRate = 0.55 + Math.random() * 0.1; // 55-65%
      }

      // Holiday boosts (simplified)
      const isHolidayPeriod =
        (currentDate.getMonth() === 10 && currentDate.getDate() > 20) || // Late November
        currentDate.getMonth() === 11 || // December
        (currentDate.getMonth() === 0 && currentDate.getDate() < 8); // Early January

      if (isHolidayPeriod) {
        occupancyRate = Math.min(0.95, occupancyRate + 0.15);
      }

      updates.push({
        date: dateStr,
        occupancyRate,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Processing ${updates.length} days of bookings...`);

    // Update room rates to "confirmed" based on occupancy patterns
    let totalUpdated = 0;

    for (const { date, occupancyRate } of updates) {
      // Get all rooms for this date
      const roomsForDate = await db
        .select()
        .from(roomRates)
        .where(eq(roomRates.day, date));

      if (roomsForDate.length === 0) {
        continue;
      }

      // Calculate how many rooms to mark as confirmed
      const roomsToBook = Math.floor(roomsForDate.length * occupancyRate);

      // Randomly select rooms to mark as confirmed
      const shuffled = [...roomsForDate].sort(() => Math.random() - 0.5);
      const roomsToUpdate = shuffled.slice(0, roomsToBook);

      if (roomsToUpdate.length > 0) {
        // Update selected rooms to confirmed status
        for (const room of roomsToUpdate) {
          await db
            .update(roomRates)
            .set({
              status: "confirmed",
              dateBooked: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0], // Booked 0-30 days ago
            })
            .where(eq(roomRates.id, room.id));
        }

        totalUpdated += roomsToUpdate.length;
      }

      if (updates.indexOf({ date, occupancyRate }) % 10 === 0) {
        console.log(
          `✓ Processed ${date} - ${Math.round(occupancyRate * 100)}% occupancy (${roomsToBook}/${roomsForDate.length} rooms)`
        );
      }
    }

    console.log("\n🎉 Realistic booking data created successfully!");
    console.log(`Total rooms marked as confirmed: ${totalUpdated}`);
  } catch (error) {
    console.error("Error seeding bookings:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedRealisticBookings().catch((error) => {
    console.error("Booking seeding failed:", error);
    process.exit(1);
  });
}

export { seedRealisticBookings };
