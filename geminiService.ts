
import { GoogleGenAI } from "@google/genai";
import { PromptDefinition } from "./types";

export class GeminiTranscriptionService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async processTranscription(prompt: PromptDefinition, text: string) {
    if (!text.trim()) throw new Error("No text provided for transcription.");

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompt.userPrompt}\n\nTEXT:\n${text}`,
        config: {
          systemInstruction: prompt.systemInstruction,
          temperature: 0.1, // Keep it precise for medical data
        },
      });

      return response.text || "No response generated.";
    } catch (error) {
      console.error("Gemini processing error:", error);
      throw error;
    }
  }

  async *streamTranscription(prompt: PromptDefinition, text: string) {
    if (!text.trim()) return;

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `${prompt.userPrompt}\n\nTEXT:\n${text}`,
        config: {
          systemInstruction: prompt.systemInstruction,
          temperature: 0.1,
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
