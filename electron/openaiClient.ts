import OpenAI from "openai";

export type GenerateTextInput = {
  apiKey: string;
  model: string;
  prompt: string;
};

export async function generateOpenAiText(input: GenerateTextInput): Promise<string> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const response = await client.responses.create({
    model: input.model,
    input: input.prompt
  });

  return response.output_text;
}
