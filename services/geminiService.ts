import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SentenceAnalysis, VocabWord, RecommendedArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeArticleWithGemini = async (text: string) => {
  let attempt = 0;
  const maxRetries = 3;
  // Drastically reduced to 1600 chars (approx 250-300 words).
  // The 'Rpc failed' error (code 6) indicates the request/response cycle is timing out or the payload is too large 
  // for the model to process into a complex JSON structure in one go.
  const safeText = text.substring(0, 1600);

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Perform an intensive reading analysis (精读) on the following English text for an IELTS student targeting Band 9. 
        
        Instructions:
        1. Break the text down sentence by sentence.
        2. Extract top 10 Band 7+ vocabulary words.
        3. Identify long and difficult sentences (长难句).
        4. **CRITICAL**: 'grammarNotes' and 'meaning' MUST be in CHINESE (中文).
        5. **OPTIMIZATION**: Keep 'grammarNotes' brief. Only provide notes for complex sentences.

        JSON Structure:
        {
          "summary": "Concise summary in English",
          "level": "CEFR Level",
          "sentences": [
            { 
              "original": "English sentence", 
              "translation": "Chinese translation", 
              "grammarNotes": "Brief grammar analysis (CN)", 
              "keyPhrases": ["phrase"] 
            }
          ],
          "vocabulary": [
            { 
              "word": "word", 
              "phonetic": "IPA", 
              "meaning": "Chinese meaning", 
              "contextSentence": "Context from text", 
              "synonyms": ["syn1", "syn2"],
              "collocations": ["phrase 1", "phrase 2"]
            }
          ]
        }

        Text to Analyze:
        "${safeText}"`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1, 
        }
      });

      if (!response.text) throw new Error("Empty response from Gemini");
      
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);

    } catch (error) {
      console.error(`Gemini Analysis Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt === maxRetries) {
        console.warn("Returning fallback analysis due to repeated failures.");
        // Basic fallback that tries to at least show the text split by sentences
        const basicSentences = safeText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).map(s => ({ 
           original: s.trim(), 
           translation: "Translation unavailable due to timeout.", 
           grammarNotes: "Analysis failed.", 
           keyPhrases: [] 
        }));

        return {
          summary: "Analysis failed due to network or model timeout. The text might be too complex for a single pass.",
          level: "N/A",
          sentences: basicSentences.length > 0 ? basicSentences : [{ original: safeText, translation: "Error", grammarNotes: "Error", keyPhrases: [] }],
          vocabulary: []
        };
      }
      await delay(2000 * Math.pow(2, attempt - 1));
    }
  }
};

export const lookupWordWithGemini = async (word: string, contextSentence: string): Promise<VocabWord> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Define the word/phrase "${word}" as it is used in this context: "${contextSentence}".
      Target an IELTS Band 9 student. 
      Provide:
      1. Chinese Meaning.
      2. 2-3 Common Collocations (扩充词组).
      
      Return JSON only: { "word": "${word}", "phonetic": "IPA", "meaning": "Chinese definition", "synonyms": ["syn1", "syn2"], "collocations": ["collocation1", "collocation2"] }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: Date.now().toString(),
      word: data.word || word,
      phonetic: data.phonetic || "",
      meaning: data.meaning || "Definition unavailable",
      contextSentence: contextSentence,
      synonyms: data.synonyms || [],
      collocations: data.collocations || [],
      mastered: false,
      isCustom: true
    };
  } catch (error) {
    console.error("Lookup Error:", error);
    return {
      id: Date.now().toString(),
      word: word,
      phonetic: "",
      meaning: "Lookup failed",
      contextSentence: contextSentence,
      synonyms: [],
      collocations: [],
      mastered: false
    };
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

    Please analyze why I might have made this mistake. Give me specific advice. Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Mistake Analysis Error:", error);
    return "Could not generate analysis at this time. Please try again later.";
  }
};

export const getArticleRecommendations = async (targetBand: string = "9.0"): Promise<RecommendedArticle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 IELTS Academic Reading passage ideas for a student targeting Band ${targetBand}. 
      Topics should vary. Provide a title, short excerpt (30 words), and a prompt to generate the full article.`,
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
      contents: `Write a full length IELTS Academic Reading passage (approx 600-800 words) based on this prompt: ${prompt}. 
      Ensure high-level vocabulary. Only return the article text.`,
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
      contents: `Based on the following mistake summary for an IELTS student, provide a concise 3-point study strategy:
      ${mistakeSummary}`,
    });
    return response.text;
  } catch (error) {
    return "Focus on vocabulary acquisition and careful reading.";
  }
}