/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Percent, 
  ExternalLink,
  Bot,
  AlertTriangle,
  Flame,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Coins,
  TrendingUp,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiAdvisorProps {
  userPortfolio: {
    suiAddress: string;
    spendingBalance: number;
    flexibleBalance: number;
    fixedBalance: number;
    targetBalance: number;
    accumulatedYield: number;
  };
  onBack: () => void;
  onInvest: (protocol: string, amount: number, apy: number, durationSec: number, rationale: string) => void;
}

interface AdviceResponse {
  summary: string;
  recommendedAsset: string;
  apy: number;
  durationSec: number;
  rationale: string;
  allProtocols: Array<{
    name: string;
    apy: number;
    risk: 'Low' | 'Medium' | 'High';
    description: string;
  }>;
}

export default function AiAdvisor({ userPortfolio, onBack, onInvest }: AiAdvisorProps) {
  const [investAmountRaw, setInvestAmountRaw] = useState<string>(() => {
    // Default to 50% of flexible yield balance up to a clean integer, or 10
    const half = Math.floor(userPortfolio.flexibleBalance / 2);
    return half > 5 ? String(half) : '10';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const loadingSequence = [
    "Checking oWealth Flexible savings ledger...",
    "Querying SUI core validator state channels...",
    "Scanning Cetus, Navi, and Suilend liquidity pools...",
    "Retrieving profitable yield models through Otter AI...",
    "Assembling multi-protocol risk ratings...",
    "Formulating optimal autopilot deployment parameters..."
  ];

  const fetchAdvice = async () => {
    const amt = parseFloat(investAmountRaw);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Please specify a valid SUI amount to invest.");
      return;
    }
    if (amt > userPortfolio.flexibleBalance) {
      setErrorMsg(`Your investment amount (${amt} SUI) exceeds your oWealth Flexible Savings balance (${userPortfolio.flexibleBalance.toFixed(2)} SUI).`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setAdvice(null);

    let seqIdx = 0;
    setLoadingMessage(loadingSequence[0]);
    const sequenceInterval = setInterval(() => {
      seqIdx = (seqIdx + 1) % loadingSequence.length;
      setLoadingMessage(loadingSequence[seqIdx]);
    }, 1500);

    try {
      const response = await fetch('/api/gemini/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userPortfolio,
          investAmount: amt
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "System error fetching yield recommendations.");
      }

      const recommendation: AdviceResponse = await response.json();
      setAdvice(recommendation);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Unable to reach Otter AI. Please verify GEMINI_API_KEY is configured.");
    } finally {
      clearInterval(sequenceInterval);
      setLoading(false);
    }
  };

  const activeAmount = parseFloat(investAmountRaw) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-5xl mx-auto pb-12 px-4"
    >
      {/* Visual Navigation Bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-5">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.03, x: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Back to Hub Dashboard</span>
        </motion.button>
        <span className="text-[10px] bg-blue-950/50 border border-blue-900/50 text-blue-300 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <Bot className="w-3.5 h-3.5 text-blue-400" />
          <span>Otter AI Autopilot Active</span>
        </span>
      </div>

      {/* Main Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Otter SUI Capital Controller */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="glass-panel p-5 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-blue-450 text-blue-400" />
              <h3 className="text-white font-bold text-sm font-mono uppercase tracking-wider">Deploy Yield Capital</h3>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal mb-5">
              Otter AI specializes in reading your **oWealth Flexible savings balance** (<span className="text-emerald-400 font-bold font-mono">0.001% weekly yield</span>) and searching the SUI network for the single most lucrative protocols (Cetus, Suilend, Navi, etc.) that can securely yield maximum profits for that specific range of SUI.
            </p>

            <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl space-y-2.5 mb-5 font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 font-medium">oWealth Flex Pool:</span>
                <span className="font-extrabold text-emerald-400 font-mono">{userPortfolio.flexibleBalance.toFixed(4)} SUI</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                <span className="text-slate-450 font-medium">Weekly Accrued Speed:</span>
                <span className="font-bold text-slate-300 font-mono text-[10px]">~0.001% of balance</span>
              </div>
            </div>

            {/* Input investment slider / input field */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                How much SUI tokens would you like to invest?
              </label>
              
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={userPortfolio.flexibleBalance}
                  value={investAmountRaw}
                  onChange={(e) => setInvestAmountRaw(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full glass-input rounded-xl pl-3 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none"
                />
                <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInvestAmountRaw(String(Math.floor(userPortfolio.flexibleBalance / 2)))}
                    className="bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-805"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestAmountRaw(String(Math.floor(userPortfolio.flexibleBalance)))}
                    className="bg-[#1d4ed8]/30 hover:bg-[#1d4ed8]/55 text-blue-300 hover:text-white text-[9px] font-black px-2 py-1.5 rounded-lg transition-all cursor-pointer border border-blue-900/30"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Range Slider for convenience */}
              <input
                type="range"
                min="1"
                max={Math.max(1, Math.floor(userPortfolio.flexibleBalance))}
                value={activeAmount || 1}
                onChange={(e) => setInvestAmountRaw(e.target.value)}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <motion.button
              onClick={fetchAdvice}
              disabled={loading || activeAmount <= 0 || activeAmount > userPortfolio.flexibleBalance}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>{loading ? "Otter is Searching..." : "Search Profitable Assets on SUI"}</span>
            </motion.button>
          </motion.div>

          {/* Otter Friendly Banner Card */}
          <div className="bg-black/40 border border-zinc-900 p-4 rounded-2xl flex items-start gap-3">
            <span className="text-2xl mt-0.5">🦦</span>
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Meet Otter, Your Autopilot Assistant</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Simply input how much you want to extract from oWealth Flexible yields. Otter scans decentralized pools to find the exact asset config with the absolute highest immediate payout rate, then coordinates secure automated redemption when maturity strikes!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Co-Pilot Advice Results */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* INITIAL STATE */}
            {!loading && !advice && !errorMsg && (
              <motion.div
                key="advisor-initial"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel border-dashed rounded-3xl p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[360px]"
              >
                <div className="bg-blue-950/30 border border-blue-900/30 p-4 rounded-full mb-4">
                  <Bot className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-base">Otter Search Intelligence</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
                  Enter an investment size on the left. Otter will check online decentralized liquidity networks on SUI to spot premium high-yield protocols.
                </p>
                <motion.button
                  onClick={fetchAdvice}
                  disabled={activeAmount <= 0 || activeAmount > userPortfolio.flexibleBalance}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-950/60 hover:bg-blue-900/30 text-blue-450 hover:text-blue-400 text-blue-400 border border-blue-800/60 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Scan SUI Protocol Rates Now</span>
                </motion.button>
              </motion.div>
            )}

            {/* LOADING STATE */}
            {loading && (
              <motion.div
                key="advisor-loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel rounded-3xl p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-500 animate-pulse" />
                
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
                  <Bot className="w-6 h-6 text-emerald-450 absolute inset-0 m-auto" />
                </div>

                <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                  Otter is Hunting for Best SUI APYs
                </h4>
                
                <p className="text-xs text-emerald-400 font-mono mt-3 animate-pulse bg-emerald-950/35 border border-emerald-900/30 px-3.5 py-1.5 rounded-xl max-w-md">
                  {loadingMessage}
                </p>

                <p className="text-[10px] text-slate-500 mt-12 max-w-xs leading-normal">
                  Searching live liquidity pools, vaults, derivatives, and lending aggregators on the Sui network...
                </p>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {errorMsg && (
              <motion.div
                key="advisor-error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0b0c14] border border-rose-900/40 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center"
              >
                <div className="bg-rose-950/30 border border-rose-900/30 p-3.5 rounded-full mb-3.5 animate-bounce">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-white font-bold text-sm">Deployment Check Failed</h4>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
                  {errorMsg}
                </p>
                <motion.button
                  onClick={fetchAdvice}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none"
                >
                  Retry Search
                </motion.button>
              </motion.div>
            )}

            {/* SUCCESS ADVICE RESULT PANELS */}
            {advice && (
              <motion.div
                key="advisor-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Most Profitable Asset Found */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border-2 border-emerald-500/20 shadow-emerald-900/5 shadow-2xl">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] px-3.5 py-1 rounded-bl-2xl uppercase font-mono tracking-wider">
                    Most Profitable SUI Asset Found
                  </div>

                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="p-2 bg-emerald-950/50 border border-emerald-900/50 rounded-xl text-emerald-400">
                      <Flame className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-sans font-black text-sm uppercase tracking-wider block">
                        {advice.recommendedAsset}
                      </h3>
                      <p className="text-[10px] text-slate-405 text-slate-400">
                        Top algorithmic yield yielders on SUI
                      </p>
                    </div>
                  </div>

                  {/* Highlights section */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4 font-mono">
                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-900">
                      <span className="text-[9px] text-slate-500 font-bold block mb-1">PROJECTED INTEREST:</span>
                      <span className="text-xl font-bold text-white tracking-tight">{advice.apy.toFixed(2)}% APY</span>
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-900">
                      <span className="text-[9px] text-slate-500 font-bold block mb-1">AUTOPILOT LOCK TIME:</span>
                      <span className="text-xl font-bold text-indigo-400 tracking-tight">{advice.durationSec}s <span className="text-[10px] font-sans">({(advice.durationSec / 60).toFixed(1)} mins)</span></span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-normal mb-5 font-sans italic bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                    "{advice.rationale}"
                  </p>

                  {/* Deploy Button */}
                  <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 block mb-0.5">Ready for deployment:</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Confirming will move <strong className="text-white font-mono">{activeAmount.toFixed(2)} SUI</strong> from your oWealth Flex into {advice.recommendedAsset}. Otter will auto-reap profits and put it back in flexible yield in {(advice.durationSec / 60).toFixed(0)} mins!
                      </p>
                    </div>
                    <motion.button
                      onClick={() => onInvest(advice.recommendedAsset, activeAmount, advice.apy, advice.durationSec, advice.rationale)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-none"
                    >
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>Confirm Investment</span>
                    </motion.button>
                  </div>
                </div>

                {/* Alternative protocols tested */}
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                  Alternative SUI Protocols Scanned
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advice.allProtocols && advice.allProtocols.map((proto, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-zinc-950 border border-zinc-90 w-full rounded-2xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-bold text-white">{proto.name}</span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-2 py-0.5 rounded-lg">~{proto.apy.toFixed(1)}% APY</span>
                        </div>
                        <p className="text-[10px] text-slate-405 text-slate-400 leading-normal font-sans mb-3">{proto.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold font-mono">
                        <span className="text-slate-500">RISK:</span>
                        <span className={proto.risk === 'Low' ? 'text-green-400' : proto.risk === 'Medium' ? 'text-amber-400' : 'text-rose-500'}>{proto.risk.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
