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
      const { userPortfolio } = req.body;
      
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

      const systemPrompt = `You are a legendary Decentralized Finance (DeFi) Yield Optimization architect and SUI network investment advisor.
Your mission is to provide highly precise, actionable, and mathematically sound protocol advice based strictly on the user's specific current portfolio.

Specifically: The user wants to invest their "oWealth Flexible Savings Balance" (which yields 4.85% variable APY with instant liquidity) by reallocating a portion of it into other high-yield SUIWealth vehicles:
1. oWealth Flexible Savings (variable 4.85% APY, instant liquidity)
2. Fixed Deposit Lockups (6.25% to 12.00% APY, locking options)
3. Target Savings (saving goals)

Advise the user on the optimal percentage breakdown to split their *oWealth Flexible Savings balance* across these three categories.

Formulate a sophisticated, tailored SUI yield optimization plan.

Structure your response strictly in JSON matching this schema:
{
  "summary": "High-level diagnostic summary of their SUI asset allocation, focusing strictly on how they should allocate capital from their oWealth Flex balance into other high-yield options.",
  "riskScore": 1 to 10 (where 1 is fully conservative cash, and 10 is maximum fixed locks),
  "recommendations": [
    {
      "protocol": "Flexible Savings" | "Fixed Deposits" | "Target Savings",
      "allocationPercentage": 0 to 100 integer,
      "rationale": "Logical DeFi rationale detailing why this percentage of their oWealth Flex balance should be allocated here.",
      "tacticalSteps": "User-facing instructions explaining exactly how to setup or fund this allocation inside our application widgets."
    }
  ],
  "marketInsights": [
    "A SUI network ecosystem metric or risk profile insight regarding yield streams, validator nodes state, or liquid staking derivative safety relevant to current SUI rates."
  ]
}
Ensure that recommended allocation percentages are integers summing exactly to 100.
Avoid referencing any external protocols other than these three. Keep the language highly professional, realistic, and inspiring.`;

      const userPrompt = `Analyse my balance configuration. Recommend how to split and invest my current *oWealth Flexible Savings Balance* (${userPortfolio?.flexibleBalance || 0} SUI) into high-yield folders:
- Wallet Public Address: ${userPortfolio?.suiAddress || '0x3f5c...92a1'}
- Liquid Spending Balance (For information only): ${userPortfolio?.spendingBalance || 0} SUI
- CURRENT oWealth Flexible Savings Balance (The Capital to split & invest): ${userPortfolio?.flexibleBalance || 0} SUI
- Current Fixed Deposit Locked Contracts: ${userPortfolio?.fixedBalance || 0} SUI
- Current Target Metric Goals Balance: ${userPortfolio?.targetBalance || 0} SUI
- Total Yield Accumulated: ${userPortfolio?.accumulatedYield || 0} SUI`;

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
