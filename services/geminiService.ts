
import { GoogleGenAI } from "@google/genai";

export async function getSecurityAdvice(
  score: number,
  entropy: number,
  warning: string,
  suggestions: string[],
  isPwned: boolean,
  pwnedCount: number | null
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a professional cybersecurity consultant. 
    Analyze the following password health report and provide a concise, expert summary and 3 actionable tips.
    
    Report Data:
    - Strength Score: ${score}/4
    - Entropy (bits): ${entropy.toFixed(2)}
    - Local Warnings: ${warning || 'None'}
    - Automated Suggestions: ${suggestions.join(', ') || 'None'}
    - Data Breach Status: ${isPwned ? `Compromised (${pwnedCount} times)` : 'Not found in known breaches'}
    
    Format the response in Markdown. Do NOT mention specific passwords. Focus on general security hygiene and why this specific score was achieved.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "Unable to generate security advice at this time.";
  } catch (error) {
    console.error("Gemini advice error:", error);
    return "The security expert is currently offline. Please try again later.";
  }
}
