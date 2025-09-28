import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { analyzePricingOpportunities } from "./ai/tools/analyze-pricing-opportunities";
import type { executePricingAction } from "./ai/tools/execute-pricing-action";
import type { getHotelSettings } from "./ai/tools/get-hotel-settings";
import type { getOccupancyData } from "./ai/tools/get-occupancy-data";
import type { getRateClamps } from "./ai/tools/get-rate-clamps";
import type { getRoomRates } from "./ai/tools/get-room-rates";
import type { getWeather } from "./ai/tools/get-weather";
import type { getPricingSop } from "./ai/tools/get-pricing-sop";
import type { updateHotelSettings } from "./ai/tools/update-hotel-settings";
import type { updateRateClamps } from "./ai/tools/update-rate-clamps";
import type { updateRoomRates } from "./ai/tools/update-room-rates";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type getOccupancyDataTool = InferUITool<typeof getOccupancyData>;
type getRoomRatesTool = InferUITool<typeof getRoomRates>;
type updateRoomRatesTool = InferUITool<typeof updateRoomRates>;
type getRateClampsTool = InferUITool<typeof getRateClamps>;
type updateRateClampsTool = InferUITool<typeof updateRateClamps>;
type getHotelSettingsTool = InferUITool<typeof getHotelSettings>;
type updateHotelSettingsTool = InferUITool<typeof updateHotelSettings>;
type getPricingSopTool = InferUITool<typeof getPricingSop>;
type analyzePricingOpportunitiesTool = InferUITool<
  typeof analyzePricingOpportunities
>;
type executePricingActionTool = InferUITool<typeof executePricingAction>;

export type ChatTools = {
  getWeather: weatherTool;
  getOccupancyData: getOccupancyDataTool;
  getRoomRates: getRoomRatesTool;
  updateRoomRates: updateRoomRatesTool;
  getRateClamps: getRateClampsTool;
  updateRateClamps: updateRateClampsTool;
  getHotelSettings: getHotelSettingsTool;
  updateHotelSettings: updateHotelSettingsTool;
  getPricingSop: getPricingSopTool;
  analyzePricingOpportunities: analyzePricingOpportunitiesTool;
  executePricingAction: executePricingActionTool;
};

export type CustomUIDataTypes = {
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
