// Vercel serverless function for ASTROLABE AI generation
import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { scenario, description, virtue } = req.body || {};
    
    // Validate inputs
    if (!scenario || !description || !virtue) {
      return res.status(400).json({ 
        error: "Missing required fields: scenario, description, and virtue are all required." 
      });
    }

    // System prompt for ASTROLABE framework
    const systemPrompt = `You are an ASTROLABE reflection coach. Generate a structured 9-step reflection plan in valid JSON format.

Each step should provide concrete, actionable guidance tailored to the user's specific scenario.

The 9 steps are:
- A: Attune (identify 1 fact, 1 feeling, 1 body sensation)
- S: Signal (name the core value/virtue at stake, suggest a 1% upgrade)
- T: Test the Tale (challenge snap judgments, offer a better belief)
- R: Run Futures (project consequences if pattern continues, suggest guardrails)
- O: Options Triangle (provide 3 choices: conserve/experiment/leap)
- L: Lock-in (create IF-THEN implementation intention, ethics check)
- A: Account (suggest a simple metric to track)
- B: Buddy (recommend sharing with someone, what feedback to request)
- E: Evolve (suggest review date and reflection prompts)

Return ONLY valid JSON in this exact format:
{
  "steps": [
    {"letter": "A", "title": "Attune", "text": "specific guidance here"},
    {"letter": "S", "title": "Signal", "text": "specific guidance here"},
    {"letter": "T", "title": "Test the Tale", "text": "specific guidance here"},
    {"letter": "R", "title": "Run Futures", "text": "specific guidance here"},
    {"letter": "O", "title": "Options Triangle", "text": "specific guidance here"},
    {"letter": "L", "title": "Lock-in the System", "text": "specific guidance here"},
    {"letter": "A", "title": "Account", "text": "specific guidance here"},
    {"letter": "B", "title": "Buddy & Broadcast", "text": "specific guidance here"},
    {"letter": "E", "title": "Evolve", "text": "specific guidance here"}
  ]
}

Keep each step concise (2-4 sentences). Be specific to their scenario, warm but direct.`;

    const userPrompt = `Scenario: ${scenario}
Description: ${description}
Virtue/Goal: ${virtue}

Create a personalized ASTROLABE reflection plan for this scenario.`;

    // Call OpenAI API
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const jsonText = response.choices[0].message.content;
    const data = JSON.parse(jsonText);
    
    // Validate response structure
    if (!data.steps || !Array.isArray(data.steps) || data.steps.length !== 9) {
      throw new Error("AI returned invalid format");
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.error("ASTROLABE API Error:", error);
    
    // Return helpful error message
    if (error.message.includes("API key")) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured. Add OPENAI_API_KEY to Vercel environment variables." 
      });
    }
    
    res.status(500).json({ 
      error: error.message || "Failed to generate reflection. Please try again." 
    });
  }
}