const { config } = require("dotenv");
config({ path: ".env.local" });

const { getOccupancyData } = require("./lib/ai/tools/get-occupancy-data.ts");

async function testYoYComparison() {
  console.log("=== Testing YoY Comparison (2025 vs 2024) ===\n");

  const result = await getOccupancyData.execute({
    startDate: "2025-10-09",
    endDate: "2025-10-11", // Just 3 days for quick test
    includeYoYComparison: true,
    asOfDate: "2025-09-27",
  });

  console.log(
    "Current (2025):",
    result.current?.map((d) => `${d.date}: ${d.occupancyRate}%`)
  );
  console.log(
    "Historical (2024):",
    result.comparison?.map((d) => `${d.date}: ${d.occupancyRate}%`)
  );
  console.log("Summary:", result.summary);
}

testYoYComparison().catch(console.error);
