import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  companySettings,
  competitorRoomRates,
  opportunities,
  opportunityArtifacts,
  opportunityDeployments,
  roomRates,
  rooms,
  services,
  type ServiceClamp,
} from "./schema";

type RoomInsert = typeof rooms.$inferInsert;

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL || "");
const db = drizzle(client);

async function clearHotelData() {
  console.log("Clearing existing hotel data...");

  try {
    // Delete in reverse order of dependencies
    await db.delete(opportunityDeployments);
    await db.delete(opportunityArtifacts);
    await db.delete(opportunities);
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
        clamp: {
          target: "weekend",
          minRate: 100,
          maxRate: 750,
          direction: "tighten",
          notes: "Initial baseline clamp before AI adjustments.",
        } as ServiceClamp,
      },
    ];

    const insertedServices = await db
      .insert(services)
      .values(serviceData)
      .returning();

    console.log(`✓ ${insertedServices.length} services created`);

    // 3. Insert 50 base rate rooms
    const roomsData: RoomInsert[] = [];
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

    // 4. Seed default opportunity with artifact + deployment placeholders
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 6); // next Friday-ish
    const eventEndDate = new Date(
      targetDate.getTime() + 2 * 24 * 60 * 60 * 1000
    );
    const targetDateISO = targetDate.toISOString().slice(0, 10);
    const eventEndISO = eventEndDate.toISOString().slice(0, 10);

    const [opportunity] = await db
      .insert(opportunities)
      .values({
        slug: "hackathon-event",
        title: "Attract hackathon attendees",
        summary:
          "Nearby GPT-5 Codex hackathon attendees need last-minute rooms.",
        description:
          "Next Friday is pacing below last year. I've drafted a landing page and campaign that targets the OpenAI hackathon crowd with a 10% promo code.",
        type: "event",
        status: "pending_review",
        confidence: "0.78",
        targetDate: targetDateISO,
        metadata: {
          opportunitySource: "external_event",
          eventName: "GPT-5 Codex Hackathon",
          eventVenue: "OpenAI HQ, New York",
          eventWindow: {
            start: targetDateISO,
            end: eventEndISO,
          },
          focusMetric: {
            name: "Occupancy vs LY",
            current: 0.61,
            lastYear: 0.74,
          },
        },
      })
      .returning();

    const [artifact] = await db
      .insert(opportunityArtifacts)
      .values({
        opportunityId: opportunity.id,
        type: "landing_page",
        title: "Hackathon landing page draft",
        description:
          "Targeted campaign page inviting hackathon guests with a 10% promo code.",
        previewUrl: "https://preview.vercel.sh/hackathon-event",
        metadata: {
          promoCode: "HACKATHON",
          expiration: "2025-09-28",
          branch: "feature/hackathon-landing",
        },
        content: {
          heroHeadline: "Stay steps from the GPT-5 Codex Hackathon",
          promoCode: "HACKATHON",
          callToAction: "Book with 10% off until September 28",
          sections: [
            {
              heading: "Why it matters",
              body: "Friday occupancy is tracking 13% below last year. The hackathon draws 400+ visitors within five blocks of the hotel.",
            },
            {
              heading: "What we prepared",
              body: "A landing page, paid social copy, and a promo code that expires automatically after the event.",
            },
          ],
        },
      })
      .returning();

    await db.insert(opportunityDeployments).values({
      opportunityId: opportunity.id,
      artifactId: artifact.id,
      stage: "draft",
      githubRepo: "openai-hackathon-letsgo",
      githubBranch: "feature/hackathon-landing",
      statusMessage: "Draft ready for PR creation and preview build.",
      vercelPreviewUrl: "https://preview.vercel.sh/hackathon-event",
    });

    console.log("✓ Default hackathon opportunity seeded");

    console.log("\n🎉 Hotel data seeding completed successfully!");
    console.log(`
Summary:
- Company: ${company.name}
- Services: ${insertedServices.length} (Base Rate)
- Rooms: ${insertedRooms.length} (50 base rate rooms)
- Room rates: Ready for manual setup
- Competitor rates: Ready for manual setup
- Opportunities: 1 seeded (hackathon-event)
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
