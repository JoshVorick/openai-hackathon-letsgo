export type OccupancyPoint = {
  date: string;
  occupancy: number;
  lastYearOccupancy: number;
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

  return {
    name: "The Ned",
    address: "1170 Broadway, New York, NY",
    optimizationScore: 0.25,
    occupancy,
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
