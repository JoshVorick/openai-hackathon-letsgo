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
  ctaLabel?: string;
  llmActionLabel: string;
  llmKickoffPrompt: string;
  isSupported: boolean;
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
  const competitorPricing: CompetitorPricePoint[] = Array.from(
    { length: 90 },
    (_, index) => {
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
      const trendFactor = 1 + index / 360; // Slight upward trend
      const randomVariation = 0.9 + Math.random() * 0.2; // ±10% variation

      return {
        date: current.toISOString(),
        yourPrice: Math.round(
          baseYourPrice * weekendMultiplier * trendFactor * randomVariation
        ),
        competitor1: Math.round(
          baseComp1 * weekendMultiplier * trendFactor * randomVariation
        ),
        competitor2: Math.round(
          baseComp2 * weekendMultiplier * trendFactor * randomVariation
        ),
        competitor3: Math.round(
          baseComp3 * weekendMultiplier * trendFactor * randomVariation
        ),
        competitor4: Math.round(
          baseComp4 * weekendMultiplier * trendFactor * randomVariation
        ),
      };
    }
  );

  return {
    name: "The Ned",
    address: "1170 Broadway, New York, NY",
    optimizationScore: 0.25,
    occupancy,
    competitorPricing,
    opportunities: [
      {
        id: "weekend-clamp-adjustment",
        title: "Adjust weekend clamps and make prices higher",
        description:
          "Saturday ADR can stretch higher—tighten the weekend clamp and raise the rate ceiling so Bellhop can push premium pricing confidently.",
        llmActionLabel: "Have Bellhop tighten weekend clamps",
        llmKickoffPrompt:
          "You are Bellhop, the AI chief of staff for The Ned located at 1170 Broadway, New York, NY. Review upcoming weekend's occupancy and increase the upper side of the clamp by 10%.",
        isSupported: true,
        type: "pricing",
      },
      {
        id: "hackathon-marketing",
        title: "Market a discount to hackathon attendees",
        description:
          "Nearby GPT-5 Codex hackers need rooms—spin up an outreach concept that spotlights The Ned and a limited-time code for attendees.",
        llmActionLabel: "Have Bellhop hop to it",
        llmKickoffPrompt:
          "You are Bellhop supporting The Ned at 1170 Broadway, New York, NY. A GPT-5 Codex hackathon is happening nearby and we want to capture attendee demand.\n1. Summarize any known demand signals or recent occupancy insights relevant to this event.\n2. Brainstorm marketing approaches, including an outreach email to OpenAI or Cerebral Valley event contacts that highlights a special attendee discount at The Ned.\n3. Provide ready-to-send copy (subject line, body, call-to-action) and suggest follow-up channels.\nIf any direct-send tooling is unavailable, clearly note the limitation before wrapping up.",
        isSupported: true,
        type: "event",
      },
    ],
  };
}
