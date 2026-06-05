/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TargetSavingsPlan } from '../types';
import { formatSui } from '../utils';
import { Target, PlusCircle, Milestone, ShieldCheck, HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TargetSavingsProps {
  plans: TargetSavingsPlan[];
  onAddPlan: (name: string, targetAmountSui: number, maturityDate: string) => void;
  onDepositToPlan: (planId: string, amount: number) => void;
  onWithdrawPlan: (planId: string) => void;
  spendingBalance: number;
}

export default function TargetSavings({
  plans,
  onAddPlan,
  onDepositToPlan,
  onWithdrawPlan,
  spendingBalance,
}: TargetSavingsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newMonths, setNewMonths] = useState('6');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositPlanId, setDepositPlanId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(newTarget);
    if (!newName.trim()) {
      setErrorMsg('Goal name is required.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Enter a valid target amount.');
      return;
    }

    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(newMonths));
    const maturityDate = date.toISOString();

    onAddPlan(newName, amt, maturityDate);
    setNewName('');
    setNewTarget('');
    setShowAddForm(false);
  };

  const handleDepositSubmit = (planId: string) => {
    setErrorMsg('');
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid amount to deposit.');
      return;
    }
    if (amt > spendingBalance) {
      setErrorMsg(`Insufficient spending balance. You have ${formatSui(spendingBalance)}.`);
      return;
    }

    onDepositToPlan(planId, amt);
    setDepositAmount('');
    setDepositPlanId('');
  };

  return (
    <motion.div 
      id="target-savings-panel" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg font-sans">
          <Target className="w-5 h-5 text-blue-400" />
          <span>Goal-based Target Savings</span>
        </div>
        <motion.button
          id="btn-show-add-target"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer border-none"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </motion.button>
      </div>

      <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed font-medium">
        Lock funds toward a defined goal with auto-savings. Your money is protected and accumulated automatically according to your custom rules until the goal matures.
      </p>

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 text-xs bg-rose-955/20 border border-rose-900/40 text-rose-455 text-rose-400 p-3 rounded-xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target creation form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            onSubmit={handleCreatePlan} 
            id="add-target-form"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/[0.02] p-4.5 border border-white/5 rounded-2xl overflow-hidden space-y-4"
          >
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide font-sans">
              <Milestone className="w-3.5 h-3.5 text-blue-400" />
              <span>Setup New Savings Goal</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1.5 uppercase font-bold">Goal Name</label>
                <input
                  type="text"
                  id="target-name-input"
                  required
                  placeholder="e.g. Rent, Phone, Laptop"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white text-xs font-sans placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1.5 uppercase font-bold">SUI Target Size</label>
                <input
                  type="number"
                  id="target-amount-input"
                  step="any"
                  min="0.1"
                  required
                  placeholder="e.g. 500 SUI"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1.5 uppercase font-bold">Lock Duration</label>
                <div className="relative">
                  <select
                    id="target-duration-select"
                    value={newMonths}
                    onChange={(e) => setNewMonths(e.target.value)}
                    className="w-full glass-input rounded-lg pl-3 pr-8 py-2 text-white text-xs focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="1">1 Month (Immediate)</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months (Standard)</option>
                    <option value="12">12 Months (Premium Lock)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                id="submit-create-target"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
              >
                Activate Goal
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout animate">
          {plans.length === 0 ? (
            <motion.div 
              key="empty-target"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-2 text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10"
            >
              <HelpCircle className="w-8 h-8 text-slate-505 text-slate-550 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-sans font-semibold">No target goals established yet.</p>
              <p className="text-xs text-slate-500 mt-1 font-sans">Create a savings plan or auto-route your incoming assets directly!</p>
            </motion.div>
          ) : (
            plans.map((plan) => {
              const progressPct = Math.min(100, Math.round((plan.currentAmountSui / plan.targetAmountSui) * 100));
              
              return (
                <motion.div
                  key={plan.id}
                  id={`target-card-${plan.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-black/65 border border-white/[0.08] rounded-2xl p-4.5 flex flex-col justify-between hover:bg-zinc-950/80 hover:border-zinc-800 transition-all shadow-md group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{plan.name}</h4>
                        <p className="text-[10px] text-slate-400 font-sans font-medium mt-0.5">
                          Due: {new Date(plan.maturityDate).toLocaleDateString()}
                        </p>
                      </div>
                      {plan.isUnlocked ? (
                        <span className="text-[9px] font-bold bg-green-955/40 text-green-300 border border-green-900/40 px-1.5 py-0.5 rounded uppercase font-sans flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                          <span>Mature / Liquid</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-900/40 text-slate-400 border border-slate-800/80 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 font-bold font-sans">
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>

                    {/* Progress Slider Bar with motion */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-mono mb-1 text-slate-400">
                        <span className="font-sans font-semibold text-[10px] text-slate-450">{progressPct}% Completed</span>
                        <span className="font-bold text-white text-[11px]">{formatSui(plan.currentAmountSui, 1)} / {formatSui(plan.targetAmountSui, 1)}</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="bg-blue-600 h-full rounded-full"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                        <span>Accumulated SUI Goal Share</span>
                        <span>Target Goal Cap</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub Tools inside Plan */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <AnimatePresence mode="wait">
                      {depositPlanId === plan.id ? (
                        <motion.div 
                          key="deposit-form-inline"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="space-y-2"
                        >
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="any"
                              id={`deposit-input-${plan.id}`}
                              placeholder="Amount SUI"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                            <motion.button
                              type="button"
                              id={`submit-deposit-target-${plan.id}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDepositSubmit(plan.id)}
                              className="bg-blue-600 text-white font-bold px-3 py-1 text-xs hover:bg-blue-500 shadow-sm cursor-pointer rounded-lg"
                            >
                              Send
                            </motion.button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDepositPlanId('')}
                            className="text-[10px] text-slate-450 hover:text-white font-bold flex w-fit cursor-pointer"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="actions-row"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-between gap-2.5"
                        >
                          <motion.button
                            type="button"
                            id={`btn-open-deposit-trg-${plan.id}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setDepositPlanId(plan.id);
                              setDepositAmount('');
                            }}
                            className="flex-1 py-1.5 text-[10px] bg-zinc-900/40 text-slate-300 hover:bg-zinc-800/80 hover:text-white rounded-xl font-bold font-sans transition-all border border-zinc-850 shadow-sm cursor-pointer"
                          >
                            Add Funds
                          </motion.button>
                          
                          <motion.button
                            type="button"
                            id={`btn-withdraw-trg-${plan.id}`}
                            whileHover={plan.isUnlocked || progressPct >= 100 ? { scale: 1.02 } : {}}
                            whileTap={plan.isUnlocked || progressPct >= 100 ? { scale: 0.98 } : {}}
                            onClick={() => onWithdrawPlan(plan.id)}
                            className={`flex-1 py-1.5 text-[10px] rounded-xl font-bold font-sans transition-all shadow-sm cursor-pointer ${
                              plan.isUnlocked || progressPct >= 100
                                ? 'bg-green-600 text-white hover:bg-green-550'
                                : 'bg-zinc-950 text-slate-600 border border-zinc-900 cursor-not-allowed opacity-50'
                            }`}
                            disabled={!plan.isUnlocked && progressPct < 100}
                          >
                            {plan.isUnlocked || progressPct >= 100 ? 'Liquidate / Withdraw' : 'Claim (Maturity Limit)'}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
