/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AllocationRule, TargetSavingsPlan } from './types';

export function formatSui(val: number, decimals: number = 3): string {
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + ' SUI';
}

export function truncateAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function generateMockTxHash(): string {
  const chars = 'abcdef1234567890';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Simulates generating full PTB (Programmable Transaction Block) command steps
 * for atomic execution on Sui based on current allocation rules.
 */
export function generatePtbSteps(
  incomingAmount: number,
  rules: AllocationRule[],
  targets: TargetSavingsPlan[],
  spendAndSavePercentage: number,
  isSpendAndSaveActive: boolean
): string[] {
  const activeRules = rules.filter(r => r.isActive && r.percentage > 0);
  const totalPct = activeRules.reduce((acc, curr) => acc + curr.percentage, 0);
  
  const steps: string[] = [];
  steps.push(`// Initialize Programmable Transaction Block (Sui PTB)`);
  steps.push(`tx.setSender(wallet_address);`);
  steps.push(`let [incoming_coin] = tx.splitCoins(tx.gas, [${incomingAmount.toFixed(2)}]); // Split fresh incoming funds`);

  // Optional Spend & Save step first
  let remainingCoinStr = 'incoming_coin';
  if (isSpendAndSaveActive && spendAndSavePercentage > 0) {
    const snsAmount = incomingAmount * (spendAndSavePercentage / 100);
    steps.push(`\n// Spend & Save Rule Triggered (${spendAndSavePercentage}%)`);
    steps.push(`let [sns_coin, spend_coin] = tx.splitCoins(${remainingCoinStr}, [${snsAmount.toFixed(2)}]);`);
    steps.push(`tx.moveCall({ target: "0x3::oWealth_vault::deposit", arguments: [sns_coin] }); // Move to flexible vault`);
    remainingCoinStr = 'spend_coin';
  }

  steps.push(`\n// Active Path Allocations (${totalPct}% configured)`);
  
  let tempCoinCounter = 1;
  activeRules.forEach((rule) => {
    // Normal rule allocation as percentage of whatever the rule states
    // In our simplified PTB, compile the instructions
    const amt = (incomingAmount * (rule.percentage / 100)).toFixed(2);
    
    if (rule.destination === 'spending') {
      steps.push(`let [split_spend_${tempCoinCounter}] = tx.splitCoins(${remainingCoinStr}, [${amt}]);`);
      steps.push(`tx.transferObjects([split_spend_${tempCoinCounter}], wallet_address); // Liquid spending balance`);
    } else if (rule.destination === 'flexible') {
      steps.push(`let [split_flex_${tempCoinCounter}] = tx.splitCoins(${remainingCoinStr}, [${amt}]);`);
      steps.push(`tx.moveCall({ target: "0x3::oWealth_vault::deposit", arguments: [split_flex_${tempCoinCounter}] });`);
    } else if (rule.destination === 'fixed') {
      const duration = rule.fixedDurationDays || 90;
      steps.push(`let [split_fix_${tempCoinCounter}] = tx.splitCoins(${remainingCoinStr}, [${amt}]);`);
      steps.push(`tx.moveCall({ target: "0x88::fixed_deposit::lock", arguments: [split_fix_${tempCoinCounter}, tx.pure(${duration})] }); // Lock for ${duration} days`);
    } else if (rule.destination === 'target') {
      const targetPlan = targets.find(t => t.id === rule.targetGoalId);
      const name = targetPlan ? targetPlan.name : 'Goal';
      steps.push(`let [split_trg_${tempCoinCounter}] = tx.splitCoins(${remainingCoinStr}, [${amt}]);`);
      steps.push(`tx.moveCall({ target: "0xaa::target_savings::deposit", arguments: [split_trg_${tempCoinCounter}, tx.pure("${rule.targetGoalId || 'main_goal'}")] }); // Target: "${name}"`);
    }
    
    tempCoinCounter++;
  });
  
  steps.push(`\n// Complete transaction & execute atomically`);
  return steps;
}
