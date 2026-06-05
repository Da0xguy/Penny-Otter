/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AllocationRule, 
  TargetSavingsPlan, 
  FixedDepositPlan, 
  WalletState, 
  HistoricalTransaction, 
  IncomingPaymentAlert 
} from './types';
import { 
  formatSui, 
  generateMockTxHash, 
  generatePtbSteps 
} from './utils';
import AllocationRules from './components/AllocationRules';
import FlexibleSavings from './components/FlexibleSavings';
import FixedDeposits from './components/FixedDeposits';
import TargetSavings from './components/TargetSavings';
import TransactionsHistory from './components/TransactionsHistory';
import AiAdvisor from './components/AiAdvisor';
import LandingPage from './components/LandingPage';

import { 
  Wallet, 
  Sparkles, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Play, 
  AlertCircle, 
  Coins, 
  Clock, 
  Send, 
  AlertTriangle, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  CheckCircle2, 
  Layers,
  Eye,
  EyeOff,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

const INITIAL_ADDRESS = '0x3f5c8ca28e9301da01dfb0cb901b028dfac90da01fd8';

export default function App() {
  const currentAccount = useCurrentAccount();

  // Load State from LocalStorage if exists
  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem('sui_wealth_wallet');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Force the default percentage to 100/150/200 if it was loaded with a small value from previous template run
        if (parsed.spendAndSavePercentage < 100) {
          parsed.spendAndSavePercentage = 100;
        }
        return parsed; 
      } catch (e) { /* ignore */ }
    }
    return {
      suiAddress: INITIAL_ADDRESS,
      connected: true,
      spendingBalance: 340.50,
      flexibleBalance: 120.00,
      accumulatedYieldSui: 0.0125804,
      spendAndSaveEnabled: true,
      spendAndSavePercentage: 100,
    };
  });

  // Dynamically synchronize the app's wallet state when the user connects or changes their wallet in SUI dApp Kit
  useEffect(() => {
    if (currentAccount?.address) {
      setWallet(prev => ({
        ...prev,
        suiAddress: currentAccount.address,
        connected: true
      }));
    } else {
      setWallet(prev => ({
        ...prev,
        suiAddress: INITIAL_ADDRESS,
        connected: false
      }));
    }
  }, [currentAccount]);

  const [routingRatioPolicy, setRoutingRatioPolicy] = useState<'balanced' | 'save_more_1_5x' | 'save_more_2x'>(() => {
    const saved = localStorage.getItem('sui_wealth_policy');
    return (saved as any) || 'balanced';
  });

  const [rules, setRules] = useState<AllocationRule[]>(() => {
    const saved = localStorage.getItem('sui_wealth_rules');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((r: any) => r.destination !== 'fixed');
      } catch (e) { /* ignore */ }
    }
    return [
      { id: '1', name: 'Spending Balance', destination: 'spending', percentage: 50, isActive: true },
      { id: '2', name: 'Flexible Savings (oWealth)', destination: 'flexible', percentage: 50, isActive: true },
      { id: '3', name: 'Target Savings Plan', destination: 'target', percentage: 0, isActive: false, targetGoalId: 't1' },
    ];
  });

  const [targetPlans, setTargetPlans] = useState<TargetSavingsPlan[]>(() => {
    const saved = localStorage.getItem('sui_wealth_targets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 't1', name: 'Next-Gen Mobile Phone', targetAmountSui: 200, currentAmountSui: 45, maturityDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(), createdAt: new Date().toISOString(), isUnlocked: false },
      { id: 't2', name: 'Apartment Gas Allowance', targetAmountSui: 50, currentAmountSui: 15, maturityDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), createdAt: new Date().toISOString(), isUnlocked: false },
    ];
  });

  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositPlan[]>(() => {
    const saved = localStorage.getItem('sui_wealth_fixed');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 'f1', amountSui: 100, durationDays: 90, apy: 10, startDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(), maturityDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(), isWithdrawn: false }
    ];
  });

  const [transactions, setTransactions] = useState<HistoricalTransaction[]>(() => {
    const saved = localStorage.getItem('sui_wealth_txs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'tx1',
        txHash: '0xe295cda28e9301da01dfb0cb901b028dfac90da01fd80ccbc920a0129abc1029',
        type: 'faucet_claim',
        amountSui: 100,
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        description: 'Claimed initial test tokens from Sui Devnet Faucet.',
        ptbCommandCount: 1,
        ptbSteps: [
          '// Initialize Devnet Faucet stream',
          'tx.setSender(0x3f5c...92a1);',
          'tx.moveCall({ target: "0x2::faucet::claim_gas", arguments: [] });'
        ],
        status: 'success'
      },
      {
        id: 'tx2',
        txHash: '0x33cf8ba28fef8300da1dfb00b01b028daac90da01fd80ccbc0214a0129def10fd',
        type: 'programmable_allocation',
        amountSui: 120,
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        description: 'PayStream Auto-Router split 120 SUI incoming payment.',
        ptbCommandCount: 5,
        ptbSteps: [
          '// Initialize Programmable Transaction Block',
          'tx.setSender(0x3f5c...92a1);',
          'let [incoming_coin] = tx.splitCoins(tx.gas, [120.00]);',
          'let [split_spend_1] = tx.splitCoins(incoming_coin, [60.00]);',
          'tx.transferObjects([split_spend_1], 0x3f5c...92a1);',
          'let [split_flex_2] = tx.splitCoins(incoming_coin, [24.00]);',
          'tx.moveCall({ target: "0x3::oWealth_vault::deposit", arguments: [split_flex_2] });'
        ],
        status: 'success'
      }
    ];
  });

  // Simulation controls
  const [simulationSpeed, setSimulationSpeed] = useState<number>(100); // 1x, 100x, 1000x for testing yield accrual fast!
  const [lastTxHash, setLastTxHash] = useState<string>('0xe295cda28e9301da01dfb0cb901b028dfac90da01fd80ccbc920a0129abc1029');
  const [mockSendAddress, setMockSendAddress] = useState('');
  const [mockSendAmount, setMockSendAmount] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Active terminal preview steps
  const [currentPtbSteps, setCurrentPtbSteps] = useState<string[]>([]);

  // Simulation Faucet / Peer Payout Trigger Form
  const [currentView, setCurrentView] = useState<'hub' | 'advisor'>('hub');
  const [faucetAmountSim, setFaucetAmountSim] = useState('300');
  const [incomingAlert, setIncomingAlert] = useState<IncomingPaymentAlert | null>(null);
  const [manualAllocationActive, setManualAllocationActive] = useState(false);
  const [tempManualRules, setTempManualRules] = useState<AllocationRule[]>([]);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('sui_wealth_balance_visible');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('sui_wealth_balance_visible', String(isBalanceVisible));
  }, [isBalanceVisible]);

  // Local storage syncing
  useEffect(() => {
    localStorage.setItem('sui_wealth_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_targets', JSON.stringify(targetPlans));
  }, [targetPlans]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_fixed', JSON.stringify(fixedDeposits));
  }, [fixedDeposits]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_policy', routingRatioPolicy);
  }, [routingRatioPolicy]);

  // Synchronize rules based on policy and active statuses dynamically (percentage-free math!)
  useEffect(() => {
    const isFlexibleActive = rules.some(r => r.destination === 'flexible' && r.isActive);
    const isTargetActive = rules.some(r => r.destination === 'target' && r.isActive);

    // Policy mappings: determine what portion translates to spending vs savings
    let spendingPct = 50;
    if (routingRatioPolicy === 'save_more_1_5x') {
      spendingPct = 40;
    } else if (routingRatioPolicy === 'save_more_2x') {
      spendingPct = 33.3; // 2:1 Savings Ratio (66.7% vs 33.3%)
    }

    const savingsTotalPct = 100 - spendingPct;
    let flexiblePct = 0;
    let targetPct = 0;

    if (isFlexibleActive && isTargetActive) {
      flexiblePct = Number((savingsTotalPct / 2).toFixed(2));
      targetPct = Number((savingsTotalPct / 2).toFixed(2));
    } else if (isFlexibleActive) {
      flexiblePct = savingsTotalPct;
    } else if (isTargetActive) {
      targetPct = savingsTotalPct;
    } else {
      // If no savings rules are toggled ON, 100% goes to the Spending (liquid) balance
      spendingPct = 100;
    }

    // Force perfect sum of 100
    const sum = spendingPct + flexiblePct + targetPct;
    if (sum !== 100 && isFlexibleActive && isTargetActive) {
      // adjust fractional offset
      const offset = 100 - sum;
      flexiblePct = Number((flexiblePct + offset).toFixed(2));
    }

    let hasChanged = false;
    const nextRules = rules.map(r => {
      let nextPct = r.percentage;
      if (r.destination === 'spending') nextPct = spendingPct;
      else if (r.destination === 'flexible') nextPct = flexiblePct;
      else if (r.destination === 'target') nextPct = targetPct;

      if (r.percentage !== nextPct) {
        hasChanged = true;
      }
      return { ...r, percentage: nextPct };
    });

    if (hasChanged) {
      setRules(nextRules);
    }
  }, [routingRatioPolicy, rules.map(r => `${r.id}-${r.isActive}-${r.targetGoalId}`).join(',')]);

  // Update real-time PTB preview when rules change
  useEffect(() => {
    const dummyAmount = 250;
    const steps = generatePtbSteps(dummyAmount, rules, targetPlans, wallet.spendAndSavePercentage, wallet.spendAndSaveEnabled);
    setCurrentPtbSteps(steps);
  }, [rules, targetPlans, wallet.spendAndSavePercentage, wallet.spendAndSaveEnabled]);

  // oWealth Interest accumulation tick (Interval)
  const lastTickTime = useRef<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      if (wallet.connected) {
        const effectiveDelta = deltaSec * simulationSpeed;

        // 1. Tick Flexible savings
        if (wallet.flexibleBalance > 0) {
          // oWealth yields 8.5% APY
          // R_second = 0.085 / (365 * 24 * 3600)
          const interestRatePerSecond = 0.085 / (365 * 24 * 3600);
          const earned = wallet.flexibleBalance * interestRatePerSecond * effectiveDelta;

          setWallet(prev => ({
            ...prev,
            flexibleBalance: prev.flexibleBalance + earned,
            accumulatedYieldSui: prev.accumulatedYieldSui + earned,
          }));
        }

        // 2. Tick Active Fixed Deposits
        setFixedDeposits(prev => {
          let hasActive = false;
          const next = prev.map(fd => {
            if (!fd.isWithdrawn) {
              hasActive = true;
              const interestRatePerSecond = (fd.apy / 100) / (365 * 24 * 3600);
              const earned = fd.amountSui * interestRatePerSecond * effectiveDelta;
              return {
                ...fd,
                accruedYield: (fd.accruedYield || 0) + earned
              };
            }
            return fd;
          });
          return hasActive ? next : prev;
        });
      }
    }, 450);

    return () => clearInterval(interval);
  }, [wallet.connected, simulationSpeed]);

  // Calculated aggregates
  const totalLockedFixed = fixedDeposits
    .filter(fd => !fd.isWithdrawn)
    .reduce((sum, fd) => sum + fd.amountSui, 0);

  const totalLockedTarget = targetPlans
    .reduce((sum, tp) => sum + tp.currentAmountSui, 0);

  const totalBalanceSui = wallet.spendingBalance + wallet.flexibleBalance + totalLockedFixed + totalLockedTarget;

  // Actions handler
  const handleFaucetGasClaim = () => {
    const hash = generateMockTxHash();
    setLastTxHash(hash);

    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance + 50,
    }));

    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'faucet_claim',
      amountSui: 50,
      timestamp: new Date().toISOString(),
      description: 'Disbursed 50 SUI from daily test tokens faucet to Spending Balance.',
      ptbCommandCount: 1,
      ptbSteps: [
        '// Faucet Trigger',
        'tx.setSender(0x3f5c...92a1);',
        'tx.moveCall({ target: "0x2::faucet::claim_gas" });'
      ],
      status: 'success'
    };

    setTransactions(prev => [newTx, ...prev]);
    showNotification('Received 50 SUI Faucet reward directly in Spending Balance!', 'success');
  };

  const handleSpendWealth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorToast('');
    setSuccessToast('');

    const amt = parseFloat(mockSendAmount);
    if (isNaN(amt) || amt <= 0) {
      showNotification('Please enter a valid outward transfer size.', 'error');
      return;
    }

    if (amt > wallet.spendingBalance) {
      showNotification(`Insufficient Spending Balance. You require ${formatSui(amt)}.`, 'error');
      return;
    }

    const hash = generateMockTxHash();
    setLastTxHash(hash);

    // If Spend & Save is active, save set percentage!
    let snsApplied = false;
    let snsSavedAmt = 0;
    let finalSpendingDeduction = amt;

    if (wallet.spendAndSaveEnabled && wallet.spendAndSavePercentage > 0) {
      snsSavedAmt = amt * (wallet.spendAndSavePercentage / 100);
      if (wallet.spendingBalance >= (amt + snsSavedAmt)) {
        snsApplied = true;
        finalSpendingDeduction = amt + snsSavedAmt;
      }
    }

    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance - finalSpendingDeduction,
      flexibleBalance: prev.flexibleBalance + (snsApplied ? snsSavedAmt : 0),
    }));

    // Record main outward transfer
    const txSteps = [
      '// Outward Peer Transfer PTB',
      `tx.setSender(${INITIAL_ADDRESS});`,
      `let [transfer_coin] = tx.splitCoins(tx.gas, [${amt.toFixed(2)}]);`,
      `tx.transferObjects([transfer_coin], "${mockSendAddress || '0x_recipient'}");`
    ];

    if (snsApplied) {
      const ratioX = wallet.spendAndSavePercentage === 100 ? '1x' : wallet.spendAndSavePercentage === 150 ? '1.5x' : '2x';
      txSteps.push(`\n// Spend & Save Rule Active (Ratio: ${ratioX})`);
      txSteps.push(`let [sns_coin] = tx.splitCoins(tx.gas, [${snsSavedAmt.toFixed(2)}]);`);
      txSteps.push(`tx.moveCall({ target: "0x3::oWealth_vault::deposit", arguments: [sns_coin] });`);
    }

    const mainTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: snsApplied ? 'spend_and_save_trigger' : 'spending_transfer',
      amountSui: amt,
      timestamp: new Date().toISOString(),
      description: `Sent ${formatSui(amt)} to ${mockSendAddress || 'anonymous peer Address'}.${
        snsApplied ? ` Triggered automated Spend & Save of +${formatSui(snsSavedAmt)} to flexible savings.` : ''
      }`,
      ptbCommandCount: snsApplied ? 4 : 2,
      ptbSteps: txSteps,
      status: 'success'
    };

    setTransactions(prev => [mainTx, ...prev]);
    setMockSendAmount('');
    setMockSendAddress('');
    showNotification(
      snsApplied 
        ? `Sent ${formatSui(amt)}! Spend-and-Save moved ${formatSui(snsSavedAmt)} to oWealth!`
        : `Sent ${formatSui(amt)} successfully!`, 
      'success'
    );
  };

  // Triggers the pop-up transaction alert center
  const generateSimulatedIncomingTransfer = () => {
    const amt = parseFloat(faucetAmountSim);
    if (isNaN(amt) || amt <= 0) return;

    setIncomingAlert({
      id: Math.random().toString(),
      senderAddress: '0x8b321ca22e239ffd15b0ca1dfac22da02fd81c88',
      amountSui: amt,
      timestamp: new Date().toISOString(),
      title: 'Incoming SuiWealth PayStream Payment',
      message: `${formatSui(amt)} received. Re-route or split dynamically?`,
      isPending: true,
    });
  };

  const executePtbSplitWithRules = (activeRules: AllocationRule[], customAmount: number) => {
    if (!incomingAlert) return;

    const totalPercentage = activeRules
      .filter(r => r.isActive)
      .reduce((sum, r) => sum + r.percentage, 0);

    if (totalPercentage !== 100) {
      showNotification('Allocations must sum to exactly 100% to run PTB split block.', 'error');
      return;
    }

    // Process split distributions
    const hash = generateMockTxHash();
    setLastTxHash(hash);

    let spendingAdded = 0;
    let flexibleAdded = 0;
    const targetsToUpdate = [...targetPlans];
    const fixedToUpdate = [...fixedDeposits];

    activeRules.filter(r => r.isActive).forEach((r) => {
      const share = customAmount * (r.percentage / 100);
      if (r.destination === 'spending') {
        spendingAdded += share;
      } else if (r.destination === 'flexible') {
        flexibleAdded += share;
      } else if (r.destination === 'target' && r.targetGoalId) {
        const index = targetsToUpdate.findIndex(t => t.id === r.targetGoalId);
        if (index !== -1) {
          targetsToUpdate[index].currentAmountSui += share;
        }
      } else if (r.destination === 'fixed') {
        const days = r.fixedDurationDays || 90;
        let fdApy = 10;
        if (days === 30) fdApy = 7;
        if (days === 180) fdApy = 14;
        if (days === 360) fdApy = 20;

        fixedToUpdate.push({
          id: 'f_dynamic_' + Math.random().toString().slice(2, 6),
          amountSui: share,
          durationDays: days,
          apy: fdApy,
          startDate: new Date().toISOString(),
          maturityDate: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
          isWithdrawn: false,
          accruedYield: 0,
        });
      }
    });

    // Handle updates
    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance + spendingAdded,
      flexibleBalance: prev.flexibleBalance + flexibleAdded,
    }));
    setTargetPlans(targetsToUpdate);
    setFixedDeposits(fixedToUpdate);

    // Save transaction logs
    const stepsLog = generatePtbSteps(customAmount, activeRules, targetPlans, wallet.spendAndSavePercentage, false);
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'programmable_allocation',
      amountSui: customAmount,
      timestamp: new Date().toISOString(),
      description: `Executed PayStream allocation for received ${formatSui(customAmount)}. Distributed into default portfolios atomically.`,
      ptbCommandCount: activeRules.filter(r => r.isActive).length + 2,
      ptbSteps: stepsLog,
      status: 'success',
    };

    setTransactions(prev => [newTx, ...prev]);
    setIncomingAlert(null);
    setManualAllocationActive(false);
    showNotification(`Atoms aligned! Received SUI has completed execution loops.`, 'success');
  };

  const triggerManualAdjustAlert = () => {
    // Clone standard rules into editable manual pool
    setTempManualRules(JSON.parse(JSON.stringify(rules)));
    setManualAllocationActive(true);
  };

  const handleManualAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingAlert) return;
    executePtbSplitWithRules(tempManualRules, incomingAlert.amountSui);
  };

  const handleDepositToFlexible = (amount: number) => {
    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance - amount,
      flexibleBalance: prev.flexibleBalance + amount,
    }));
    
    // Add tx
    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'withdraw_flexible',
      amountSui: amount,
      timestamp: new Date().toISOString(),
      description: `Manually deposited ${formatSui(amount)} into oWealth Flexible savings.`,
      ptbCommandCount: 2,
      ptbSteps: [
        '// Direct Flexible Deposit PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [deposit_coin] = tx.splitCoins(tx.gas, [${amount}]);`,
        'tx.moveCall({ target: "0x3::oWealth_vault::deposit", arguments: [deposit_coin] });'
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleWithdrawFromFlexible = (amount: number) => {
    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance + amount,
      flexibleBalance: prev.flexibleBalance - amount,
    }));

    // Add tx
    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'spending_transfer',
      amountSui: amount,
      timestamp: new Date().toISOString(),
      description: `Withdrew ${formatSui(amount)} from oWealth Flexible savings to local Spending Balance.`,
      ptbCommandCount: 2,
      ptbSteps: [
        '// Direct Flexible Withdraw PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [withdrawn_coin] = tx.moveCall({ target: "0x3::oWealth_vault::withdraw", arguments: [tx.pure(${amount})] });`,
        `tx.transferObjects([withdrawn_coin], ${INITIAL_ADDRESS});`
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleAddTargetPlan = (name: string, targetAmountSui: number, maturityDate: string) => {
    setTargetPlans(prev => [
      ...prev,
      {
        id: 't_custom_' + Math.random().toString().slice(2, 6),
        name,
        targetAmountSui,
        currentAmountSui: 0,
        maturityDate,
        createdAt: new Date().toISOString(),
        isUnlocked: false,
      }
    ]);
    showNotification(`New active Goal objective "${name}" established.`, 'success');
  };

  const handleDepositToTargetPlan = (planId: string, amount: number) => {
    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance - amount,
    }));

    setTargetPlans(prev => prev.map(pt => {
      if (pt.id === planId) {
        return { ...pt, currentAmountSui: pt.currentAmountSui + amount };
      }
      return pt;
    }));

    const planName = targetPlans.find(t => t.id === planId)?.name || 'Goal';
    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'withdraw_target',
      amountSui: amount,
      timestamp: new Date().toISOString(),
      description: `Funded ${formatSui(amount)} manually towards "${planName}" Goal.`,
      ptbSteps: [
        '// Target Manual Deposit PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [deposit_coin] = tx.splitCoins(tx.gas, [${amount}]);`,
        `tx.moveCall({ target: "0xaa::target_savings::deposit", arguments: [deposit_coin, tx.pure("${planId}")] });`
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
    showNotification(`Funded target goal with ${formatSui(amount)}!`, 'success');
  };

  const handleWithdrawTargetPlan = (planId: string) => {
    const plan = targetPlans.find(t => t.id === planId);
    if (!plan) return;

    const amt = plan.currentAmountSui;
    if (amt <= 0) {
      showNotification('This target has no accrued capital inside it to liquidate.', 'error');
      return;
    }

    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance + amt,
    }));

    setTargetPlans(prev => prev.filter(t => t.id !== planId));

    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'spending_transfer',
      amountSui: amt,
      timestamp: new Date().toISOString(),
      description: `Liquidated target savings goal "${plan.name}", receiving ${formatSui(amt)} into Spending Balance.`,
      ptbSteps: [
        '// Target Savings Goal liquidation PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [liquid_coin] = tx.moveCall({ target: "0xaa::target_savings::claim", arguments: [tx.pure("${planId}")] });`,
        `tx.transferObjects([liquid_coin], ${INITIAL_ADDRESS});`
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
    showNotification(`Liquidated goal "${plan.name}"! Claimed ${formatSui(amt)} SUI.`, 'success');
  };

  const handleAddFixedDeposit = (amountSui: number, durationDays: number) => {
    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance - amountSui,
    }));

    let defaultApy = 10;
    if (durationDays === 30) defaultApy = 7;
    if (durationDays === 180) defaultApy = 14;
    if (durationDays === 360) defaultApy = 20;

    const newDep: FixedDepositPlan = {
      id: 'f_custom_' + Math.random().toString().slice(2, 6),
      amountSui,
      durationDays,
      apy: defaultApy,
      startDate: new Date().toISOString(),
      maturityDate: new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString(),
      isWithdrawn: false,
      accruedYield: 0,
    };

    setFixedDeposits(prev => [newDep, ...prev]);

    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'withdraw_fixed',
      amountSui: amountSui,
      timestamp: new Date().toISOString(),
      description: `Locked ${formatSui(amountSui)} inside fixed locker for ${durationDays} days at ${defaultApy}% APY.`,
      ptbCommandCount: 2,
      ptbSteps: [
        '// Fixed Locker initialization PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [lock_coin] = tx.splitCoins(tx.gas, [${amountSui}]);`,
        `tx.moveCall({ target: "0x88::fixed_deposit::lock", arguments: [lock_coin, tx.pure(${durationDays})] });`
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
    showNotification(`Locked up fixed deposit locker successfully for ${durationDays} days.`, 'success');
  };

  const handleTopUpFixedDeposit = (planId: string, amountSui: number) => {
    if (amountSui > wallet.spendingBalance) {
      showNotification(`Insufficient Spending balance to top up lock contract.`, 'error');
      return;
    }

    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance - amountSui,
    }));

    setFixedDeposits(prev => prev.map(f => {
      if (f.id === planId) {
        return {
          ...f,
          amountSui: f.amountSui + amountSui,
        };
      }
      return f;
    }));

    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'spending_transfer',
      amountSui: amountSui,
      timestamp: new Date().toISOString(),
      description: `Topped up Fixed Deposit Locker (ID: ${planId.slice(0, 8)}) with manual allocation of +${formatSui(amountSui)}.`,
      ptbCommandCount: 2,
      ptbSteps: [
        '// Fixed Locker manual top up PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [topup_coin] = tx.splitCoins(tx.gas, [${amountSui}]);`,
        `tx.moveCall({ target: "0x88::fixed_deposit::topup", arguments: [tx.pure("${planId}"), topup_coin] });`
      ],
      status: 'success'
    };

    setTransactions(prev => [newTx, ...prev]);
    showNotification(`Successfully topped up fixed deposit locker with +${formatSui(amountSui)}!`, 'success');
  };

  const handleWithdrawFixedDeposit = (planId: string) => {
    const plan = fixedDeposits.find(f => f.id === planId);
    if (!plan) return;

    const daysLocked = Math.round((new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const isMature = daysLocked >= plan.durationDays;

    const accruedYield = plan.accruedYield || 0;
    let finalAmount = plan.amountSui + accruedYield;
    let explanationSuffix = `Claimed standard capital principal + accrued yields (+${formatSui(accruedYield)} SUI).`;
    let isPenalty = false;

    if (!isMature) {
      const penalty = plan.amountSui * 0.02; // 2% early penalty fee on the SUI principal
      finalAmount = plan.amountSui + accruedYield - penalty;
      explanationSuffix = `Early termination penalization: forfeited 2% penalty fee of the principal (-${formatSui(penalty)} SUI). Received principal of ${formatSui(plan.amountSui)} SUI + accrued interest of ${formatSui(accruedYield)} SUI.`;
      isPenalty = true;
    }

    setWallet(prev => ({
      ...prev,
      spendingBalance: prev.spendingBalance + finalAmount,
      accumulatedYieldSui: prev.accumulatedYieldSui + accruedYield,
    }));

    setFixedDeposits(prev => prev.filter(f => f.id !== planId));

    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'spending_transfer',
      amountSui: finalAmount,
      timestamp: new Date().toISOString(),
      description: `Withdrawn lock asset deposit ID: ${plan.id}. Status: ${explanationSuffix}`,
      ptbCommandCount: 2,
      ptbSteps: [
        '// Fixed deposit asset release PTB',
        `tx.setSender(${INITIAL_ADDRESS});`,
        `let [unlocked_coin] = tx.moveCall({ target: "0x88::fixed_deposit::withdraw", arguments: [tx.pure("${planId}"), tx.pure(${isPenalty})] });`,
        `tx.transferObjects([unlocked_coin], ${INITIAL_ADDRESS});`
      ],
      status: 'success'
    };
    setTransactions(prev => [newTx, ...prev]);
    showNotification(
      isPenalty 
        ? `Locker Terminated early! Deducted 2% penalty. Received ${formatSui(finalAmount)} SUI (including ${formatSui(accruedYield)} SUI yield).`
        : `Claimed locker capital & interest of ${formatSui(finalAmount)} SUI!`,
      isPenalty ? 'error' : 'success'
    );
  };

  const handleReallocateFlexible = (allocations: { flexiblePct: number; fixedPct: number; targetPct: number }) => {
    const totalFlex = wallet.flexibleBalance;
    if (totalFlex <= 0) {
      showNotification('Your oWealth Flexible Balance is 0 SUI. Move some funds into oWealth Flex first to invest using the AI!', 'error');
      return;
    }

    const { flexiblePct, fixedPct, targetPct } = allocations;
    
    // Calculate SUI sizes
    const flexRemains = totalFlex * (flexiblePct / 100);
    const fixedAlloc = totalFlex * (fixedPct / 100);
    const targetAlloc = totalFlex * (targetPct / 100);

    const updatedFixed = [...fixedDeposits];
    const updatedTargets = [...targetPlans];

    // Trigger fixed locked contracts (defaulting to 90 days for moderate AI lockup tenure)
    if (fixedAlloc > 0) {
      updatedFixed.push({
        id: 'f_ai_' + Math.random().toString().slice(2, 6),
        amountSui: fixedAlloc,
        durationDays: 90,
        apy: 10, // 10.00% APY
        startDate: new Date().toISOString(),
        maturityDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        isWithdrawn: false,
        accruedYield: 0,
      });
    }

    // Trigger savings goal funding (directly into the first active goal, or create a default one if none exists!)
    if (targetAlloc > 0) {
      if (updatedTargets.length > 0) {
        // Fund the first target goal
        updatedTargets[0].currentAmountSui += targetAlloc;
      } else {
        // Create an AI Investment Target Goal
        updatedTargets.push({
          id: 't_ai_' + Math.random().toString().slice(2, 6),
          name: 'AI Smart Alpha Goal',
          targetAmountSui: Math.max(100, targetAlloc * 2),
          currentAmountSui: targetAlloc,
          maturityDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          isUnlocked: false,
        });
      }
    }

    setWallet(prev => ({
      ...prev,
      flexibleBalance: flexRemains,
    }));
    setFixedDeposits(updatedFixed);
    setTargetPlans(updatedTargets);

    const hash = generateMockTxHash();
    setLastTxHash(hash);

    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'programmable_allocation',
      amountSui: totalFlex,
      timestamp: new Date().toISOString(),
      description: `AI Rebalancing: Distributed ${formatSui(totalFlex)} from oWealth Flexible balance dynamically into ${flexiblePct}% oWealth Flex, ${fixedPct}% Fixed Locks, and ${targetPct}% Target Goals.`,
      ptbCommandCount: 4,
      ptbSteps: [
        '// AI Reallocation PTB block from oWealth Flex SUI pool',
        `tx.setSender(${wallet.suiAddress});`,
        `// Withdraw total flexible pool of ${totalFlex.toFixed(2)} SUI`,
        `let [total_withdrawn] = tx.moveCall({ target: "suiwealth::suiwealth::withdraw_flexible", arguments: [tx.pure(${totalFlex.toFixed(0)})] });`,
        fixedAlloc > 0 ? `let [fixed_coin] = tx.splitCoins(total_withdrawn, [${fixedAlloc.toFixed(0)}]);` : '',
        fixedAlloc > 0 ? `tx.moveCall({ target: "suiwealth::suiwealth::create_fixed_locker", arguments: [fixed_coin, tx.pure(7776000000), tx.pure(1000)] });` : '',
        targetAlloc > 0 ? `let [target_coin] = tx.splitCoins(total_withdrawn, [${targetAlloc.toFixed(0)}]);` : '',
        targetAlloc > 0 ? `tx.moveCall({ target: "suiwealth::suiwealth::fund_savings_goal", arguments: [target_coin] });` : '',
        flexRemains > 0 ? `tx.moveCall({ target: "suiwealth::suiwealth::deposit_flexible", arguments: [total_withdrawn] });` : `tx.transferObjects([total_withdrawn], ${wallet.suiAddress});`
      ].filter(Boolean),
      status: 'success'
    };

    setTransactions(prev => [newTx, ...prev]);
    setCurrentView('hub');
    showNotification(`Invested ${formatSui(totalFlex)} from oWealth Flex balance strictly following AI advice.`, 'success');
  };

  const clearHistory = () => {
    setTransactions([]);
    showNotification('System historical log entries formatted.', 'success');
  };

  // Helper toasts
  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(''), 4500);
    } else {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(''), 4500);
    }
  };

  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 selection:bg-blue-500/30 selection:text-white font-sans antialiased">
      
      {/* 1. TOP HEADER & TELEMETRY NAV BAR */}
      <header className="border-b border-slate-800/80 bg-[#070b16]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md shadow-blue-500/10">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight tracking-tight text-white font-sans">
                SuiWealth <span className="text-blue-400 font-mono font-bold text-xs">/ PayStream</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                Programmable Financial Autopilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Native SUI Network Mode */}
            <div className="bg-slate-900/80 rounded-xl px-3 py-1 font-mono text-[10px] font-bold text-slate-300 border border-slate-800 shadow-sm">
              SUI NATIVE
            </div>

            {/* Simulated Speed Factor */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-400 font-sans font-bold">Yield Speed:</span>
              <select
                id="yield-speed-sim"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-bold text-blue-400 font-mono focus:outline-none focus:ring-0 p-0 cursor-pointer"
              >
                <option value={1}>1x (Live APY)</option>
                <option value={100}>100x (Yield Sandbox)</option>
                <option value={1000}>1,000x (Warp Compound)</option>
              </select>
            </div>

            {/* Address connection bar */}
            <div id="suidappkit-connect-component" className="text-xs">
              <ConnectButton 
                connectText="Connect SUI Wallet"
                className="!bg-blue-600 hover:!bg-blue-500 !text-white !font-bold !text-xs !py-1.5 !px-3.5 !rounded-lg !border-none !shadow-sm transition-all active:scale-95 cursor-pointer !font-sans" 
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!currentAccount?.address ? (
          <LandingPage />
        ) : (
          <>
            {/* SUI DEFI AI CO-PILOT PROMPT BANNER */}
        {currentView === 'hub' && (
          <div className="bg-gradient-to-r from-blue-950/20 via-[#0a142c]/65 to-indigo-950/20 border border-blue-900/30 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3 relative z-10 text-left">
              <div className="p-2.5 bg-blue-950 border border-blue-800/60 text-blue-400 rounded-2xl animate-pulse">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs font-sans">Maximize SUI yield potential with the SUI DeFi Copilot</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                  The AI evaluates continuous liquidity stream velocities and security limits across flexible vaults, target goals, and multi-tenure locks.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('advisor')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Ask AI Advisor</span>
            </button>
          </div>
        )}

        {/* 2. REAL-TIME BLOCKCHAIN POPUP / INCOMING ALERTS */}
        <AnimatePresence>
          {incomingAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              id="incoming-stream-toast-panel"
              className="bg-gradient-to-br from-[#0b1325] to-[#060a14] border-2 border-blue-500/80 rounded-3xl p-6 shadow-[0_12px_40px_rgba(37,99,235,0.15)] relative overflow-hidden text-left"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setIncomingAlert(null)}
                  className="text-slate-300 hover:text-white text-xs font-bold bg-[#111c34] border border-[#22365e] px-2.5 py-1 rounded-xl shadow-sm transition-all"
                >
                  Dismiss
                </button>
              </div>

              {/* Decorative subtle glows */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

              <div className="flex items-start gap-4 flex-col md:flex-row relative z-10">
                <div className="p-3 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded-2xl flex-shrink-0">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>

                <div className="flex-1 space-y-1 pr-12">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-950/60 border border-blue-800 text-blue-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      BLOCK EVENT DETECTED
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] font-bold">
                      From: {incomingAlert.senderAddress.slice(0, 10)}...{incomingAlert.senderAddress.slice(-6)}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-white font-sans tracking-tight">
                    {incomingAlert.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed font-semibold">
                    Sui Ledger identified fresh incoming payment. Value: <strong className="text-blue-400 font-mono text-sm">{formatSui(incomingAlert.amountSui)}</strong>.
                  </p>
                </div>
              </div>

              {/* Interaction Decision Blocks */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
                <button
                  type="button"
                  id="btn-use-default-router"
                  onClick={() => executePtbSplitWithRules(rules, incomingAlert.amountSui)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl text-xs font-sans hover:bg-blue-500 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>Use Default Allocation Rules (1-Tap PTB Split)</span>
                </button>

                <button
                  type="button"
                  id="btn-trigger-manual-adjust"
                  onClick={triggerManualAdjustAlert}
                  className="flex-1 bg-[#0c1428] hover:bg-[#121c38] text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs font-sans border border-[#22355c] shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Manually Adjust Percentages First</span>
                </button>
              </div>

              {/* Embed slide allocation adjustment for manual splits */}
              {manualAllocationActive && (
                <div id="manual-splitter-workbench" className="mt-6 pt-6 border-t border-[#1e2e4e] transition-all duration-300">
                  <h4 className="text-xs font-bold text-slate-300 font-sans uppercase mb-4 tracking-wider">
                    Dynamic PayStream Allocation Sandbox (Adjust strictly to 100%)
                  </h4>
                  
                  <form onSubmit={handleManualAllocationSubmit} className="space-y-4">
                    {tempManualRules.map((rule) => {
                      const shareAmt = incomingAlert.amountSui * (rule.percentage / 100);
                      
                      return (
                        <div key={rule.id} className="p-3.5 bg-[#080d19] border border-[#1e2e4e]/50 rounded-2xl space-y-2.5 shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">{rule.name}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-500 font-semibold">({formatSui(shareAmt, 1)})</span>
                              <input
                                type="number"
                                id={`manual-pct-input-${rule.id}`}
                                className="w-12 bg-[#121d36] border border-[#233866] rounded-lg text-center text-blue-400 p-0.5 focus:outline-none font-bold"
                                value={rule.percentage}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  setTempManualRules(prev => prev.map(r => r.id === rule.id ? { ...r, percentage: val } : r));
                                }}
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </div>
                          
                          <input
                            type="range"
                            min={0}
                            className="w-full h-1 cursor-pointer accent-blue-500 bg-[#121d36] rounded-lg"
                            max={100}
                            step={5}
                            value={rule.percentage}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setTempManualRules(prev => prev.map(r => r.id === rule.id ? { ...r, percentage: val } : r));
                            }}
                          />
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-sans text-slate-400 font-semibold">
                        Sum Total: <strong className={
                          tempManualRules.reduce((s, r) => s + r.percentage, 0) === 100 
                            ? 'text-green-450 text-green-400 font-mono font-bold' 
                            : 'text-amber-500 font-mono font-bold'
                        }>
                          {tempManualRules.reduce((s, r) => s + r.percentage, 0)}%
                        </strong>
                      </span>

                      <button
                        type="submit"
                        id="submit-manual-allocation-btn"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all"
                      >
                        Sign & Execute Sandbox PTB Block
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {currentView === 'advisor' ? (
          <AiAdvisor
            userPortfolio={{
              suiAddress: wallet.suiAddress,
              spendingBalance: wallet.spendingBalance,
              flexibleBalance: wallet.flexibleBalance,
              fixedBalance: totalLockedFixed,
              targetBalance: totalLockedTarget,
              accumulatedYield: wallet.accumulatedYieldSui,
            }}
            onBack={() => setCurrentView('hub')}
            onApplyRatio={(policy) => {
              setRoutingRatioPolicy(policy);
              setCurrentView('hub');
              showNotification(`AI allocation rule applied successfully! Routing policy updated to ${policy === 'save_more_2x' ? 'Maximum Saver (2:1)' : policy === 'save_more_1_5x' ? 'Accelerated Saver (1.5:1)' : 'Balanced Model (1:1)'}.`, 'success');
            }}
            onReallocFlexible={handleReallocateFlexible}
          />
        ) : (
          <>
            {/* 3. MAIN COIN / EQUITY GRIDS (SUIWEALTH CONSOLIDATED BALANCE CARD) */}
        <section id="equity-kpi-block" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2 bg-gradient-to-tr from-[#080d1a] via-[#0d162d] to-[#121f3f] text-white p-6 rounded-3xl border border-[#1e2e4f]/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden min-h-[160px] flex flex-col justify-between">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                id="ask-ai-advisor-btn"
                onClick={() => setCurrentView('advisor')}
                className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-550 border border-blue-500 text-white font-bold px-2.5 py-0.5 rounded-lg transition-all active:scale-95 shadow-md shadow-blue-500/15 cursor-pointer"
                title="Get AI Investment Yield Advice"
              >
                <Brain className="w-3.5 h-3.5 animate-pulse" />
                <span>AI Advisory</span>
              </button>
              <button
                type="button"
                id="toggle-balance-visibility-btn"
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="flex items-center gap-1 text-[10px] bg-[#1a284c]/50 hover:bg-[#20325f]/70 border border-[#2b3f71]/50 text-blue-300 hover:text-white font-bold px-2.5 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                title={isBalanceVisible ? "Hide Balance" : "View Balance"}
              >
                {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isBalanceVisible ? "Hide" : "View"}</span>
              </button>
              <span className="text-[10px] bg-[#1a284c]/50 border border-[#2b3f71]/50 text-blue-300 font-mono font-bold px-2.5 py-1 rounded-full uppercase text-center shrink-0">
                Consolidated Balance
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-sans font-medium">
                Net Assets Portfolio Value
              </span>
              <div id="total-combined-balance-text" className="text-3xl font-extrabold text-white tracking-tight mt-1 select-all font-sans bg-clip-text bg-gradient-to-r from-white to-slate-200">
                {isBalanceVisible ? formatSui(totalBalanceSui, 3) : '•••• SUI'}
              </div>
            </div>

            <div className="border-t border-[#1e2e4e]/50 pt-3 flex justify-between text-xs text-slate-400 gap-x-4 gap-y-1 flex-wrap font-sans">
              <div>
                Spending Liquid: <span className="font-bold text-white mt-0.5 block">{isBalanceVisible ? formatSui(wallet.spendingBalance, 1) + ' SUI' : '•••• SUI'}</span>
              </div>
              <div>
                oWealth Flexible: <span className="font-bold text-green-400 mt-0.5 block">{isBalanceVisible ? formatSui(wallet.flexibleBalance, 1) + ' SUI' : '•••• SUI'}</span>
              </div>
              <div>
                Investment Vaults: <span className="font-bold text-blue-400 mt-0.5 block">{isBalanceVisible ? formatSui(totalLockedFixed + totalLockedTarget, 1) + ' SUI' : '•••• SUI'}</span>
              </div>
            </div>
          </div>

          {/* Spend Money Quick form (Liquid assets) */}
          <div className="bg-[#080d19] border border-slate-800/80 p-5 rounded-3xl shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-450 text-slate-450 uppercase tracking-wider flex items-center gap-1 font-bold font-sans">
                Liquid Cash Spending Balance
              </span>
              <div id="spending-liquid-kpi-text" className="text-2xl font-extrabold text-white mt-1">
                {isBalanceVisible ? formatSui(wallet.spendingBalance, 2) : '•••• SUI'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 mb-3 font-semibold">Native SUI Balance (Liquid Cash Pool)</div>
            </div>

            <form onSubmit={handleSpendWealth} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  id="spending-recipient-address"
                  placeholder="Recipient (0x...)"
                  value={mockSendAddress}
                  onChange={(e) => setMockSendAddress(e.target.value)}
                  className="bg-[#111a30] text-xs px-3 py-2 rounded-xl border border-[#213259]/60 text-slate-150 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    id="spending-amount-to-send"
                    placeholder="SUI Amt"
                    value={mockSendAmount}
                    onChange={(e) => setMockSendAmount(e.target.value)}
                    className="w-full bg-[#111a30] text-xs px-3 py-2 rounded-xl pr-8 border border-[#213259]/60 text-slate-150 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[9px] font-bold text-slate-500 font-mono">SUI</span>
                </div>
              </div>
              <button
                type="submit"
                id="spending-send-submit-btn"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-650/10"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Perform Outward Spend</span>
              </button>
            </form>
          </div>
        </section>

        {/* 4. MAIN INTERACTIVE BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* PayStream Auto-Router budget splits config */}
            <AllocationRules
              rules={rules}
              setRules={setRules}
              targets={targetPlans}
              spendAndSaveEnabled={wallet.spendAndSaveEnabled}
              setSpendAndSaveEnabled={(v) => setWallet(p => ({ ...p, spendAndSaveEnabled: v }))}
              spendAndSavePercentage={wallet.spendAndSavePercentage}
              setSpendAndSavePercentage={(v) => setWallet(p => ({ ...p, spendAndSavePercentage: v }))}
              routingRatioPolicy={routingRatioPolicy}
              setRoutingRatioPolicy={setRoutingRatioPolicy}
            />

            {/* oWealth Interest Pool Panel */}
            <FlexibleSavings
              flexibleBalance={wallet.flexibleBalance}
              accumulatedYieldSui={wallet.accumulatedYieldSui}
              spendingBalance={wallet.spendingBalance}
              onDeposit={handleDepositToFlexible}
              onWithdraw={handleWithdrawFromFlexible}
            />

            {/* Transactions lists with embedded decompiled code dumps */}
            <TransactionsHistory
              transactions={transactions}
              onClearHistory={clearHistory}
            />
          </div>

          <div className="space-y-6">
            {/* Target and Goal saving portfolios */}
            <TargetSavings
              plans={targetPlans}
              onAddPlan={handleAddTargetPlan}
              onDepositToPlan={handleDepositToTargetPlan} // Using target deposit handler
              onWithdrawPlan={handleWithdrawTargetPlan}
              spendingBalance={wallet.spendingBalance}
            />

            {/* Fixed asset locking structures */}
            <FixedDeposits
              plans={fixedDeposits}
              onAddFixedDeposit={handleAddFixedDeposit}
              onWithdrawFixedDeposit={handleWithdrawFixedDeposit}
              onTopUpFixedDeposit={handleTopUpFixedDeposit}
              spendingBalance={wallet.spendingBalance}
            />
          </div>

        </div>
        </>
        )}
          </>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-205 border-slate-200 bg-slate-100 py-10 mt-20 text-xs text-slate-550 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-600 font-sans">SuiWealth (oWealth Sandbox Engine)</span>
          </div>

          <div className="text-slate-500 font-medium font-mono text-xs">
            Sui Mainnet RPC Live Connected
          </div>

          <div className="text-slate-400 font-sans font-medium">
            A comprehensive automated treasury model structured for the Sui Move dynamic ecosystem.
          </div>
        </div>
      </footer>

      {/* Float Toasts for instant user response validation */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {successToast && (
          <motion.div
            id="toast-success-primary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 min-w-[200px]"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}

        {errorToast && (
          <motion.div
            id="toast-error-primary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 min-w-[200px]"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorToast}</span>
          </motion.div>
        )}
      </div>

    </div>
  );
}
