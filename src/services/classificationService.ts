import { GoogleGenAI, Type } from "@google/genai";

export enum MessageType {
  SPAM = "SPAM",
  PERSONAL = "PERSONAL",
  TRANSACTIONAL = "TRANSACTIONAL",
  MARKETING = "MARKETING",
  OTP = "OTP",
  UNKNOWN = "UNKNOWN"
}

export interface ClassificationResult {
  type: MessageType;
  confidence: number;
  reason: string;
  summary: string;
}

export class ClassificationService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async classifyMessage(text: string): Promise<ClassificationResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Classify the following message text into one of these categories: SPAM, PERSONAL, TRANSACTIONAL, MARKETING, OTP, UNKNOWN.
      
      Message: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "The category of the message.",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score from 0 to 1.",
            },
            reason: {
              type: Type.STRING,
              description: "Brief explanation for this classification.",
            },
            summary: {
              type: Type.STRING,
              description: "A very short summary of the message content.",
            },
          },
          required: ["type", "confidence", "reason", "summary"],
        },
      },
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        type: (result.type as MessageType) || MessageType.UNKNOWN,
        confidence: result.confidence || 0,
        reason: result.reason || "No reason provided.",
        summary: result.summary || "No summary available.",
      };
    } catch (e) {
      console.error("Failed to parse classification result", e);
      return {
        type: MessageType.UNKNOWN,
        confidence: 0,
        reason: "Error processing the message.",
        summary: "Error.",
      };
    }
  }
}

export const classificationService = new ClassificationService();
