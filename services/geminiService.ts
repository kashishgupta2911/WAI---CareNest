
import { GoogleGenAI, Type } from "@google/genai";
import type { JournalEntry, AIInsights, RegistrationAnswers, DailyGoal } from '../types';

// FIX: Per coding guidelines, assume API_KEY is always present using a non-null assertion.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief, gentle summary of the user's recent feelings.",
    },
    moodTrend: {
      type: Type.STRING,
      description: "A short analysis of how their mood has been changing over time (e.g., 'improving', 'fluctuating', 'showing signs of struggle').",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A few actionable, supportive suggestions. If they mention positive things, encourage them. If they struggle, suggest a self-care task from the app. Keep suggestions gentle and brief.",
    },
    concernFlag: {
      type: Type.BOOLEAN,
      description: "Set to true ONLY if there are persistent, strong indicators of postpartum depression or anxiety across multiple entries. Otherwise, set to false.",
    },
    concernMessage: {
      type: Type.STRING,
      description: "If concernFlag is true, provide this exact message: 'AI Insights has raised a flag after reading your journal entries. You seem to be feeling some negative feelings. We suggest you reach out to your emergency contact or a medical professional.' Otherwise, an empty string."
    }
  },
  required: ['summary', 'moodTrend', 'suggestions', 'concernFlag', 'concernMessage'],
};

export async function getAIInsights(entries: JournalEntry[]): Promise<AIInsights> {
  // FIX: Per coding guidelines, assume API_KEY is always present and remove the check.
  const entriesText = entries.map(e => `Date: ${e.date}\nMood: ${e.mood}\nEntry: ${e.content}`).join('\n---\n');

  const prompt = `
    You are a compassionate AI assistant for new mothers using a postpartum wellness app. Your primary goal is to provide gentle, supportive insights, and to identify potential signs of emotional distress.
    Analyze the following journal entries chronologically. The user's goal is to track their emotional well-being.
    Based on the entries provided, generate a JSON object that strictly adheres to the defined schema.

    Your analysis should focus on:
    1.  **Sentiment and Content:** Look at the user's word choice, tone, and the content of their entries for signs of postpartum depression (e.g., persistent sadness, loss of interest, feelings of worthlessness, hopelessness) and postpartum anxiety (e.g., excessive worry, racing thoughts, fear of being alone with the baby).
    2.  **Mood Trend:** Compare the most recent entry with previous ones to detect changes, patterns, or prolonged periods of negative emotions.

    - **summary:** Provide a brief, gentle summary of the user's recent feelings based on the latest entries.
    - **moodTrend:** Analyze how their mood has been changing (e.g., 'showing improvement with some fluctuations', 'experiencing a difficult period with persistent sadness', 'expressing more anxiety recently').
    - **suggestions:** Offer a few actionable, supportive suggestions based on their entries.
    - **concernFlag:** Set this to \`true\` ONLY if you detect persistent and strong indicators of PPD/PPA across multiple recent entries (e.g., 3 or more consecutive negative entries, or mentions of hopelessness/worthlessness). Otherwise, keep it \`false\`.
    - **concernMessage:** If concernFlag is true, provide this exact message: "AI Insights has raised a flag after reading your journal entries. You seem to be feeling some negative feelings. We suggest you reach out to your emergency contact or a medical professional." Otherwise, an empty string.

    Journal Entries:
    ---
    ${entriesText}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString) as AIInsights;
    return parsedResponse;

  } catch (error) {
    console.error("Error fetching AI insights:", error);
    throw new Error("Failed to get insights from Gemini API.");
  }
}

const goalsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING, description: 'The gentle, actionable goal for the user.' },
            total: { type: Type.NUMBER, description: 'The target number for the goal (e.g., 15 for 15 minutes).' },
            unit: { type: Type.STRING, description: 'The unit for the goal (e.g., "min", "contact", "session").' },
        },
        required: ['text', 'total', 'unit'],
    }
};

export async function generateDailyGoals(answers: RegistrationAnswers): Promise<DailyGoal[]> {
  // FIX: Per coding guidelines, assume API_KEY is always present and remove the check.
  const prompt = `
    You are a compassionate AI assistant for new mothers, helping set up their postpartum wellness app, CareNest.
    Based on the user's registration answers, generate a JSON array of exactly 3 personalized, actionable, and gentle daily goals.
    Each goal should be a simple task that a new mother can realistically achieve.
    The JSON object for each goal must strictly adhere to the defined schema. Do not include any introductory text, just the JSON array.

    User's Answers:
    - Felt supported during pregnancy (1-5 scale, 1=low, 5=high): ${answers.supportScale}
    - Typical sleep in 24 hours: ${answers.sleepHours} hours
    - Primary emotional goal: "${answers.emotionalGoal}"
    - Preferred self-care methods: "${answers.selfCareMethods}"
    - Top stressors: ${answers.stressors.join(', ')}

    Generate goals that address their stressors and align with their emotional goal and their preferred self-care methods. For example, if they are stressed by loneliness and like talking, suggest calling a friend. If they want to feel calmer, suggest a short breathing exercise. If they lack sleep, suggest a short nap or rest period.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: goalsSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString) as {text: string; total: number; unit: string}[];

    // Map the response to the DailyGoal type
    return parsedResponse.map((goal, index) => ({
        id: Date.now() + index,
        text: goal.text,
        progress: 0,
        total: goal.total,
        unit: goal.unit,
        xp: 5 * (index + 1), // Assign some XP
        completed: false,
    }));

  } catch (error) {
    console.error("Error generating daily goals:", error);
    throw new Error("Failed to generate daily goals from Gemini API.");
  }
}
