import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Yield Advisory
  app.post("/api/gemini/advice", async (req: express.Request, res: express.Response) => {
    try {
      const { userPortfolio, investAmount } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on this workspace. Please configure it in your Settings > Secrets panel." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = `You are Otter, a friendly, intelligent SUI network investment assistant.
Your mission is to find and suggest the single most profitable SUI DeFi protocol or asset for a user seeking to deploy a specific investment amount of SUI.
The investment is sourced from their Flexible Yield balance.

Search the SUI ecosystem mentally (e.g., Cetus, Navi, Scallop, Aftermath, Haedal, Suilend, Kriya, Turbos, Volo) for the highest APR/APY pool or lending rate that can accept an investment of the given SUI amount.

Structure your response strictly in JSON matching this schema:
{
  "summary": "Greeting from Otter. Brief analysis of their oWealth Flexible balance and confirmation of the amount they want to invest.",
  "recommendedAsset": "Name of the single most profitable SUI protocol/asset found (e.g. Cetus SUI/USDC Liquidity Pool, Navi Protocol SUI Supply)",
  "apy": 1.5 to 45.0 number (representing expected annualized percentage rate, e.g. 18.5),
  "durationSec": 120 to 600 integer (suggested duration in seconds before Otter automatically redeems the investment and places it back in Flexible savings, e.g. 300 for 5 minutes),
  "rationale": "Direct, professional DeFi analysis explaining why this is the highest yielding and most suitable choice for their investment.",
  "allProtocols": [
    {
      "name": "Full Protocol/Asset Name",
      "apy": 1.5 to 45.0 number,
      "risk": "Low" | "Medium" | "High",
      "description": "Short explanation of how this yield is generated."
    }
  ]
}
Make sure all numbers are JSON numbers (no quotes) and your JSON is valid. Keep the tone friendly, smart, and Otter-themed!`;

      const userPrompt = `I want to invest ${investAmount || 50} SUI of my oWealth Flexible savings. 
My current flexible savings balance is ${userPortfolio?.flexibleBalance || 0} SUI. 
Find the most profitable protocol on SUI that my SUI tokens can be invested in!`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text.trim()));
    } catch (err: any) {
      console.error("Gemini advice API error:", err);
      res.status(500).json({ error: err.message || "Failed to generate investment advice." });
    }
  });

  // Vite development middleware vs production bundle static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fullstack SUIWealth Server listening on port ${PORT}`);
  });
}

startServer();
