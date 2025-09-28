import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hotelManagementPrompt, regularPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";

const requestSchema = z.object({
  text: z.string().min(1, "Task text is required."),
});

const responseSchema = z.object({
  canHandle: z.boolean(),
  summary: z.string().optional(),
  starterQuery: z.string().optional(),
});

const toolsSummary = `
Bellhop can use these tools when starting work:
- getWeather: Weather context for demand forecasting
- getOccupancyData: Occupancy pacing and year-over-year comparisons
- getRoomRates: Current rate data and pricing trends
- updateRoomRates: Adjust pricing within allowed clamps
- getRateClamps: Retrieve current min/max pricing limits
- updateRateClamps: Modify pricing guardrails
- getHotelSettings: Review hotel details and configuration
- updateHotelSettings: Update hotel information when appropriate
`;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parseResult = requestSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Task text is required." },
      { status: 400 }
    );
  }

  const { text } = parseResult.data;

  try {
    const { object } = await generateObject({
      model: myProvider.languageModel("chat-model-reasoning"),
      system: `${regularPrompt}\n\n${hotelManagementPrompt}\n\nYou are evaluating whether Bellhop can immediately start a hotel management task with the available tools.\n\nGuidelines:\n- Return canHandle=true only if Bellhop can begin working using the tools listed without manual steps or additional context.\n- When canHandle=true, provide a short, friendly summary for the UI and a concrete starterQuery Bellhop should run.\n- Keep the summary under 140 characters and make the starterQuery a direct instruction.\n- When the task is out of scope, unsafe, or unclear, respond with canHandle=false and omit other fields.\n\n${toolsSummary}`,
      prompt: `To-do item: """${text}"""`,
      schema: responseSchema,
      temperature: 0,
    });

    if (!object.canHandle || !object.summary || !object.starterQuery) {
      return NextResponse.json({ canHandle: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        canHandle: true,
        summary: object.summary,
        starterQuery: object.starterQuery,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to evaluate to-do item with Bellhop", error);
    return NextResponse.json({ canHandle: false }, { status: 500 });
  }
}
