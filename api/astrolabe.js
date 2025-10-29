// /api/astrolabe.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Setup OpenAI client with API key from environment
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // <-- Make sure you set this in .env
});

router.post("/", async (req, res) => {
  try {
    const { scenario, description, virtue } = req.body;

    if (!scenario || !description || !virtue) {
      return res.status(400).json({ error: "Missing input fields" });
    }

    // ✅ Correct API method (Fix #1)
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // ✅ Valid model name (Fix #2)
      messages: [
        {
          role: "system",
          content: "You are ASTROLABE, a structured reflection guide. Generate a 9-step reflection plan."
        },
        {
          role: "user",
          content: `Scenario: ${scenario}\nDescription: ${description}\nVirtue: ${virtue}\n\nCreate a reflection plan for all ASTROLABE steps (A–E).`
        }
      ],
      temperature: 0.7,
    });

    // Extract AI text
    const aiText = response.choices[0].message.content;

    // Split into steps for accordion
    const steps = [
      { letter: "A", title: "Attune", text: "Fact, feeling, body cue." },
      { letter: "S", title: "Signal", text: "Virtue and 1% upgrade." },
      { letter: "T", title: "Test", text: "Snap-story vs better belief." },
      { letter: "R", title: "Run Futures", text: "If pattern repeats + premortem." },
      { letter: "O", title: "Options", text: "Conserve / Experiment / Leap." },
      { letter: "L", title: "Lock-in", text: "Routine (If–Then) + ethics check." },
      { letter: "A", title: "Account", text: "Metric to track." },
      { letter: "B", title: "Buddy", text: "Who to share with." },
      { letter: "E", title: "Evolve", text: "Review date + adjust." },
    ];

    // Fill with AI text if structured properly
    // For beginners: simple fallback if AI just writes one block
    if (aiText) {
      const parts = aiText.split(/\n(?=[A-Z]\s?—)/); // crude split by "A —"
      steps.forEach((s, i) => {
        if (parts[i]) s.text = parts[i];
      });
    }

    res.json({ steps });
  } catch (e) {
    console.error("❌ Error in /api/astrolabe:", e);
    res.status(500).json({ error: e.message || "OpenAI request failed" });
  }
});

export default router;
