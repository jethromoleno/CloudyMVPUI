import { GoogleGenAI } from "@google/genai";
import { Trip } from '../types';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTripLogistics = async (
  trip: Trip, 
  originName: string, 
  destName: string,
  truckCapacity: number
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Act as a logistics expert. Analyze the following trucking trip details:
      
      Route: ${originName} to ${destName}
      Cargo Type: ${trip.load_type}
      Net Weight: ${trip.net_weight} kg
      Truck Capacity: ${truckCapacity} tons
      Scheduled: ${trip.scheduled_start_time}

      Provide a concise analysis including:
      1. Potential route challenges for this specific path.
      2. Handling advice for ${trip.load_type} cargo.
      3. Capacity check: Is the ${trip.net_weight}kg load safe for a ${truckCapacity}T truck?
      
      Keep the tone professional and operational. Max 150 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Analysis unavailable at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI analysis. Please check API key configuration.";
  }
};
