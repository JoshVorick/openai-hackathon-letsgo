export type ResponsesCreateParams = {
  model: string;
  input?: unknown;
  tools?: unknown;
  previous_response_id?: string;
  tool_outputs?: Array<{ call_id: string; output: string }>;
};

declare class OpenAI {
  constructor(options: { apiKey: string; baseURL?: string });
  responses: {
    create<T = any>(params: ResponsesCreateParams): Promise<T>;
  };
}

export default OpenAI;
