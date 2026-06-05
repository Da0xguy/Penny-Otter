/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoricalTransaction } from '../types';
import { formatSui, formatDate, truncateAddress } from '../utils';
import { 
  ListFilter, 
  ArrowDown, 
  ArrowUp, 
  Calendar, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  Hash,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TransactionsHistoryProps {
  transactions: HistoricalTransaction[];
  onClearHistory: () => void;
}

export default function TransactionsHistory({ transactions, onClearHistory }: TransactionsHistoryProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily'>('cumulative');
  const [selectedTx, setSelectedTx] = useState<HistoricalTransaction | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedPtb, setCopiedPtb] = useState<boolean>(false);

  const filteredTxs = transactions.filter(tx => {
    if (filterType === 'all') return true;
    if (filterType === 'incoming') return tx.type === 'incoming_transfer' || tx.type === 'faucet_claim';
    if (filterType === 'saving') return tx.type === 'spend_and_save_trigger' || tx.type === 'programmable_allocation';
    if (filterType === 'withdraw') return tx.type.startsWith('withdraw_');
    return true;
  });

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'faucet_claim': return 'Claimed Faucet Gas';
      case 'incoming_transfer': return 'Incoming Sui Stream';
      case 'programmable_allocation': return 'PTB Asset Split Routing';
      case 'spend_and_save_trigger': return 'Spend & Save Auto-Save';
      case 'withdraw_flexible': return 'oWealth Flex Deposit Lockout';
      case 'withdraw_fixed': return 'Fixed Capital Claim / Termination';
      case 'withdraw_target': return 'Savings Goal Release';
      case 'spending_transfer': return 'External Spending Outward';
      default: return 'Contract Call Execution';
    }
  };

  const getFallbackPtbSteps = (tx: HistoricalTransaction) => {
    if (tx.ptbSteps && tx.ptbSteps.length > 0) return tx.ptbSteps;
    
    const label = getTransactionLabel(tx.type);
    const isCredit = tx.type === 'incoming_transfer' || tx.type === 'faucet_claim' || tx.type.startsWith('withdraw_');
    
    return [
      `// Atomically compiled programmable block - ${label}`,
      `tx.setSender(0x3f5c...92a1);`,
      isCredit 
        ? `let [input_coin] = tx.splitCoins(tx.gas, [${tx.amountSui.toFixed(4)}]);`
        : `let [spend_coin] = tx.splitCoins(tx.gas, [${tx.amountSui.toFixed(4)}]);`,
      isCredit
        ? `tx.transferObjects([input_coin], wallet_address);`
        : `tx.transferObjects([spend_coin], external_recipient);`,
      `// Verified ledger commit succeeded`
    ];
  };

  const copyToClipboard = (text: string, mode: 'hash' | 'ptb') => {
    navigator.clipboard.writeText(text);
    if (mode === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedPtb(true);
      setTimeout(() => setCopiedPtb(false), 2000);
    }
  };

  // Prepare chart data for the past 30 days
  const prepareChartData = () => {
    const dataList: { date: string; formattedDate: string; netFlow: number; cumulative: number }[] = [];
    const today = new Date();
    
    // Generate dates for the last 30 days ending today
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataList.push({
        date: dateString,
        formattedDate,
        netFlow: 0,
        cumulative: 0,
      });
    }

    // Sort transactions chronologically
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate baseline cumulative sum from transactions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysAgoTime = thirtyDaysAgo.getTime();

    let cumulativeSum = 0;
    sortedTxs.forEach(tx => {
      const isCredit = tx.type === 'incoming_transfer' || tx.type === 'faucet_claim' || tx.type.startsWith('withdraw_');
      const amount = isCredit ? tx.amountSui : -tx.amountSui;
      const txTime = new Date(tx.timestamp).getTime();
      
      if (txTime < thirtyDaysAgoTime) {
        cumulativeSum += amount;
      }
    });

    // Compute daily and cumulative changes
    dataList.forEach(day => {
      // Find all transactions on this visual day
      const dayTxs = transactions.filter(tx => {
        const txDateStr = new Date(tx.timestamp).toISOString().split('T')[0];
        return txDateStr === day.date;
      });

      let dayNet = 0;
      dayTxs.forEach(tx => {
        const isCredit = tx.type === 'incoming_transfer' || tx.type === 'faucet_claim' || tx.type.startsWith('withdraw_');
        dayNet += isCredit ? tx.amountSui : -tx.amountSui;
      });

      day.netFlow = Number(dayNet.toFixed(4));
      cumulativeSum += dayNet;
      // We keep a healthy ceiling and zero baseline
      day.cumulative = Number(Math.max(0, cumulativeSum).toFixed(4));
    });

    return dataList;
  };

  const chartData = prepareChartData();

  return (
    <div id="transactions-history-panel" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      {/* Structural layout: Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-base font-sans flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-blue-600" />
            <span>Consolidated Flow Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5 font-medium">
            Real-time audit trailing of inbound streams, active savings transfers, and capital claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="history-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 text-xs text-slate-700 font-semibold rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm transition-all active:scale-[0.98]"
          >
            <option value="all">All Flows</option>
            <option value="incoming">Incoming Funds</option>
            <option value="saving">Automated Saves</option>
            <option value="withdraw">Locker Claims</option>
          </select>

          <button
            id="clear-history-btn"
            onClick={onClearHistory}
            className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/60 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* 30-Day Flow Trend Line/Area Chart */}
      <div id="transactions-flow-chart" className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              30-Day Capital Position Trend
            </h4>
            <p className="text-[10px] text-slate-450 text-slate-500 font-medium font-sans">
              {chartMode === 'cumulative' 
                ? 'Overview of running wallet balance changes (SUI) over time' 
                : 'Net daily inflow / outflow balance adjustments'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
            <button
              onClick={() => setChartMode('cumulative')}
              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                chartMode === 'cumulative'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cumulative Flow
            </button>
            <button
              onClick={() => setChartMode('daily')}
              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                chartMode === 'daily'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daily Net
            </button>
          </div>
        </div>

        <div className="h-[120px] w-full font-sans text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 3, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSui" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.005}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey="formattedDate" 
                tickLine={false} 
                axisLine={false}
                stroke="#94a3b8" 
                fontSize={8}
                dy={3}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                stroke="#94a3b8" 
                fontSize={8}
                dx={-3}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-md font-sans">
                        <p className="text-[9px] font-bold text-slate-400 mb-0.5">{data.date}</p>
                        <p className="text-[11px] font-bold text-slate-800 flex items-center justify-between gap-3">
                          <span>{chartMode === 'cumulative' ? 'Cumulative Flow:' : 'Net Adjust:'}</span>
                          <span className={payload[0].value >= 0 ? 'text-green-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                            {payload[0].value >= 0 ? '+' : ''}{payload[0].value} SUI
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={chartMode === 'cumulative' ? 'cumulative' : 'netFlow'} 
                stroke="#2563eb" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorSui)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Structured Table Headings for Desktop */}
      {filteredTxs.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-4 pb-2 px-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans border-b border-slate-100 mb-3">
          <div className="col-span-3">Timestamp & Date</div>
          <div className="col-span-5">Activity Category</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Net Flow SUI</div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2 relative">
        <AnimatePresence mode="popLayout">
          {filteredTxs.length === 0 ? (
            <motion.div
              key="empty-ledger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 font-sans"
            >
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No matching stream records found.</p>
              <p className="text-xs text-slate-500 mt-1 font-sans">Trigger simulated transactions or claim gas funds to begin!</p>
            </motion.div>
          ) : (
            filteredTxs.map((tx) => {
              const isCredit = tx.type === 'incoming_transfer' || tx.type === 'faucet_claim' || tx.type.startsWith('withdraw_');

              return (
                <motion.div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                  className="bg-slate-50/60 border border-slate-100 rounded-2xl md:rounded-xl overflow-hidden transition-all hover:bg-slate-100/50 hover:border-slate-200/80 shadow-sm p-4 md:p-3"
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 gap-3.5 md:items-center">
                    
                    {/* Column 1: Direction badge & Timestamp */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 border ${
                        isCredit
                          ? 'bg-green-50 text-green-600 border-green-150'
                          : 'bg-rose-50 text-rose-600 border-rose-150'
                      }`}>
                        {isCredit ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 font-mono font-medium">
                          {formatDate(tx.timestamp)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-sans font-semibold uppercase tracking-wider md:hidden mt-0.5">
                          Type: <span className={isCredit ? 'text-green-600' : 'text-rose-600'}>{isCredit ? 'Received' : 'Sent'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Event name & description (NO code tags!) */}
                    <div className="col-span-5 flex flex-col justify-center font-sans">
                      <span className="font-bold text-xs text-slate-800">
                        {getTransactionLabel(tx.type)}
                      </span>
                      <p className="text-xs text-slate-600 leading-normal mt-0.5">
                        {tx.description}
                      </p>
                    </div>

                    {/* Column 3: Status Badge */}
                    <div className="col-span-2 flex items-center md:justify-center justify-between border-t border-slate-100 pt-2.5 md:pt-0 md:border-none">
                      <span className="text-[10px] text-slate-400 font-sans md:hidden uppercase font-semibold">Status:</span>
                      <div className="flex items-center gap-1 text-[9px] font-bold bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-full font-sans uppercase">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        <span>Verified</span>
                      </div>
                    </div>

                    {/* Column 4: Amount SUI */}
                    <div className="col-span-2 flex justify-between md:justify-end items-center border-t border-slate-100 pt-2.5 md:pt-0 md:border-none font-mono">
                      <span className="text-[10px] text-slate-400 font-sans font-medium md:hidden uppercase font-semibold">
                        Net Flow
                      </span>
                      <span className={`text-xs sm:text-sm font-bold ${isCredit ? 'text-green-600' : 'text-slate-800'}`}>
                        {isCredit ? '+' : '-'}{formatSui(tx.amountSui, 2)}
                      </span>
                    </div>

                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
