import { tool } from "ai";
import { z } from "zod";

export const getPricingSop = tool({
  description:
    "Retrieve the hotel's pricing standard operating procedure as Markdown",
  inputSchema: z.object({}).default({}).describe("No arguments required"),
  // biome-ignore lint/suspicious/useAwait: <explanation>
  execute: async () => {
    const markdown = `# Pricing Strategy SOP

## Base Rate
- Standard room base rate: $180 per night prior to adjustments.

## Room Type Markups
- Standard: +0%
- Deluxe: +10%
- King: +15%
- Suite: +25%
- Penthouse: +40%

## Occupancy Adjustments
- 6-10 days out with occupancy < 70% -> -$15
- Occupancy > 90% -> +$25
- Weekend premium: Friday +$9, Saturday +$15

## Competitor Pricing Rule
- Always price $15 below the lowest competitor.

## Default Competitor Set
- Marriott Downtown
- Hilton City Center
`;

    return { markdown };
  },
});
