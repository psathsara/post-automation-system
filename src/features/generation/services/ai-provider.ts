import OpenAI from "openai";

export type AiPostPlan = {
  title: string;
  creativeDirection: string;
  layout: string;
  typography: string;
  colorSystem: string;
  imageTreatment: string;
  logoPlacementInstruction: string;
  canvaPayload: Record<string, unknown>;
};

export type AiProvider = {
  createPostPlan(prompt: string): Promise<AiPostPlan>;
};

export function getAiProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return {
      async createPostPlan(prompt) {
        return {
          title: "Draft social post plan",
          creativeDirection: prompt.slice(0, 240),
          layout: "Square 1080x1080 composition with strong hierarchy and safe logo area.",
          typography: "Bold headline, readable secondary copy, bilingual-safe spacing.",
          colorSystem: "Use the selected brand palette with accessible contrast.",
          imageTreatment: "Use supplied images as primary visual material without logo generation.",
          logoPlacementInstruction: "Reserve exact logo metadata for final Canva/n8n insertion.",
          canvaPayload: { mode: "mock", reason: "OPENAI_API_KEY is not configured" },
        };
      },
    };
  }

  const client = new OpenAI({ apiKey });

  return {
    async createPostPlan(prompt) {
      const response = await client.responses.create({
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "social_post_plan",
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "title",
                "creativeDirection",
                "layout",
                "typography",
                "colorSystem",
                "imageTreatment",
                "logoPlacementInstruction",
                "canvaPayload",
              ],
              properties: {
                title: { type: "string" },
                creativeDirection: { type: "string" },
                layout: { type: "string" },
                typography: { type: "string" },
                colorSystem: { type: "string" },
                imageTreatment: { type: "string" },
                logoPlacementInstruction: { type: "string" },
                canvaPayload: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      });

      return JSON.parse(response.output_text) as AiPostPlan;
    },
  };
}
