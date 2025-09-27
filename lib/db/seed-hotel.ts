import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  companySettings,
  competitorRoomRates,
  roomRates,
  rooms,
  services,
} from "./schema";

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

async function clearHotelData() {
  console.log("Clearing existing hotel data...");

  try {
    // Delete in reverse order of dependencies
    await db.delete(competitorRoomRates);
    await db.delete(roomRates);
    await db.delete(rooms);
    await db.delete(services);
    await db.delete(companySettings);

    console.log("✓ Existing hotel data cleared");
  } catch (error) {
    console.error("Error clearing hotel data:", error);
    throw error;
  }
}

async function seedHotelData() {
  console.log("Seeding hotel data...");

  try {
    // Clear existing data first
    await clearHotelData();
    // 1. Insert company settings
    const [company] = await db
      .insert(companySettings)
      .values({
        name: "The Ned",
        address: "1170 Broadway, New York, NY 10001",
        url: "https://www.thened.com/nomad?utm_source=google&utm_medium=local&utm_campaign=hotel-the-ned-nomad",
        contact: "info@thened.com",
        phoneNumber: "+1-212-555-0123",
      })
      .returning();

    console.log("✓ Company settings created:", company.name);

    // 2. Insert services (room types) - just base rate for now
    const serviceData = [
      {
        name: "Base Rate",
        type: "room",
        rateLowerUsd: "100.00",
        rateUpperUsd: "750.00",
      },
    ];

    const insertedServices = await db
      .insert(services)
      .values(serviceData)
      .returning();

    console.log(`✓ ${insertedServices.length} services created`);

    // 3. Insert 50 base rate rooms
    const roomsData: any[] = [];
    const service = insertedServices[0]; // Only one service now

    for (let i = 1; i <= 50; i++) {
      const floor = Math.floor((i - 1) / 10) + 1; // 10 rooms per floor, starting floor 1
      const roomOnFloor = ((i - 1) % 10) + 1; // Room 1-10 on each floor
      const roomNum =
        floor.toString().padStart(2, "0") +
        roomOnFloor.toString().padStart(2, "0");

      roomsData.push({
        serviceId: service.id,
        name: `Room ${roomNum}`,
        roomNumber: roomNum,
      });
    }

    const insertedRooms = await db.insert(rooms).values(roomsData).returning();
    console.log(`✓ ${insertedRooms.length} rooms created`);

    console.log("\n🎉 Hotel data seeding completed successfully!");
    console.log(`
Summary:
- Company: ${company.name}
- Services: ${insertedServices.length} (Base Rate)
- Rooms: ${insertedRooms.length} (50 base rate rooms)
- Room rates: Ready for manual setup
- Competitor rates: Ready for manual setup
    `);
  } catch (error) {
    console.error("Error seeding hotel data:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedHotelData().catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export { seedHotelData };
