export type OccupancyPoint = {
  date: string;
  occupancy: number;
  lastYearOccupancy: number;
};

export type CompetitorPricePoint = {
  date: string;
  yourPrice: number;
  competitor1: number;
  competitor2: number;
  competitor3: number;
  competitor4: number;
};

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  type: "event" | "pricing" | "general";
};

export type HotelSnapshot = {
  name: string;
  address: string;
  optimizationScore: number;
  occupancy: OccupancyPoint[];
  competitorPricing: CompetitorPricePoint[];
  opportunities: Opportunity[];
};

export function getMockHotelSnapshot(): HotelSnapshot {
  const today = new Date();

  const occupancy: OccupancyPoint[] = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);

    return {
      date: current.toISOString(),
      occupancy: 55 + index * 4,
      lastYearOccupancy: 50 + index * 3,
    };
  });

  // Generate competitor pricing data for next 90 days
  const competitorPricing: CompetitorPricePoint[] = Array.from({ length: 90 }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);

    // Base prices with some variation
    const baseYourPrice = 320;
    const baseComp1 = 380; // Higher-end competitor
    const baseComp2 = 350; // Similar level
    const baseComp3 = 290; // Budget competitor
    const baseComp4 = 410; // Luxury competitor

    // Add seasonal and day-of-week variations
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday/Saturday
    const weekendMultiplier = isWeekend ? 1.15 : 1.0;

    // Add some randomness and trends
    const trendFactor = 1 + (index / 360); // Slight upward trend
    const randomVariation = 0.9 + Math.random() * 0.2; // ±10% variation

    return {
      date: current.toISOString(),
      yourPrice: Math.round(baseYourPrice * weekendMultiplier * trendFactor * randomVariation),
      competitor1: Math.round(baseComp1 * weekendMultiplier * trendFactor * randomVariation),
      competitor2: Math.round(baseComp2 * weekendMultiplier * trendFactor * randomVariation),
      competitor3: Math.round(baseComp3 * weekendMultiplier * trendFactor * randomVariation),
      competitor4: Math.round(baseComp4 * weekendMultiplier * trendFactor * randomVariation),
    };
  });

  return {
    name: "The Ned",
    address: "1170 Broadway, New York, NY",
    optimizationScore: 0.25,
    occupancy,
    competitorPricing,
    opportunities: [
      {
        id: "hackathon-event",
        title: "Attract hackathon attendees",
        description:
          "An OpenAI hackathon is happening nearby this weekend. I've drafted a landing page and campaign brief to capture the demand.",
        ctaLabel: "Review and deploy",
        type: "event",
      },
      {
        id: "weekend-pricing",
        title: "Adjust weekend pricing clamps",
        description:
          "Saturday demand is pacing 12% ahead of last year. Consider tightening discounts and raising the ceiling by 8%.",
        ctaLabel: "Review recommendation",
        type: "pricing",
      },
    ],
  };
}
