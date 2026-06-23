import { GoogleGenAI } from "@google/genai";
import dontenv from "dotenv";
import { AIResponseSchema } from "../types/artist.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import { UnrecoverableError } from "bullmq";
dontenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const artistResponseSchema = {
  type: "object",
  properties: {
    matchedArtists: {
      type: "array",
      description: "A list of artists found in the text along with their generated profiles.",
      items: {
        type: "object",
        properties: {
          trackingId: {
            type: "string",
            description: "A unique identifier for tracking the request and response.",
          },
          artistName: {
            type: "string",
            description: "The full name of the artist.",
          },
          biography: {
            type: "string",
            description:
              "A compelling, single-paragraph concert summary (4-6 sentences, roughly 80-120 words). It must be a cohesive narrative paragraph, not a list. Info is taken from the provided PDF",
          },
        },
        required: ["trackingId", "artistName", "biography"],
      },
    },
  },
  required: ["matchedArtists"],
};

export const handleGenerateArtistBios = async (data: {
  concertId: string;
  artists: { id: string; name: string }[];
  pdfBase64String: string;
  mimeType: string;
}) => {
  try {
    const { concertId, artists, pdfBase64String, mimeType } = data;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            data: pdfBase64String,
            mimeType: mimeType,
          },
        },
        `Review the attached PDF content. You are looking specifically for info regarding this targeted group of artists.

           Target Artist Roster:
           ${JSON.stringify(artists)}

           Instructions:
           1. Extract relevant information about each artist from the list and generate a concise biography for them.
           2. Include key details such as their background, notable works, or anything else that can be inferred from the PDF.
           3. CRITICAL: You must return the exact matching 'id' from the target artist list inside the 'trackingId' field in the JSON response. Do not alter this string.
           4. If an artist's name is not mentioned anywhere in the PDF, include them in the array anyway, but specify 'No context available in the press kit' as their biography.`,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: artistResponseSchema,
      },
    });

    if (!response || !response.text) {
      throw new Error("Invalid response from AI model: No text content");
    }

    const rawJSON = JSON.parse(response.text);

    const validateData = AIResponseSchema.safeParse(rawJSON);
    if (!validateData.success) {
      console.error("AI response validation failed:", validateData.error);
      throw new Error("Invalid response format from AI model");
    }

    const { matchedArtists } = validateData.data;
    console.log("Matched Artists from AI Response:", matchedArtists);
  } catch (error) {
    console.error("Error in handleGenerateArtistBios:", error);
    throw new Error("Failed to generate artist biographies");
  }
};
