import OpenAI from "openai";
import type { Reminder } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY
});

export async function callOpenAI(message: string, reminders: Reminder[] = []): Promise<string> {
  try {
    // Prepare context about user's reminders
    const reminderContext = reminders.length > 0 
      ? `Here are the user's current reminders for context:\n${reminders.map(r => 
          `- [${r.category}${r.important ? ' - IMPORTANT' : ''}] ${r.content} (created ${new Date(r.createdAt).toLocaleDateString()})`
        ).join('\n')}\n\n`
      : "The user doesn't have any reminders yet.\n\n";

    const systemPrompt = `You are a helpful AI assistant for MemoryKeeper, a personal reminder management app. Your role is to help users understand, organize, and manage their reminders effectively.

${reminderContext}Guidelines for your responses:
- Be concise but helpful
- Provide actionable advice when requested
- Help users prioritize and organize their tasks
- Suggest improvements to reminder content when appropriate
- Be encouraging and supportive
- If asked to summarize, focus on the most important points
- If asked to prioritize, consider urgency, importance, and deadlines
- Maintain a friendly, professional tone

User question: ${message}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response received from AI");
    }

    return aiResponse;

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('API key')) {
        throw new Error("AI service is not properly configured. Please check the API key.");
      }
      if (error.message.includes('quota')) {
        throw new Error("AI service quota exceeded. Please try again later.");
      }
      if (error.message.includes('rate limit')) {
        throw new Error("Too many requests. Please wait a moment before trying again.");
      }
    }
    
    throw new Error("Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.");
  }
}

// Helper function to analyze reminder content and suggest improvements
export async function analyzeReminder(content: string): Promise<{
  suggestions: string[];
  priority: 'low' | 'medium' | 'high';
  category: string;
}> {
  try {
    const prompt = `Analyze this reminder and provide suggestions for improvement, estimated priority level, and suggested category. Respond with JSON in this exact format:

{
  "suggestions": ["suggestion1", "suggestion2"],
  "priority": "low|medium|high",
  "category": "Personal|Work|Health|Other"
}

Reminder to analyze: "${content}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing and categorizing reminders. Provide helpful suggestions to make reminders more actionable and clear."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      suggestions: result.suggestions || [],
      priority: result.priority || 'medium',
      category: result.category || 'Personal'
    };

  } catch (error) {
    console.error('Reminder analysis error:', error);
    return {
      suggestions: [],
      priority: 'medium',
      category: 'Personal'
    };
  }
}
