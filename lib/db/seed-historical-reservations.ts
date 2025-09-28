import { config } from "dotenv";
import { eq } from "drizzle-orm";
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

function getBookingRate(stayDate: Date, today: Date): number {
  const daysDifference = Math.floor(
    (stayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isWeekendDay = isWeekend(stayDate);

  // Historical dates (past)
  if (daysDifference < 0) {
    return isWeekendDay ? 0.9 : 0.6; // 90% weekend, 60% weekday
  }

  // Future dates - decreasing rates
  if (daysDifference <= 7) {
    // Sept 27 - Oct 4: 50% base rate
    return isWeekendDay ? 0.6 : 0.5; // Weekend boost still applies
  }
  if (daysDifference <= 31) {
    // Rest of October: 20% base rate
    return isWeekendDay ? 0.3 : 0.2;
  }
  if (daysDifference <= 90) {
    // November-December: 10% base rate
    return isWeekendDay ? 0.15 : 0.1;
  }
  // Far future: 5% base rate
  return isWeekendDay ? 0.08 : 0.05;
}

function getRandomBookingDate(stayDate: Date, today: Date): string {
  const daysDifference = Math.floor(
    (stayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference < 0) {
    // Historical: booking was 0-90 days before stay date
    const daysBeforeStay = Math.floor(Math.random() * 91); // 0-90 days
    const bookingDate = new Date(stayDate);
    bookingDate.setDate(bookingDate.getDate() - daysBeforeStay);
    return bookingDate.toISOString().split("T")[0];
  }
  // Future: booking is today or recent days (more realistic for future bookings)
  const daysBack = Math.min(Math.floor(Math.random() * 14), daysDifference); // 0-14 days back, but not future
  const bookingDate = new Date(today);
  bookingDate.setDate(bookingDate.getDate() - daysBack);
  return bookingDate.toISOString().split("T")[0];
}

async function updateHistoricalReservations() {
  console.log("Updating reservations (historical and future)...");

  try {
    // Get today's date (Sep 27, 2025)
    const today = new Date("2025-09-27");
    const todayStr = today.toISOString().split("T")[0];

    console.log(`Processing all dates from: ${todayStr}`);

    // Get all room rates (both past and future)
    const allRates = await db.select().from(roomRates);

    console.log(`Found ${allRates.length} total room rate entries`);

    // Group by day to determine weekend vs weekday
    const ratesByDay = new Map<string, typeof allRates>();

    for (const rate of allRates) {
      const day = rate.day;
      if (!ratesByDay.has(day)) {
        ratesByDay.set(day, []);
      }
      ratesByDay.get(day)?.push(rate);
    }

    console.log(`Processing ${ratesByDay.size} unique days`);

    let totalUpdated = 0;
    let historicalUpdated = 0;
    let futureUpdated = 0;
    let weekdayUpdated = 0;
    let weekendUpdated = 0;

    // Process each day
    for (const [dayStr, dayRates] of ratesByDay) {
      const stayDate = new Date(`${dayStr}T00:00:00`); // Ensure proper date parsing
      const isWeekendDay = isWeekend(stayDate);
      const daysDifference = Math.floor(
        (stayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get dynamic reservation rate based on date
      const reservationRate = getBookingRate(stayDate, today);
      const numToReserve = Math.floor(dayRates.length * reservationRate);

      // Randomly select rooms to mark as reserved
      const shuffledRates = [...dayRates].sort(() => Math.random() - 0.5);
      const ratesToUpdate = shuffledRates.slice(0, numToReserve);

      // Update each selected rate
      for (const rate of ratesToUpdate) {
        const bookingDate = getRandomBookingDate(stayDate, today);

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
      if (daysDifference < 0) {
        historicalUpdated += numToReserve;
      } else {
        futureUpdated += numToReserve;
      }

      if (isWeekendDay) {
        weekendUpdated += numToReserve;
      } else {
        weekdayUpdated += numToReserve;
      }

      // Log progress for key dates or every 1000 updates
      if (
        ratesByDay.size <= 20 ||
        totalUpdated % 1000 === 0 ||
        (daysDifference >= 0 && daysDifference <= 40)
      ) {
        const dateType =
          daysDifference < 0 ? "Historical" : `Future (+${daysDifference}d)`;
        console.log(
          `✓ ${dayStr} ${dateType} (${isWeekendDay ? "Weekend" : "Weekday"}): ${numToReserve}/${dayRates.length} rooms reserved (${Math.round(reservationRate * 100)}%)`
        );
      }
    }

    console.log("\n🎉 Reservations update completed!");
    console.log(`
Summary:
- Total days processed: ${ratesByDay.size}
- Total reservations created: ${totalUpdated}
- Historical reservations: ${historicalUpdated}
- Future reservations: ${futureUpdated}
- Weekday reservations: ${weekdayUpdated}
- Weekend reservations: ${weekendUpdated}
- Average reservation rate: ${Math.round((totalUpdated / allRates.length) * 100)}%
    `);
  } catch (error) {
    console.error("Error updating reservations:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  updateHistoricalReservations().catch((error) => {
    console.error("Reservations update failed:", error);
    process.exit(1);
  });
}

export { updateHistoricalReservations };
