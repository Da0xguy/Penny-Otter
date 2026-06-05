/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AllocationRule {
  id: string;
  name: string;
  destination: 'spending' | 'flexible' | 'fixed' | 'target';
  percentage: number;
  fixedDurationDays?: number; // For fixed deposits (e.g. 30, 90, 180)
  targetGoalId?: string; // For a specific target goal
  isActive: boolean;
}

export interface TargetSavingsPlan {
  id: string;
  name: string;
  targetAmountSui: number;
  currentAmountSui: number;
  maturityDate: string;
  createdAt: string;
  isUnlocked: boolean;
}

export interface FixedDepositPlan {
  id: string;
  amountSui: number;
  durationDays: number;
  apy: number;
  startDate: string;
  maturityDate: string;
  isWithdrawn: boolean;
  withdrawnAt?: string;
  penaltyApplied?: boolean;
  accruedYield?: number;
}

export interface WalletState {
  suiAddress: string;
  connected: boolean;
  spendingBalance: number;
  flexibleBalance: number;
  accumulatedYieldSui: number;
  spendAndSaveEnabled: boolean;
  spendAndSavePercentage: number;
}

export interface HistoricalTransaction {
  id: string;
  txHash: string;
  type: 'incoming_transfer' | 'programmable_allocation' | 'withdraw_flexible' | 'withdraw_fixed' | 'withdraw_target' | 'spend_and_save_trigger' | 'faucet_claim' | 'spending_transfer';
  amountSui: number;
  timestamp: string;
  description: string;
  ptbCommandCount?: number;
  ptbSteps?: string[];
  status: 'success' | 'failed';
}

export interface IncomingPaymentAlert {
  id: string;
  senderAddress: string;
  amountSui: number;
  timestamp: string;
  title: string;
  message: string;
  isPending: boolean;
}
