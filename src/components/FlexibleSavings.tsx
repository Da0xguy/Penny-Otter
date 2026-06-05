/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatSui } from '../utils';
import { TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlexibleSavingsProps {
  flexibleBalance: number;
  accumulatedYieldSui: number;
  spendingBalance: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
}

export default function FlexibleSavings({
  flexibleBalance,
  accumulatedYieldSui,
  spendingBalance,
  onDeposit,
  onWithdraw,
}: FlexibleSavingsProps) {
  const [amountInput, setAmountInput] = useState('');
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getGasEstimate = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) return 0.002164;
    return 0.002164 + Math.min(0.005, amt * 0.00001);
  };

  // D3 Sizing states and elements
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 110 });

  // SUI yields roughly 8.5% APY on oWealth (simulates NAVI/Suilend money market pools)
  const poolApy = 8.5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (actionType === 'deposit') {
      if (amt > spendingBalance) {
        setErrorMsg(`Insufficient Spending balance. You only have ${formatSui(spendingBalance)} available.`);
        return;
      }
      onDeposit(amt);
      setSuccessMsg(`Successfully deposited ${formatSui(amt)} into Flexible Savings!`);
      setAmountInput('');
    } else {
      if (amt > flexibleBalance) {
        setErrorMsg(`Insufficient Flexible Savings balance. You only have ${formatSui(flexibleBalance)} locked in yield.`);
        return;
      }
      onWithdraw(amt);
      setSuccessMsg(`Successfully withdrawn ${formatSui(amt)} to liquid Spending Balance.`);
      setAmountInput('');
    }
  };

  // Auto clean notifications
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Generate 30 days of yield history ending at the current accumulated yield
  const generate30DayHistory = (currentYield: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayIndex = 30 - i; // 1 to 30
      
      const ratio = 0.15 + 0.85 * Math.pow(dayIndex / 30, 2.0);
      const cumulativeYield = currentYield * ratio;
      
      const prevRatio = dayIndex === 1 ? 0 : 0.15 + 0.85 * Math.pow((dayIndex - 1) / 30, 2.0);
      const dailyAccrual = currentYield * (ratio - prevRatio);
      
      data.push({
        date,
        dayLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cumulativeYield,
        dailyAccrual,
      });
    }
    return data;
  };

  // Handle container responsiveness using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions(prev => ({
        ...prev,
        width: Math.max(width, 245)
      }));
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw the D3 line chart on state dynamics
  useEffect(() => {
    if (!svgRef.current) return;

    const data = generate30DayHistory(accumulatedYieldSui);
    const { width, height } = dimensions;
    const margin = { top: 12, right: 12, bottom: 20, left: 45 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Main SVG group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale mappings
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const maxVal = d3.max(data, d => d.cumulativeYield) || 0.0001;
    const yScale = d3.scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([chartHeight, 0]);

    // Line generator
    const lineGenerator = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.cumulativeYield))
      .curve(d3.curveMonotoneX);

    // Area generator
    const areaGenerator = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.cumulativeYield))
      .curve(d3.curveMonotoneX);

    // Color gradient setup
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'yield-chart-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.20);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.01);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(width / 70, 5))
      .tickFormat((d: any) => d3.timeFormat('%d %b')(d));

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('class', 'stroke-slate-800'))
      .call(g => g.selectAll('.tick line').attr('class', 'stroke-slate-900'))
      .call(g => g.selectAll('.tick text').attr('class', 'fill-slate-500 font-mono text-[9px] font-semibold'));

    const yAxisFormatter = (val: any) => {
      if (val === 0) return '0';
      if (val < 0.001) return val.toFixed(5);
      if (val < 0.01) return val.toFixed(4);
      return val.toFixed(3);
    };

    const yAxis = d3.axisLeft(yScale)
      .ticks(3)
      .tickFormat(yAxisFormatter);

    g.append('g')
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('class', 'stroke-slate-900')
        .attr('stroke-dasharray', '2,2')
        .attr('x2', chartWidth)
      )
      .call(g => g.selectAll('.tick text').attr('class', 'fill-slate-500 font-mono text-[9px] font-semibold').attr('dx', -2));

    // Area path
    g.append('path')
      .datum(data)
      .attr('d', areaGenerator)
      .attr('fill', 'url(#yield-chart-gradient)');

    // Line path
    g.append('path')
      .datum(data)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('class', 'stroke-blue-400')
      .attr('stroke-width', 2);

    // Overlay indicators
    const hoverLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('class', 'stroke-slate-700')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 1)
      .style('opacity', 0);

    const hoverCircle = g.append('circle')
      .attr('r', 4.5)
      .attr('class', 'fill-blue-500 stroke-slate-950')
      .attr('stroke-width', 1.5)
      .style('opacity', 0);

    const bisectDate = d3.bisector((d: any) => d.date).left;

    const onPointerMove = (event: any) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX - margin.left);
      const i = bisectDate(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];

      let d = d0;
      if (d1 && d1.date) {
        d = (x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()) ? d1 : d0;
      }

      const rawMouseX = mouseX - margin.left;
      if (d && rawMouseX >= 0 && rawMouseX <= chartWidth) {
        hoverLine
          .attr('x1', xScale(d.date))
          .attr('x2', xScale(d.date))
          .style('opacity', 1);

        hoverCircle
          .attr('cx', xScale(d.date))
          .attr('cy', yScale(d.cumulativeYield))
          .style('opacity', 1);

        setHoveredData(d);
      } else {
        hoverLine.style('opacity', 0);
        hoverCircle.style('opacity', 0);
        setHoveredData(null);
      }
    };

    const onPointerLeave = () => {
      hoverLine.style('opacity', 0);
      hoverCircle.style('opacity', 0);
      setHoveredData(null);
    };

    svg.on('pointermove', onPointerMove);
    svg.on('pointerleave', onPointerLeave);

  }, [dimensions, accumulatedYieldSui]);

  return (
    <motion.div 
      id="flexible-savings-panel" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#080d19] border border-slate-800/80 rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col gap-4"
    >
      {/* Aesthetic background halo */}
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-white font-bold text-base font-sans">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span>oWealth Flexible Yield</span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-950/40 border border-green-900/40 text-green-300 font-mono text-xs px-2.5 py-0.5 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="font-bold">{poolApy}% APY Daily</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left section - Stats & Compact Action Forms (spanning 7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            {/* Dynamic description */}
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Earn high yield continuously from integrated Sui DeFi money markets. Withdraw or deposit anytime instantly with zero gas overhead and atomic compounding.
            </p>

            {/* Central yield trackers */}
            <div className="grid grid-cols-2 gap-35 grid-cols-2 gap-3.5">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#0c1428] p-3.5 border border-slate-800/50 rounded-2xl flex flex-col justify-between"
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-extrabold">Flexible Balance</span>
                <div id="flexible-sui-text" className="text-lg font-extrabold text-white font-mono mt-1 select-all">
                  {formatSui(flexibleBalance, 5)}
                </div>
                <div id="flexible-comment-text" className="text-[10px] text-slate-500 mt-1 font-semibold font-sans">
                  Compounding Active
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-green-950/10 p-3.5 border border-green-900/45 rounded-2xl flex flex-col justify-between"
              >
                <span className="text-[10px] uppercase tracking-wider text-green-400 font-sans font-extrabold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Yield Earned</span>
                </span>
                <div id="yield-earned-sui" className="text-lg font-bold text-green-400 font-mono mt-1">
                  +{formatSui(accumulatedYieldSui, 7)}
                </div>
                <div id="yield-earned-comment" className="text-[10px] text-green-400/80 font-bold mt-1 font-sans">
                  Accruing continuously
                </div>
              </motion.div>
            </div>
          </div>

          {/* Action form nested cleanly */}
          <div className="bg-[#0c1428]/40 border border-[#111a30] p-4 rounded-2xl space-y-3.5">
            <div className="flex bg-[#0c1428] p-1 rounded-xl border border-slate-800 relative">
              <button
                type="button"
                id="btn-switch-deposit"
                onClick={() => setActionType('deposit')}
                className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer"
              >
                <span className={actionType === 'deposit' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}>Deposit</span>
                {actionType === 'deposit' && (
                  <motion.div 
                    layoutId="actionTabBG" 
                    className="absolute inset-0 bg-blue-600 rounded-lg -z-10" 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                id="btn-switch-withdraw"
                onClick={() => setActionType('withdraw')}
                className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer"
              >
                <span className={actionType === 'withdraw' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}>Withdraw</span>
                {actionType === 'withdraw' && (
                  <motion.div 
                    layoutId="actionTabBG" 
                    className="absolute inset-0 bg-rose-600 rounded-lg -z-10" 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="relative">
                <input
                  type="number"
                  id="savings-amount-input"
                  step="any"
                  min="0"
                  placeholder={`Amount (Available: ${actionType === 'deposit' ? spendingBalance.toFixed(2) : flexibleBalance.toFixed(2)} SUI)`}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-[#111a30] border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all pr-12 focus:ring-1 focus:ring-blue-500/20"
                />
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 font-mono text-[10px] font-bold text-slate-500">
                  SUI
                </span>
              </div>

              <div id="gas-estimate-hint" className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Est. Network Gas:</span>
                <span className="text-blue-400 font-semibold">{getGasEstimate().toFixed(6)} SUI</span>
              </div>

              {actionType === 'withdraw' ? (
                <div className="flex gap-2 justify-between">
                  {(['25%', '50%', '100%'] as const).map((pct) => {
                    const factor = pct === '25%' ? 0.25 : pct === '50%' ? 0.5 : 1.0;
                    return (
                      <motion.button
                        key={pct}
                        type="button"
                        id={`quick-withdraw-${pct.replace('%', '')}-btn`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setAmountInput((flexibleBalance * factor).toFixed(5));
                        }}
                        className="flex-1 text-center py-1.5 bg-[#0c1428] hover:bg-[#121d37] border border-slate-800 text-[10px] font-sans font-extrabold text-slate-300 hover:text-white rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        {pct}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    id="quick-half-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setAmountInput((spendingBalance / 2).toFixed(2));
                    }}
                    className="flex-1 py-1.5 bg-[#0c1428] hover:bg-[#121d37] border border-slate-800 text-[10px] font-mono text-[#94a3b8] hover:text-white rounded-lg shadow-sm transition-all cursor-pointer font-bold"
                  >
                    50% SUI
                  </motion.button>
                  <motion.button
                    type="button"
                    id="quick-max-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setAmountInput(spendingBalance.toFixed(2));
                    }}
                    className="flex-1 py-1.5 bg-[#0c1428] hover:bg-[#121d37] border border-slate-800 text-[10px] font-mono text-[#94a3b8] hover:text-white rounded-lg shadow-sm transition-all cursor-pointer font-bold"
                  >
                    MAX SUI
                  </motion.button>
                </div>
              )}

              <motion.button
                type="submit"
                id="savings-submit-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold font-sans transition-all shadow-md cursor-pointer ${
                  actionType === 'deposit'
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-rose-600 text-white hover:bg-rose-500'
                }`}
              >
                {actionType === 'deposit' ? 'Confirm oWealth Deposit' : 'Confirm oWealth Withdrawal'}
              </motion.button>
            </form>

            <AnimatePresence mode="popLayout">
              {errorMsg && (
                <motion.div 
                  id="savings-error-msg" 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden text-[11px] bg-[#240a12]/80 border border-rose-950 text-rose-450 text-rose-400 p-2.5 rounded-xl flex items-center gap-1.5 font-sans"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  id="savings-success-msg" 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden text-[11px] bg-[#092415]/80 border border-green-950 text-green-400 p-2.5 rounded-xl font-sans"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section - Compounding chart trends (spanning 5 cols) */}
        <div className="md:col-span-12 lg:col-span-5 bg-[#0a0f1e]/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between gap-3 h-full">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-extrabold">
                Accrued Yield Trend
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                30-Day Curve
              </span>
            </div>
            
            <div ref={containerRef} className="w-full relative select-none">
              <svg 
                ref={svgRef} 
                width={dimensions.width} 
                height={dimensions.height} 
                className="w-full h-auto overflow-visible cursor-crosshair block"
                id="dfi-yield-chart"
              />
            </div>
          </div>

          {/* Interactive Tooltip bar info */}
          <div className="mt-auto">
            <AnimatePresence mode="wait">
              {hoveredData ? (
                <motion.div 
                  key="tooltip"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col gap-1 bg-[#0b1223] border border-slate-800/80 p-2.5 rounded-xl text-[10px] text-slate-300 font-mono transition-all"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Date:</span>
                    <strong className="text-white">{hoveredData.dayLabel}</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-900">
                    <span className="text-slate-500 font-sans">Daily ACC:</span>
                    <strong className="text-green-400">+{formatSui(hoveredData.dailyAccrual, 6)}</strong>
                  </div>
                  <div className="flex justify-between pt-0.5 font-bold">
                    <span className="text-slate-400 font-sans">Total Accrued:</span>
                    <strong className="text-blue-400">{formatSui(hoveredData.cumulativeYield, 6)}</strong>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-1 bg-[#080d19]/40 border border-[#111a30] p-2.5 rounded-xl text-[10px] text-slate-500 font-mono transition-all select-none"
                >
                  <div className="flex justify-between font-bold">
                    <span className="font-sans">Status:</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Compounding Live</span>
                    </span>
                  </div>
                  <p className="text-[10px] leading-tight text-slate-500 mt-1 font-sans">
                    Hover or drag across the chart to view continuous yield granular compounding metrics.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
