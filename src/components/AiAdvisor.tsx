/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Brain, 
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
  Compass
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
  onApplyRatio: (policy: 'balanced' | 'save_more_1_5x' | 'save_more_2x') => void;
  onReallocFlexible?: (allocations: { flexiblePct: number; fixedPct: number; targetPct: number }) => void;
}

interface AdviceResponse {
  summary: string;
  riskScore: number;
  recommendations: Array<{
    protocol: "Flexible Savings" | "Fixed Deposits" | "Target Savings";
    allocationPercentage: number;
    rationale: string;
    tacticalSteps: string;
  }>;
  marketInsights: string[];
}

export default function AiAdvisor({ userPortfolio, onBack, onApplyRatio, onReallocFlexible }: AiAdvisorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showSmartContractCode, setShowSmartContractCode] = useState<boolean>(false);

  const loadingSequence = [
    "Analyzing Wallet SUI address balances...",
    "Querying SUI protocol smart contracts variable state...",
    "Validating transactional stream velocity ratios...",
    "Assembling multi-tenure lock APY potentials using Gemini Pro...",
    "Refining custom risk metrics against variable 4.85% compound vaults...",
    "Formatting custom execution paths..."
  ];

  const fetchAdvice = async () => {
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
        body: JSON.stringify({ userPortfolio }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "System error fetching yield recommendations.");
      }

      const recommendation: AdviceResponse = await response.json();
      setAdvice(recommendation);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Unable to reach SUIWealth AI Advisor. Verify GEMINI_API_KEY is configured.");
    } finally {
      clearInterval(sequenceInterval);
      setLoading(false);
    }
  };

  const mapProtocolToPolicy = (rec: "Flexible Savings" | "Fixed Deposits" | "Target Savings") => {
    if (rec === "Fixed Deposits") return 'save_more_2x';
    if (rec === "Target Savings") return 'save_more_1_5x';
    return 'balanced';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return { text: "Conservative Saver", color: "text-green-400 bg-green-950/40 border-green-900/50" };
    if (score <= 7) return { text: "Balanced Yield Farmer", color: "text-blue-400 bg-blue-950/40 border-blue-900/50" };
    return { text: "Yield Aggressive Maximizer", color: "text-amber-400 bg-amber-950/40 border-amber-900/50" };
  };

  const getPctForProtocol = (name: "Flexible Savings" | "Fixed Deposits" | "Target Savings") => {
    if (!advice) return 0;
    const rec = advice.recommendations.find(r => r.protocol === name);
    return rec ? rec.allocationPercentage : 0;
  };

  const flexiblePct = getPctForProtocol("Flexible Savings");
  const fixedPct = getPctForProtocol("Fixed Deposits");
  const targetPct = getPctForProtocol("Target Savings");

  const moveContractCode = `module suiwealth::suiwealth {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::clock::{Self, Clock};

    // --- Structures & Capabilities ---
    public struct SharedProtocolVault has key {
        id: UID,
        total_flexible_balance: Balance<SUI>,
        accumulated_flexible_interest: u64,
        total_active_lock_contracts: u64,
        base_flexible_apy_bps: u64,
    }

    public struct FixedLocker has key, store {
        id: UID,
        owner: address,
        principal: Balance<SUI>,
        start_timestamp_ms: u64,
        duration_ms: u64,
        apy_bps: u64,
        is_active: bool,
    }

    public struct SavingsGoal has key, store {
        id: UID,
        title: vector<u8>,
        target_amount_sui: u64,
        balance: Balance<SUI>,
        is_completed: bool,
    }

    public entry fun deposit_flexible(vault: &mut SharedProtocolVault, coin: Coin<SUI>, ctx: &mut TxContext) { ... }
    public entry fun withdraw_flexible(vault: &mut SharedProtocolVault, amount: u64, ctx: &mut TxContext) { ... }
    public entry fun create_fixed_locker(vault: &mut SharedProtocolVault, coin: Coin<SUI>, duration_ms: u64, apy_bps: u64, clock: &Clock, ctx: &mut TxContext) { ... }
    public entry fun fund_savings_goal(goal: &mut SavingsGoal, coin: Coin<SUI>, ctx: &mut TxContext) { ... }
}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-5xl mx-auto pb-12 px-4"
    >
      {/* Visual Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.03, x: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800/80 border border-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Back to Hub Dashboard</span>
        </motion.button>
        <span className="text-[10px] bg-blue-950/50 border border-blue-900/50 text-blue-300 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <Bot className="w-3.5 h-3.5 text-blue-400" />
          <span>AI Copilot Active</span>
        </span>
      </div>

      {/* Main Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: SUI Wallet Telemetry & Advisor Call */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-black/60 border border-zinc-900 p-5 rounded-3xl shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-bold text-sm">Asset Telemetry</h3>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal mb-5 font-medium">
              The AI Copilot aggregates flexible deposits, locking tenures, and stream speeds to compute optimal allocations strictly using your interest-bearing oWealth Flex pool.
            </p>

            <div className="space-y-3 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between items-center py-2 border-b border-slate-850">
                <span className="text-slate-500">Liquid Cash:</span>
                <span className="font-bold text-white">{userPortfolio.spendingBalance.toFixed(2)} SUI</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-850">
                <span className="text-slate-500">oWealth Flex:</span>
                <span className="font-bold text-green-400">{userPortfolio.flexibleBalance.toFixed(2)} SUI</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-850">
                <span className="text-slate-500">Fixed Locks:</span>
                <span className="font-bold text-blue-400">{userPortfolio.fixedBalance.toFixed(2)} SUI</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-850">
                <span className="text-slate-500">Target Goals:</span>
                <span className="font-bold text-indigo-400">{userPortfolio.targetBalance.toFixed(2)} SUI</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-bold text-slate-400">Earned Yields:</span>
                <span className="font-bold text-yellow-405 text-amber-400 font-extrabold">+{userPortfolio.accumulatedYield.toFixed(3)} SUI</span>
              </div>
            </div>

            <motion.button
              onClick={fetchAdvice}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>{loading ? "Computing Advice..." : "Review Yield Portfolios"}</span>
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-900 space-y-3"
          >
            <div className="text-[11px] text-slate-400 leading-normal flex gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Asset Sourcing:</strong> The AI portfolio rebalancer acts directly upon the <strong>oWealth Flex SUI balance</strong>, serving as the fluid investment seed capital for specialized yield lockups.
              </span>
            </div>

            <div className="border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setShowSmartContractCode(!showSmartContractCode)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>View SUI Move Smart Contract</span>
                </span>
                {showSmartContractCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showSmartContractCode && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2.5 p-3 bg-black/60 rounded-lg text-[9px] font-mono text-zinc-350 border border-zinc-900 overflow-x-auto max-h-[220px]"
                  >
                    <span className="text-zinc-500 block mb-1 font-semibold">// SUIWealth smart contract (move/suiwealth/sources/suiwealth.move)</span>
                    <pre>{moveContractCode}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right Column: AI Co-Pilot Advice Results */}
        <div className="lg:col-span-8 space-y-6">
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
                  <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-white font-bold text-base">DeFi Strategy Evaluation System</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
                  Generate customized asset-split recommendations tailored for Sui vaults based on the current oWealth Flexible savings wallet telemetry.
                </p>
                <motion.button
                  onClick={fetchAdvice}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-950/60 hover:bg-blue-900/60 text-blue-400 border border-blue-800/60 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Initiate AI Portfolio Diagnostics</span>
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
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 animate-pulse" />
                
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                </div>

                <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                  Compiling Intelligent Allocation Recommendations
                </h4>
                
                <p className="text-xs text-blue-400 font-mono mt-3 animate-pulse bg-blue-950/35 border border-blue-900/30 px-3.5 py-1.5 rounded-xl max-w-md">
                  {loadingMessage}
                </p>

                <p className="text-[10px] text-slate-500 mt-12 max-w-xs leading-normal">
                  Our system evaluates interest yields, lockdown durations, and network fees so you maintain optimal asset ratios.
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
                <h4 className="text-white font-bold text-sm">Advice Generation Failed</h4>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
                  {errorMsg}
                </p>
                <motion.button
                  onClick={fetchAdvice}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Retry Portfolio Analysis
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
                {/* Risk and Exec summary block */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                        <Percent className="w-5 h-5 text-blue-400" />
                        <span>DeFi Yield Portfolio Assessment</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        Based on algorithmic risk telemetry matched with variable and fixed tenures.
                      </p>
                    </div>

                    {/* Risk Badge & Scale */}
                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[10px] text-slate-400">Risk Score:</span>
                        <div className="flex items-center">
                          {[1,2,3,4,5,6,7,8,9,10].map(dot => (
                            <div 
                              key={dot} 
                              className={`w-2.5 h-2.5 rounded-full mx-[2px] border border-slate-950 transition-all duration-500 ${
                                dot <= advice.riskScore 
                                  ? advice.riskScore <= 3 
                                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                                    : advice.riskScore <= 7 
                                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                                      : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                  : 'bg-slate-800'
                              }`} 
                              title={`Risk Scale Level ${dot}`}
                            />
                          ))}
                          <span className="ml-1.5 text-xs text-white font-black">{advice.riskScore}/10</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border font-sans mt-2 tracking-wider ${getRiskLabel(advice.riskScore).color}`}>
                        {getRiskLabel(advice.riskScore).text}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl mb-4 italic">
                    "{advice.summary}"
                  </p>

                  {/* ACTIVE REBALANCE ACTION - FUNDS SOURCED FROM OWEALTH FLEXIBLE SAVINGS */}
                  {onReallocFlexible && userPortfolio.flexibleBalance > 0 && (
                    <motion.div 
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-blue-950/20 border border-blue-900/35 p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-blue-400 block mb-0.5 uppercase tracking-wide flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                          <span>Execute Instant oWealth Rebalance</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Reallocate your current <strong className="text-green-400 font-mono text-xs">{userPortfolio.flexibleBalance.toFixed(2)} SUI</strong> oWealth Flex SUI into:
                          <span className="block mt-1 space-x-2 font-mono text-[10px] text-slate-400">
                            <span>oWealth Flex ({flexiblePct}%): <strong className="text-white">{(userPortfolio.flexibleBalance * flexiblePct / 100).toFixed(1)} SUI</strong></span>
                            <span>•</span>
                            <span>Fixed Locks ({fixedPct}%): <strong className="text-white">{(userPortfolio.flexibleBalance * fixedPct / 100).toFixed(1)} SUI</strong></span>
                            <span>•</span>
                            <span>Target Goals ({targetPct}%): <strong className="text-white">{(userPortfolio.flexibleBalance * targetPct / 100).toFixed(1)} SUI</strong></span>
                          </span>
                        </p>
                      </div>

                      <motion.button
                        onClick={() => onReallocFlexible({ flexiblePct, fixedPct, targetPct })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-white shrink-0 animate-bounce" />
                        <span>Reallocate Balance NOW</span>
                      </motion.button>
                    </motion.div>
                  )}

                  {userPortfolio.flexibleBalance <= 0 && (
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-center">
                      <p className="text-[11px] text-slate-400 font-medium">
                        Depositing SUI into <strong>oWealth Flexible Savings</strong> first will enable instant AI rebalancing transactions directly into other high-yield lockups.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recommendations bento cards */}
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2 font-sans pl-1">
                  Proposed Allocation Protocols Split
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {advice.recommendations.map((rec, idx) => {
                    const policy = mapProtocolToPolicy(rec.protocol);
                    let accentTheme = 'text-green-400 bg-green-950/20 border-green-905 border-green-900/40 hover:border-green-800';
                    if (rec.protocol === "Fixed Deposits") accentTheme = 'text-blue-400 bg-blue-950/20 border-blue-900/40 hover:border-blue-800';
                    if (rec.protocol === "Target Savings") accentTheme = 'text-indigo-400 bg-indigo-950/20 border-indigo-900/40 hover:border-indigo-800';

                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                        className={`p-4.5 border rounded-2xl relative transition-all flex flex-col justify-between ${accentTheme}`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{rec.protocol}</span>
                            <span className="text-xl font-bold font-mono text-white tracking-tight">{rec.allocationPercentage}%</span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-normal mb-3 font-medium">
                            {rec.rationale}
                          </p>

                          <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl mb-4">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Execution Steps:</span>
                            <p className="text-[10px] text-slate-300 leading-normal font-sans italic">{rec.tacticalSteps}</p>
                          </div>
                        </div>

                        {rec.allocationPercentage > 0 && (
                          <motion.button
                            onClick={() => onApplyRatio(policy)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full text-center py-2 text-[9px] font-extrabold bg-zinc-900 hover:bg-zinc-800 text-blue-400 hover:text-white border border-zinc-800 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-blue-300 shrink-0" />
                            <span>Set Auto-Router Policy</span>
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Market Insights block with search highlights */}
                <div className="bg-black/40 border border-zinc-900 rounded-2xl p-5">
                  <div className="flex items-center gap-1.5 mb-3.5 pb-2 border-b border-slate-800/65">
                    <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse animate-bounce" />
                    <h4 className="text-[11px] font-extrabold text-slate-305 text-slate-300 uppercase tracking-wider">
                      SUI Consensus & Variable Yield Market Insights
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {advice.marketInsights.map((insight, index) => (
                      <motion.li 
                        key={index} 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        className="text-xs text-slate-400 leading-relaxed font-sans flex items-start gap-2"
                      >
                        <span className="bg-blue-950 text-blue-400 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black font-mono mt-0.5 shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-medium">{insight}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
