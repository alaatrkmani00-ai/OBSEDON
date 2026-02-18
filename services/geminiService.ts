import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateObsidianLogo(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A professional high-tech digital currency logo for a coin named "Obsidian". The icon features a dark, faceted obsidian gemstone at the center with glowing purple and indigo circuit-board patterns etched into its surface. A silver metallic Greek Omega symbol is prominently integrated into the gem. The style is 3D, sleek, premium crypto asset, cinematic lighting, dark futuristic background, 4k resolution.',
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Logo generation error:", error);
    return null;
  }
}