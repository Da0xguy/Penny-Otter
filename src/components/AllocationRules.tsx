/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AllocationRule, TargetSavingsPlan } from '../types';
import { ShieldCheck, CheckCircle2, Layers, HelpCircle, Target, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AllocationRulesProps {
  rules: AllocationRule[];
  setRules: React.Dispatch<React.SetStateAction<AllocationRule[]>>;
  targets: TargetSavingsPlan[];
  spendAndSaveEnabled: boolean;
  setSpendAndSaveEnabled: (val: boolean) => void;
  spendAndSavePercentage: number;
  setSpendAndSavePercentage: (val: number) => void;
  
  routingRatioPolicy: 'balanced' | 'save_more_1_5x' | 'save_more_2x';
  setRoutingRatioPolicy: (val: 'balanced' | 'save_more_1_5x' | 'save_more_2x') => void;
}

export default function AllocationRules({
  rules,
  setRules,
  targets,
  spendAndSaveEnabled,
  setSpendAndSaveEnabled,
  spendAndSavePercentage,
  setSpendAndSavePercentage,
  routingRatioPolicy,
  setRoutingRatioPolicy,
}: AllocationRulesProps) {

  // Helper to check if a specific rule destination is active
  const isDestActive = (dest: 'flexible' | 'target') => {
    return rules.some(r => r.destination === dest && r.isActive);
  };

  // Helper to toggle active destination
  const handleToggleDest = (dest: 'flexible' | 'target') => {
    setRules(prev => prev.map(rule => {
      if (rule.destination === dest) {
        return { ...rule, isActive: !rule.isActive };
      }
      return rule;
    }));
  };

  // Helper to select target goal
  const handleSelectTarget = (targetId: string) => {
    setRules(prev => prev.map(rule => {
      if (rule.destination === 'target') {
        return { ...rule, targetGoalId: targetId };
      }
      return rule;
    }));
  };

  const getPolicyDetails = () => {
    switch (routingRatioPolicy) {
      case 'balanced':
        return {
          title: 'Balanced Model (1:1 Ratio)',
          spend: '50%',
          save: '50%',
          desc: 'For every 1 SUI kept for liquid spending, exactly 1 SUI goes to your automated savings.'
        };
      case 'save_more_1_5x':
        return {
          title: 'Accelerated Saver (1.5:1 Ratio)',
          spend: '40%',
          save: '60%',
          desc: 'Savings are boosted! For every 1 SUI kept for liquid spending, 1.5 SUI goes to your automated savings.'
        };
      case 'save_more_2x':
        return {
          title: 'Maximum Saver (2:1 Ratio)',
          spend: '33.3%',
          save: '66.7%',
          desc: 'Unleash extreme savings! For every 1 SUI kept for liquid spending, 2 SUI goes to your automated savings.'
        };
    }
  };

  const currentPolicy = getPolicyDetails();

  return (
    <motion.div 
      id="allocation-rules-panel" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Premium ambient light decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg font-sans">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>PayStream Auto-Router Rules</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans font-medium">
            Atomic Ratio-based routing for all incoming transactions. No manual percentage calculations needed!
          </p>
        </div>
        
        <div className="bg-blue-950/40 border border-blue-500/20 px-3 py-10 px-3 py-1 rounded-full text-[10px] font-bold text-blue-300 tracking-wide uppercase font-mono backdrop-blur-md">
          Ratio Mode Active
        </div>
      </div>

      {/* SECTION 1: CHOOSE THE DYNAMIC TARGET WEALTH RATIO POLICY */}
      <div className="mb-6">
        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-sans">
          <span>1. Select Auto-Routing Split Ratio Policy</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {(['balanced', 'save_more_1_5x', 'save_more_2x'] as const).map((policy) => {
            const isSelected = routingRatioPolicy === policy;
            let label = 'Balanced (1:1)';
            let ratioLabel = 'Amount Saved = Amount Kept';
            let ratioClass = 'text-green-400';
            if (policy === 'save_more_1_5x') {
              label = 'Accelerated (1.5:1)';
              ratioLabel = 'Amount Saved › Amount Kept';
              ratioClass = 'text-blue-400';
            } else if (policy === 'save_more_2x') {
              label = 'Maximum (2:1)';
              ratioLabel = 'Amount Saved = 2x Kept';
              ratioClass = 'text-indigo-400';
            }

            return (
              <motion.button
                key={policy}
                id={`policy-btn-${policy}`}
                type="button"
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRoutingRatioPolicy(policy)}
                className={`p-4 rounded-2xl text-left border relative cursor-pointer overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/25 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-100'
                }`}
              >
                {isSelected && (
                  <motion.div 
                    layoutId="activePolicyAccent" 
                    className="absolute inset-0 border border-blue-500/30 rounded-2xl pointer-events-none" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex justify-between items-center mb-1 relative z-10">
                  <span className="text-xs font-bold text-white pb-0.5">{label}</span>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    </motion.div>
                  )}
                </div>
                <div className={`text-[10px] font-bold font-mono uppercase relative z-10 ${ratioClass}`}>
                  {ratioLabel}
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-tight mt-2 relative z-10">
                  {policy === 'balanced' && 'Splits split incoming 50% for spend, 50% for savings.'}
                  {policy === 'save_more_1_5x' && 'Splits split incoming 40% for spend, 60% for savings.'}
                  {policy === 'save_more_2x' && 'Splits split incoming 33% for spend, 67% for savings.'}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CONFIGURE THE ACTIVE AUTOMATED DESTINATIONS (EXCLUDE FIXED ACCORDING TO USER DIRECTIVE) */}
      <div className="mb-6 bg-white/[0.01] border border-white/5 rounded-2xl p-4.5">
        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3.5 flex items-center justify-between font-sans">
          <span>2. Toggled Active Savings Destinations</span>
          <span className="text-[10px] lowercase bg-black/20 text-slate-400 border border-white/5 font-sans px-2.5 py-0.5 rounded font-bold">
            splits split equally among active goals
          </span>
        </h4>

        <div className="space-y-3.5">
          {/* Flexible Savings Option */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`flex items-start md:items-center justify-between gap-4 p-3.5 rounded-xl border transition-all ${
              isDestActive('flexible') 
                ? 'bg-blue-500/[0.05] border-blue-500/20' 
                : 'bg-white/[0.01] border-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="toggle-flex"
                checked={isDestActive('flexible')}
                onChange={() => handleToggleDest('flexible')}
                className="w-4 h-4 mt-0.5 md:mt-0 text-blue-500 bg-slate-950 border-slate-850 rounded focus:ring-blue-500 focus:ring-offset-[#030712] cursor-pointer"
              />
              <div>
                <label htmlFor="toggle-flex" className="text-xs font-bold text-slate-200 cursor-pointer block">
                  Flexible Savings (oWealth Vault)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Continuous compound APY yield generator</span>
              </div>
            </div>
            <AnimatePresence>
              {isDestActive('flexible') && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-mono font-bold bg-green-950/45 text-green-400 px-2.5 py-0.5 border border-green-900/40 rounded shadow-sm"
                >
                  ACTIVE RE-ROUTE
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Target Savings Goal Option */}
          <motion.div 
            layout="position"
            className={`flex flex-col p-3.5 rounded-xl border transition-all ${
              isDestActive('target') 
                ? 'bg-blue-500/[0.05] border-blue-500/20' 
                : 'bg-white/[0.01] border-white/5'
            }`}
          >
            <div className="flex items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="toggle-target"
                  checked={isDestActive('target')}
                  onChange={() => handleToggleDest('target')}
                  className="w-4 h-4 mt-0.5 md:mt-0 text-blue-500 bg-slate-950 border-slate-850 rounded focus:ring-blue-500 focus:ring-offset-[#030712] cursor-pointer"
                />
                <div>
                  <label htmlFor="toggle-target" className="text-xs font-bold text-slate-200 cursor-pointer block">
                    Target Savings Goals
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Atomic routing towards securing locked target goal limits</span>
                </div>
              </div>
              <AnimatePresence>
                {isDestActive('target') && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-[10px] font-mono font-bold bg-green-950/20 text-green-400 px-2.5 py-0.5 border border-green-500/20 rounded flex-shrink-0"
                  >
                    ACTIVE RE-ROUTE
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
              {isDestActive('target') && targets.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-white/5 pt-3 flex items-center gap-3"
                >
                  <label htmlFor="target-goal-selector" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    <span>Destination Plan:</span>
                  </label>
                  <div className="relative">
                    <select
                      id="target-goal-selector"
                      value={rules.find(r => r.destination === 'target')?.targetGoalId || ''}
                      onChange={(e) => handleSelectTarget(e.target.value)}
                      className="glass-input text-xs text-slate-200 rounded-lg outline-none pl-2.5 pr-8 py-1.5 font-medium cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-[#0b101c]">Select Target Plan</option>
                      {targets.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#0b101c]">{t.name} (Goal: {t.targetAmountSui} SUI)</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-3.5 text-[10px] text-slate-400 flex items-start gap-1.5 font-sans leading-normal">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            Fixed Deposits are excluded from automatic routing rules so you can manually write, lock, and customize precise sets of cash easily.
          </span>
        </div>
      </div>

      {/* SECTION 3: RE-CONFIGURED SPEND & SAVE ENGINE (NO PERCENTAGES!) */}
      <div className="p-4.5 bg-blue-500/[0.04] border border-blue-500/10 rounded-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="spend-save-toggle"
              checked={spendAndSaveEnabled}
              onChange={(e) => setSpendAndSaveEnabled(e.target.checked)}
              className="w-4 h-4 mt-1 text-blue-500 bg-[#080d19] border border-white/10 rounded focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer"
            />
            <div>
              <label htmlFor="spend-save-toggle" className="text-sm font-extrabold text-white cursor-pointer flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Enable Spend & Save Autopilot</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
                Atomic safety router: whenever you spend / transfer SUI outward, an equivalent or higher amount is automatically moved directly into Flexible savings.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {spendAndSaveEnabled && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-3.5 border-t border-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <span className="font-extrabold text-[#94a3b8] uppercase text-[10px] tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Selected Autopilot Save Multiplier:</span>
              </span>
              <div className="flex bg-black/25 rounded-lg p-1 border border-white/5">
                {([100, 150, 200] as const).map((ratioPct) => {
                  const isActive = spendAndSavePercentage === ratioPct;
                  let multiplierLabel = '1:1 Equal';
                  let tag = 'Amount Saved = Amount Spent';
                  if (ratioPct === 150) {
                    multiplierLabel = '1.5x Plus';
                  } else if (ratioPct === 200) {
                    multiplierLabel = '2x Double';
                  }

                  return (
                    <motion.button
                      key={ratioPct}
                      id={`spend-save-ratio-${ratioPct}`}
                      title={tag}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSpendAndSavePercentage(ratioPct)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none bg-transparent ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {multiplierLabel}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SUMMARY DISPLAY OF ACTIVE RATIO ALLOCATION */}
      <div className="mt-5 p-3 flex justify-between bg-black/20 border border-white/5 rounded-xl text-xs font-sans text-slate-400 font-semibold gap-2 flex-wrap">
        <span>Current Active Auto-Router Split Style:</span>
        <span className="text-blue-400 font-bold font-mono">
          Spending: {currentPolicy.spend} / Savings: {currentPolicy.save} (
          {isDestActive('flexible') && isDestActive('target') ? 'Flexible & Target Goal split' : ''}
          {isDestActive('flexible') && !isDestActive('target') ? 'All to Flexible' : ''}
          {!isDestActive('flexible') && isDestActive('target') ? 'All to Target Goal' : ''}
          {!isDestActive('flexible') && !isDestActive('target') ? 'All held in Spending Pool' : ''}
          )
        </span>
      </div>
    </motion.div>
  );
}
