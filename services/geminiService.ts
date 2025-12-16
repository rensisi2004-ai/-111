import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SentenceAnalysis, VocabWord, RecommendedArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Article Analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise summary of the article." },
    level: { type: Type.STRING, description: "Estimated CEFR level (e.g., C1, C2)." },
    sentences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          translation: { type: Type.STRING, description: "Chinese translation of the sentence." },
          grammarNotes: { type: Type.STRING, description: "Brief analysis of complex grammar structures or 'Simple sentence' if not complex." },
          keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["original", "translation", "grammarNotes", "keyPhrases"]
      }
    },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          meaning: { type: Type.STRING, description: "Chinese meaning." },
          contextSentence: { type: Type.STRING, description: "The sentence from the text where it appears." },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["word", "meaning", "contextSentence", "synonyms"]
      }
    }
  },
  required: ["summary", "level", "sentences", "vocabulary"]
};

export const analyzeArticleWithGemini = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform an intensive reading analysis (精读) on the following English text for an IELTS student targeting Band 9. 
      Break it down sentence by sentence. Extract Band 7+ vocabulary. 
      Identify long and difficult sentences (长难句) in 'grammarNotes'.
      Text: "${text.substring(0, 8000)}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeMistakeWithGemini = async (questionType: string, question: string, wrong: string, correct: string, context?: string) => {
  try {
    const prompt = `
    I am an IELTS student targeting Band 9. I made a mistake on a Reading question.
    Question Type: ${questionType}
    Question: "${question}"
    My Answer: "${wrong}"
    Correct Answer: "${correct}"
    ${context ? `Relevant Text Segment: "${context}"` : ''}

    Please analyze why I might have made this mistake (e.g., vocabulary gap, logic error, missed synonym, not finding the keyword).
    Give me specific, actionable advice to avoid this in the future. Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Mistake Analysis Error:", error);
    return "Could not generate analysis at this time.";
  }
};

export const getArticleRecommendations = async (targetBand: string = "9.0"): Promise<RecommendedArticle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 IELTS Academic Reading passage ideas for a student targeting Band ${targetBand}. 
      Topics should vary (Science, History, Sociology, etc.).
      Provide a title, a short excerpt (50 words), and a prompt I can use to generate the full article later.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              fullContentGeneratorPrompt: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Recommendation Error:", error);
    return [];
  }
};

export const generateFullArticle = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a full length IELTS Academic Reading passage (approx 800-1000 words) based on this prompt: ${prompt}. 
      Ensure high-level vocabulary and complex sentence structures suitable for Band 9 practice. 
      Only return the article text, no intro/outro.`,
    });
    return response.text;
  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

export const generateStudyPlanAdvice = async (mistakeSummary: string): Promise<string> => {
   try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following mistake summary for an IELTS student, provide a concise 3-point study strategy for the next week:
      ${mistakeSummary}`,
    });
    return response.text;
  } catch (error) {
    return "Focus on vocabulary acquisition and careful reading of True/False/Not Given questions.";
  }
}