import { GoogleGenerativeAI } from "@google/generative-ai";
import { PromptDefinition } from "./types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}

export class GeminiTranscriptionService {
  private genAI = new GoogleGenerativeAI(apiKey);

  async generateText(prompt: PromptDefinition, text: string) {
    const model = this.genAI.getGenerativeModel({
      model: prompt.model || "gemini-1.5-flash",
      systemInstruction: prompt.systemInstruction,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt.userPrompt}\n\n${text}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
      },
    });

    return result.response.text();
  }
}

export const geminiService = new GeminiTranscriptionService();
