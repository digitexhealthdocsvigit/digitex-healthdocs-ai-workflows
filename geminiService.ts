
import { GoogleGenAI } from "@google/genai";
import { PromptDefinition } from "./types";

export class GeminiTranscriptionService {
  constructor() {}

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async *streamTranscription(prompt: PromptDefinition, text: string, audioData?: { data: string, mimeType: string }) {
    const ai = this.getAI();
    
    // Use the native audio model for the first pass if audio is provided
    const modelName = audioData ? 'gemini-2.5-flash-native-audio-preview-09-2025' : prompt.model;

    try {
      const parts: any[] = [{ text: `${prompt.userPrompt}\n\nTEXT TO PROCESS:\n${text}` }];
      
      if (audioData) {
        parts.unshift({
          inlineData: {
            data: audioData.data,
            mimeType: audioData.mimeType
          }
        });
      }

      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: { parts },
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
