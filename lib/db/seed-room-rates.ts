import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roomRates, rooms, services } from "./schema";

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

function parseNewTsvFormat(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("TSV file must have at least a header and one data row");
  }

  // Parse header - expects "Date\tThe Ned NoMad"
  const headerLine = lines[0];
  const headerParts = headerLine.split("\t");

  if (headerParts.length !== 2 || headerParts[0] !== "Date") {
    throw new Error("Header must be 'Date\\tThe Ned NoMad'");
  }

  const hotelName = headerParts[1];
  console.log(`Hotel: ${hotelName}`);

  // Parse data rows
  const ratePairs: Array<{ date: string; price: number }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue; // Skip empty lines
    }

    const parts = line.split("\t");
    if (parts.length !== 2) {
      console.warn(`Skipping malformed line ${i}: ${line}`);
      continue;
    }

    const dateStr = parts[0];
    const priceStr = parts[1];

    // Convert M/D/YYYY to YYYY-MM-DD format
    const [month, day, year] = dateStr.split("/");
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    const price = Number.parseFloat(priceStr);
    if (Number.isNaN(price)) {
      console.warn(`Skipping invalid price on line ${i}: ${priceStr}`);
      continue;
    }

    ratePairs.push({
      date: formattedDate,
      price,
    });
  }

  console.log(`Parsed ${ratePairs.length} rate entries from TSV`);
  return ratePairs;
}

async function seedRoomRates() {
  console.log("Seeding room rates...");

  try {
    // Parse the new TSV format
    const tsvPath = join(__dirname, "room-rates-new.tsv");
    const ratePairs = parseNewTsvFormat(tsvPath);
    console.log(`Parsed ${ratePairs.length} rate entries`);

    // Get all rooms and the base rate service
    const allRooms = await db.select().from(rooms);
    const baseService = await db
      .select()
      .from(services)
      .where(eq(services.name, "Base Rate"));

    if (baseService.length === 0) {
      throw new Error("Base Rate service not found");
    }

    console.log(`Found ${allRooms.length} rooms to populate with rates`);

    // Clear existing room rates first
    await db.delete(roomRates);
    console.log("✓ Existing room rates cleared");

    // Create room rates for each room and each date
    const roomRateEntries: any[] = [];

    for (const room of allRooms) {
      for (const ratePair of ratePairs) {
        roomRateEntries.push({
          day: ratePair.date,
          roomId: room.id,
          serviceId: room.serviceId,
          status: "empty" as const, // Default to empty
          priceUsd: ratePair.price.toFixed(2),
        });
      }
    }

    console.log(`Creating ${roomRateEntries.length} room rate entries...`);

    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < roomRateEntries.length; i += batchSize) {
      const batch = roomRateEntries.slice(i, i + batchSize);
      await db.insert(roomRates).values(batch);
      totalInserted += batch.length;
      console.log(
        `✓ Inserted batch: ${totalInserted}/${roomRateEntries.length} entries`
      );
    }

    console.log("\n🎉 Room rates seeding completed successfully!");
    console.log(`
Summary:
- Total rooms: ${allRooms.length}
- Date range: ${ratePairs[0].date} to ${ratePairs.at(-1)?.date}
- Total entries: ${totalInserted}
- Price range: $${Math.min(...ratePairs.map((r) => r.price))} - $${Math.max(...ratePairs.map((r) => r.price))}
    `);
  } catch (error) {
    console.error("Error seeding room rates:", error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedRoomRates().catch((error) => {
    console.error("Room rates seeding failed:", error);
    process.exit(1);
  });
}

export { seedRoomRates };
