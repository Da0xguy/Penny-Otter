/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FixedDepositPlan } from '../types';
import { formatSui } from '../utils';
import { Lock, Timer, AlertTriangle, Coins, PiggyBank, Plus, HelpCircle, ChevronRight, Calculator, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FixedDepositsProps {
  plans: FixedDepositPlan[];
  onAddFixedDeposit: (amountSui: number, durationDays: number) => void;
  onWithdrawFixedDeposit: (planId: string) => void;
  onTopUpFixedDeposit: (planId: string, amountSui: number) => void;
  spendingBalance: number;
}

export default function FixedDeposits({
  plans,
  onAddFixedDeposit,
  onWithdrawFixedDeposit,
  onTopUpFixedDeposit,
  spendingBalance,
}: FixedDepositsProps) {
  const [showForm, setShowForm] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [duration, setDuration] = useState(90);
  const [errorMsg, setErrorMsg] = useState('');
  const [topUpActiveId, setTopUpActiveId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpError, setTopUpError] = useState('');

  // SUI progressive locked multipliers
  const getApyForDuration = (days: number): number => {
    switch (days) {
      case 30: return 7;
      case 90: return 10;
      case 180: return 14;
      case 360: return 20;
      default: return 10;
    }
  };

  const currentApy = getApyForDuration(duration);
  const expectedReturn = amountInput ? parseFloat(amountInput) * (1 + (currentApy / 100) * (duration / 365)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(amountInput);
    
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      return;
    }
    if (amt > spendingBalance) {
      setErrorMsg(`Insufficient Spending balance. You have ${formatSui(spendingBalance)}.`);
      return;
    }

    onAddFixedDeposit(amt, duration);
    setAmountInput('');
    setShowForm(false);
  };

  return (
    <motion.div 
      id="fixed-deposit-panel" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left"
    >
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg font-sans">
          <Lock className="w-5 h-5 text-blue-400" />
          <span>Post-Limit Fixed Deposit</span>
        </div>
        <motion.button
          id="btn-show-add-fixed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Fixed Deposit</span>
        </motion.button>
      </div>

      <p className="text-xs text-slate-400 mb-6 leading-relaxed font-sans mt-1 font-medium">
        Lock SUI for higher APY yields. Money remains locked; withdrawing prior to maturity triggers a premium 2% principal penalty fee enforced by SUI wealth controllers.
      </p>

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-455 text-rose-400 p-3 rounded-xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adding a Fixed Deposit Locker Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            onSubmit={handleSubmit} 
            id="add-fixed-form"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/[0.02] p-4.5 border border-white/5 rounded-2xl overflow-hidden space-y-4 text-left"
          >
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-blue-400" />
              <span>Lock SUI Security Ledger</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1.5 uppercase font-bold">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    id="fixed-deposit-amount-input"
                    required
                    placeholder="e.g. 100"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-medium"
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-sans">SUI</span>
                </div>

                {/* Quick select chips for manually choosing amount */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {[10, 50, 200, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(preset.toString())}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-350 font-mono font-bold rounded-lg border border-white/5 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                    >
                      {preset} SUI
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountInput(spendingBalance.toFixed(2))}
                    className="px-2.5 py-1 bg-blue-500/10 text-[10px] text-blue-400 font-sans font-extrabold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1.5 uppercase font-bold">Locking Period</label>
                <select
                  id="fixed-duration-select"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white text-xs focus:outline-none cursor-pointer font-medium"
                >
                  <option value={30}>30 Days (7% APY yield)</option>
                  <option value={90}>90 Days (10% APY yield)</option>
                  <option value={180}>180 Days (14% APY yield)</option>
                  <option value={360}>360 Days (20% APY yield)</option>
                </select>
              </div>
            </div>

            <AnimatePresence>
              {amountInput && parseFloat(amountInput) > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs font-mono text-blue-300 flex justify-between"
                >
                  <span>Expected Maturity Amount:</span>
                  <span className="font-bold text-blue-400">{formatSui(expectedReturn, 3)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex bg-amber-955/10 border border-amber-900/40 p-3.5 rounded-xl text-xs text-amber-300 gap-2 items-start text-left">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">
                <strong>Premature Liquidation Terms:</strong> This locker supports instant <strong>"Terminate Anytime with Yield"</strong>. If you withdraw early, a reduced <strong>2% early-claim penalty</strong> is applied on the principal balance.
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                id="submit-create-fixed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm cursor-pointer border-none"
              >
                Confirm Lock Deposit
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Lockers display */}
      <div className="space-y-4 relative">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-blue-400" />
          <span>Active Lock Investments</span>
        </h3>

        <AnimatePresence mode="popLayout">
          {plans.length === 0 ? (
            <motion.div 
              key="empty-fixed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10"
            >
              <Coins className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-sans font-semibold">No active locked deposit assets.</p>
              <p className="text-xs text-slate-500 mt-1 font-sans">Settle a locked contract to begin securing compound interest on SUI.</p>
            </motion.div>
          ) : (
            plans.map((plan) => {
              const daysLocked = Math.round((new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
              const remainingDays = Math.max(0, plan.durationDays - daysLocked);
              const mature = remainingDays === 0;

              // Penalty calculations
              const penaltyFee = plan.amountSui * 0.02; // 2% early penalty
              const accruedYield = plan.accruedYield || 0;
              const earlyWithdrawAmount = plan.amountSui + accruedYield - penaltyFee;

              return (
                <motion.div
                  key={plan.id}
                  id={`fixed-card-${plan.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-black/65 border border-white/[0.08] rounded-2xl p-4.5 flex flex-col gap-4 transition-all hover:bg-zinc-950/80 hover:border-zinc-800 text-left"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-blue-300 flex-shrink-0 flex items-center justify-center">
                        <Timer className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-white">
                            {formatSui(plan.amountSui, 2)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1 text-[11px] text-slate-450 font-sans font-semibold">
                          <span className="text-blue-400 font-extrabold">{plan.apy}% APY</span>
                          <span className="text-slate-700">•</span>
                          <span>Duration: {plan.durationDays} Days</span>
                          <span className="text-slate-700">•</span>
                          <span>Locked: {new Date(plan.startDate).toLocaleDateString()}</span>
                        </div>

                        {/* Topup capability */}
                        <div className="flex flex-col gap-1 mt-3.5">
                          <AnimatePresence mode="wait">
                            {topUpActiveId === plan.id ? (
                              <motion.div 
                                key="topup-form"
                                initial={{ opacity: 0, y: -5, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -5, height: 0 }}
                                className="overflow-hidden space-y-2 bg-zinc-950 border border-zinc-900 shadow-lg p-3 rounded-xl max-w-sm"
                              >
                                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Top Up Lock Size</label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <input
                                    type="number"
                                    step="any"
                                    id={`topup-input-${plan.id}`}
                                    placeholder="Amount SUI"
                                    value={topUpAmount}
                                    onChange={(e) => {
                                      setTopUpAmount(e.target.value);
                                      setTopUpError('');
                                    }}
                                    className="w-28 bg-black/60 border border-zinc-900 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-blue-500 font-medium"
                                  />
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const amt = parseFloat(topUpAmount);
                                      if (isNaN(amt) || amt <= 0) {
                                        setTopUpError('Enter valid amount.');
                                        return;
                                      }
                                      if (amt > spendingBalance) {
                                        setTopUpError('Insufficient balance.');
                                        return;
                                      }
                                      onTopUpFixedDeposit(plan.id, amt);
                                      setTopUpAmount('');
                                      setTopUpActiveId(null);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none"
                                  >
                                    Confirm
                                  </motion.button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTopUpActiveId(null);
                                      setTopUpAmount('');
                                      setTopUpError('');
                                    }}
                                    className="text-slate-400 hover:text-white text-[10px] font-bold px-1.5 py-1 cursor-pointer border-none bg-transparent"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {topUpError && <p className="text-[9px] text-rose-500 font-bold">{topUpError}</p>}
                              </motion.div>
                            ) : (
                              <motion.button
                                key="topup-trigger"
                                type="button"
                                id={`btn-trigger-topup-${plan.id}`}
                                whileHover={{ x: 1.5 }}
                                onClick={() => {
                                  setTopUpActiveId(plan.id);
                                  setTopUpAmount('');
                                  setTopUpError('');
                                }}
                                className="w-fit text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-all cursor-pointer border-none bg-transparent p-0"
                              >
                                <Plus className="w-3.5 h-3.5 text-blue-400" />
                                <span>Add more SUI to lock size</span>
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {mature ? (
                          <span className="text-[9px] font-bold bg-green-950/45 text-green-400 border border-green-900/60 px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-green-400 animate-ping" />
                            <span>Fully Mature</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-950/20 text-amber-405 text-amber-400 border border-amber-900/30 px-2.5 py-0.5 rounded font-mono">
                            {remainingDays} Days Left
                          </span>
                        )}
                      </div>

                      <motion.button
                        type="button"
                        id={`btn-withdraw-fixed-${plan.id}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!mature) {
                            const confirm = window.confirm(
                              `PennyOtter Early Release Protocol:\n\n` +
                              `Locked Capital: ${formatSui(plan.amountSui)} SUI\n` +
                              `Compounded Yield so far: +${formatSui(accruedYield, 6)} SUI\n` +
                              `Administrative Exit Fee (2%): -${formatSui(penaltyFee, 6)} SUI\n` +
                              `Net Cash Out: ${formatSui(earlyWithdrawAmount, 6)} SUI\n\n` +
                              `Are you sure you want to terminate this active investment early with 2% penalty?`
                            );
                            if (!confirm) return;
                          }
                          onWithdrawFixedDeposit(plan.id);
                        }}
                        className={`py-1.5 px-3 text-xs font-extrabold font-sans rounded-xl transition-all cursor-pointer border-none ${
                          mature
                            ? 'bg-green-600 text-white hover:bg-green-500'
                            : 'bg-[#ff3b3b]/10 text-[#ff4b4b] hover:bg-[#ff3b3b]/20 border border-solid border-[#ff4b4b]/30'
                        }`}
                      >
                        {mature ? 'Claim Locked Assets' : 'Terminate Anytime (2% Penalty)'}
                      </motion.button>
                    </div>
                  </div>

                  {/* Detailing Active Investment Accrued Yield and Net Cash-out value */}
                  <div className="p-3.5 bg-slate-900/40 border border-slate-800/40 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dynamic Yield Status</span>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
                        Live Compounding
                      </span>
                    </div>
                    
                    <div className="h-[1px] bg-slate-800/50 my-1" />

                    <div className="flex justify-between">
                      <span>Principal Value:</span>
                      <span className="text-white font-medium">{formatSui(plan.amountSui)} SUI</span>
                    </div>

                    <div className="flex justify-between text-green-400">
                      <span>Earned Yield (Claimable):</span>
                      <span className="font-extrabold">+{formatSui(accruedYield, 7)} SUI</span>
                    </div>

                    {!mature && (
                      <div className="flex justify-between text-red-400 text-[10px]">
                        <span>Premature Terminus Fee (2%):</span>
                        <span>-{formatSui(penaltyFee, 4)} SUI</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-white border-t border-slate-800/60 pt-1 text-xs">
                      <span>{mature ? 'Claimable Final Output:' : 'Immediate Redeem Value:'}</span>
                      <span className={mature ? 'text-green-400' : 'text-blue-400'}>
                        {formatSui(Math.max(0, earlyWithdrawAmount), 5)} SUI
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
