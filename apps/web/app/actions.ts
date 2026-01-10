'use server';

import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// Initialize the Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generatePost(prompt: string) {
  try {
    // Call the Groq API (Llama-3-70b)
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'), 
      system: `You are a viral social media ghostwriter for LinkedIn and Twitter. 
               You write engaging, punchy content with good spacing. 
               You never use hashtags unless explicitly asked.
               Keep the tone authentic and human, not robotic.`,
      prompt: prompt,
      temperature: 0.7, // Creativity level (0.7 is a sweet spot for posts)
    });

    return { success: true, content: text };

  } catch (error) {
    console.error("Groq Generation Error:", error);
    return { 
      success: false, 
      content: "Failed to generate content. Please check your API key or try again." 
    };
  }
}


export async function repurposeContent(originalContent: string, platform: string) {
  try {
    let systemPrompt = "";

    // specialized prompts for each platform
    switch (platform) {
      case "Twitter":
        systemPrompt = "You are a viral Twitter ghostwriter. Turn the user's text into a gripping Twitter Thread. Use short punchy sentences, 🧵 emojis, and a strong hook. Do not use hashtags.";
        break;
      case "LinkedIn":
        systemPrompt = "You are a LinkedIn Top Voice. Rewrite the user's text as a professional, insightful LinkedIn post. Use line breaks for readability, a 'Lesson Learned' angle, and 3-5 relevant hashtags at the end.";
        break;
      case "Instagram":
        systemPrompt = "You are a social media manager. Turn the user's text into an engaging Instagram Caption. Include a call to action (question) and a block of 30 relevant hashtags at the bottom.";
        break;
      default:
        systemPrompt = "Rewrite this content to be more engaging and concise.";
    }

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: originalContent,
      temperature: 0.7,
    });

    return { 
      success: true, 
      content: text
    };

  } catch (error) {
    console.error("Repurposing Error:", error);
    return { success: false, error: "Failed to repurpose content." };
  }
}