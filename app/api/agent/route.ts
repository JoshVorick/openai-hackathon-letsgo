import { NextRequest } from "next/server";

import { openai } from "@/lib/openai";
import { runTool, toolDefs } from "@/lib/tools";

export const runtime = "nodejs";

type ResponseBody = { message: string | null } | { error: string };

export async function POST(req: NextRequest) {
  try {
    const { input } = (await req.json()) as { input: string };

    if (typeof input !== "string" || input.trim().length === 0) {
      const body: ResponseBody = { error: "Invalid input" };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    let current = await openai.responses.create({
      model: "gpt-4.1",
      input,
      tools: toolDefs,
    });

    const toolCalls =
      (current.output ?? []).filter((item: any) => item.type === "tool_call") ?? [];

    if (toolCalls.length > 0) {
      const tool_outputs = [] as {
        call_id: string;
        output: string;
      }[];

      for (const call of toolCalls) {
        const { name, arguments: rawArgs, call_id } = call;
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs ?? {};
        const result = await runTool(name, args);
        tool_outputs.push({ call_id, output: JSON.stringify(result) });
      }

      current = await openai.responses.create({
        model: "gpt-4.1",
        previous_response_id: current.id,
        tool_outputs,
      });
    }

    const message =
      (current as any).output_text ??
      ((current as any).output ?? [])
        .filter((item: any) => item.type === "message")
        .map((item: any) =>
          (item.content ?? [])
            .map((contentItem: any) => contentItem.text)
            .filter(Boolean)
            .join("\n")
        )
        .filter(Boolean)
        .join("\n");

    const body: ResponseBody = { message: message ?? null };
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    const err =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : "Unexpected error";

    const body: ResponseBody = { error: err };
    return new Response(JSON.stringify(body), { status: 500 });
  }
}
