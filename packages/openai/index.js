class OpenAI {
  constructor(options) {
    if (!options || typeof options.apiKey !== "string" || options.apiKey.length === 0) {
      throw new Error("Missing apiKey for OpenAI client");
    }

    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL ?? "https://api.openai.com/v1";
    this.responses = {
      create: async (payload) => {
        const response = await fetch(`${this.baseURL}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `OpenAI request failed: ${response.status} ${response.statusText} ${errorText}`
          );
        }

        return response.json();
      },
    };
  }
}

export default OpenAI;
