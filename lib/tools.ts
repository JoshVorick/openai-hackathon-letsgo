type ToolDef = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, any>;
};

export const toolDefs: ToolDef[] = [
  {
    type: "function",
    name: "get_occupancy",
    description: "Return current occupancy by room type for a given date.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", format: "date" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_competitor_prices",
    description:
      "Return example competitor nightly rates for a location & date range.",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
        start: { type: "string", format: "date" },
        end: { type: "string", format: "date" },
      },
      required: ["location", "start", "end"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "update_prices",
    description:
      "Apply a flat percentage adjustment for a room type over a date range.",
    parameters: {
      type: "object",
      properties: {
        roomType: { type: "string" },
        pct: { type: "number" },
        start: { type: "string", format: "date" },
        end: { type: "string", format: "date" },
      },
      required: ["roomType", "pct", "start", "end"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "update_settings",
    description: "Update a named setting with a value.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" },
        value: { type: ["string", "number", "boolean"] },
      },
      required: ["key", "value"],
      additionalProperties: false,
    },
  },
];

export async function runTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_occupancy":
      return {
        date: args.date,
        byRoomType: [
          { roomType: "King", occupied: 28, total: 40, pct: 0.7 },
          { roomType: "Queen", occupied: 18, total: 30, pct: 0.6 },
        ],
      };

    case "get_competitor_prices":
      return {
        location: args.location,
        start: args.start,
        end: args.end,
        competitors: [
          { name: "Hotel A", avgNightly: 219 },
          { name: "Hotel B", avgNightly: 205 },
        ],
      };

    case "update_prices":
      return {
        status: "ok",
        note: `Applied ${args.pct}% to ${args.roomType} from ${args.start} to ${args.end}`,
      };

    case "update_settings":
      return { status: "ok", key: args.key, value: args.value };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
