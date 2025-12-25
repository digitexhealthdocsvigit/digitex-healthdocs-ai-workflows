
import { GoogleGenAI } from "@google/genai";
import { PromptDefinition } from "./types";

export class GeminiTranscriptionService {
  constructor() {}

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async *streamTranscription(prompt: PromptDefinition, text: string) {
    if (!text.trim()) return;
    const ai = this.getAI();

    try {
      const responseStream = await ai.models.generateContentStream({
        model: prompt.model,
        contents: `${prompt.userPrompt}\n\nTEXT:\n${text}`,
        config: {
          systemInstruction: prompt.systemInstruction,
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiTranscriptionService();
