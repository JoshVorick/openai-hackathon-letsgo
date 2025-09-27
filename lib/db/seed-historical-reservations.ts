import { config } from "dotenv";
import { eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roomRates } from "./schema";

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

function getRandomBookingDate(stayDate: Date): string {
  // Random booking date 0-90 days before stay date
  const daysBeforeStay = Math.floor(Math.random() * 91); // 0-90 days
  const bookingDate = new Date(stayDate);
  bookingDate.setDate(bookingDate.getDate() - daysBeforeStay);
  return bookingDate.toISOString().split("T")[0];
}

async function updateHistoricalReservations() {
  console.log("Updating historical reservations...");

  try {
    // Get today's date (Sep 27, 2025)
    const today = new Date("2025-09-27");
    const todayStr = today.toISOString().split("T")[0];

    console.log(`Processing dates before: ${todayStr}`);

    // Get all room rates for dates before today
    const historicalRates = await db
      .select()
      .from(roomRates)
      .where(lt(roomRates.day, todayStr));

    console.log(`Found ${historicalRates.length} historical room rate entries`);

    // Group by day to determine weekend vs weekday
    const ratesByDay = new Map<string, typeof historicalRates>();

    for (const rate of historicalRates) {
      const day = rate.day;
      if (!ratesByDay.has(day)) {
        ratesByDay.set(day, []);
      }
      ratesByDay.get(day)?.push(rate);
    }

    console.log(`Processing ${ratesByDay.size} unique days`);

    let totalUpdated = 0;
    let weekdayUpdated = 0;
    let weekendUpdated = 0;

    // Process each day
    for (const [dayStr, dayRates] of ratesByDay) {
      const stayDate = new Date(`${dayStr}T00:00:00`); // Ensure proper date parsing
      const isWeekendDay = isWeekend(stayDate);

      // Determine reservation percentage
      const reservationRate = isWeekendDay ? 0.9 : 0.6;
      const numToReserve = Math.floor(dayRates.length * reservationRate);

      // Randomly select rooms to mark as reserved
      const shuffledRates = [...dayRates].sort(() => Math.random() - 0.5);
      const ratesToUpdate = shuffledRates.slice(0, numToReserve);

      // Update each selected rate
      for (const rate of ratesToUpdate) {
        const bookingDate = getRandomBookingDate(stayDate);

        await db
          .update(roomRates)
          .set({
            status: "confirmed",
            dateBooked: bookingDate,
            updatedAt: new Date(),
          })
          .where(eq(roomRates.id, rate.id));
      }

      totalUpdated += numToReserve;
      if (isWeekendDay) {
        weekendUpdated += numToReserve;
      } else {
        weekdayUpdated += numToReserve;
      }

      if (ratesByDay.size <= 10 || totalUpdated % 1000 === 0) {
        console.log(
          `✓ ${dayStr} (${isWeekendDay ? "Weekend" : "Weekday"}): ${numToReserve}/${dayRates.length} rooms reserved (${Math.round(reservationRate * 100)}%)`
        );
      }
    }

    console.log("\n🎉 Historical reservations update completed!");
    console.log(`
Summary:
- Total days processed: ${ratesByDay.size}
- Total reservations created: ${totalUpdated}
- Weekday reservations: ${weekdayUpdated} (~60% target)
- Weekend reservations: ${weekendUpdated} (~90% target)
- Average reservation rate: ${Math.round((totalUpdated / historicalRates.length) * 100)}%
    `);
  } catch (error) {
    console.error("Error updating historical reservations:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  updateHistoricalReservations().catch((error) => {
    console.error("Historical reservations update failed:", error);
    process.exit(1);
  });
}

export { updateHistoricalReservations };
