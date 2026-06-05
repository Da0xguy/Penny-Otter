import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { 
  Coins, 
  Sparkles, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Play, 
  Lock, 
  Award, 
  Cpu, 
  Zap, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Percent,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onBypass?: () => void;
}

export default function LandingPage({ onBypass }: LandingPageProps = {}) {
  // 1. Live Compounding Yield Simulator State
  const [simulatedAccrued, setSimulatedAccrued] = useState(0.00000000);
  const [fiatEquivalent, setFiatEquivalent] = useState(0.00);
  const SUI_PRICE_USD = 1.84; // Mock price feed for informational purposes

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedAccrued(prev => {
        const nextVal = prev + 0.00000284;
        setFiatEquivalent(nextVal * SUI_PRICE_USD);
        return nextVal;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 2. Interactive Router Preset State
  const [selectedRoutePreset, setSelectedRoutePreset] = useState<'balanced' | 'acc_savings' | 'alpha_lock'>('balanced');
  
  // 3. APY Projections Calculator State
  const [calculatorAmount, setCalculatorAmount] = useState(1000);
  const [calcDurationYears, setCalcDurationYears] = useState(1); // 1 = 1 Year, 0.5 = 6 Months, 0.08 = 1 Month

  // Calculators return math
  const calculateGain = (amount: number, apy: number, years: number) => {
    return amount * (Math.pow(1 + apy / 100, years) - 1);
  };

  const getSnsDetails = () => {
    switch(selectedRoutePreset) {
      case 'balanced':
        return { spending: 50, flexible: 50, target: 0, description: "Splits incoming funds evenly between direct liquid cash and secure, interest-bearing flexible savings." };
      case 'acc_savings':
        return { spending: 30, flexible: 50, target: 20, description: "Prioritizes immediate asset growth, depositing 70% of inflows directly into interest contracts & milestones." };
      case 'alpha_lock':
        return { spending: 15, flexible: 45, target: 40, description: "Maximum-saving configuration. Channels 85% into active SUI vault contracts to unlock peak compound coefficients." };
    }
  };

  const routeDetails = getSnsDetails();

  // FAQ accordion state
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is PennyOtter and how does the PayStream technology work?",
      a: "PennyOtter is a programmable non-custodial asset routing manager built for the Sui network. It employs PayStream, an autonomous splitting mechanism that triggers upon receiving any transaction block. Rather than manually dispersing funds, the app intercepts inflows and instantly disperses them across liquid accounts, flexible oWealth yield vaults, and lockup contracts in a single operation."
    },
    {
      q: "How are yields generated in the oWealth Flexible and Fixed Lockers?",
      a: "Yields are derived from algorithmic liquidity provisioning, validators staking commissions, and secure money-markets across the Sui DeFi ecosystem. The Flexible Pool yields a stable 8.5% compounding APY with real-time payout ticking. Fixed Lockers amplify your returns by securing collateral for specified tenures: 30 Days (7% APY), 90 Days (10% APY), 180 Days (14% APY), and up to 360 Days at a premium 20% APY."
    },
    {
      q: "What visual speed controls does the sandbox offer?",
      a: "PennyOtter integrates a dual-mode engine: standard live-on-chain tracking, alongside an accelerated sandbox simulation. By switching the Yield Sandbox multiplier from 1x up to 100x or 1,000x, you can compress days of real-time compounding interest into seconds right on your screen to audit and visualize compound curves before locking real currency."
    },
    {
      q: "Are the lockers locked forever? How are early withdrawals handled?",
      a: "Your savings targets and flexible oWealth profiles are instantly fluid, available for claim at any point in time. Fixed Lockers are meant for committed terms; however, a built-in early-liquidation mechanism enforces a 25% early withdrawal penalty on the principal, protecting pool liquidity while returning remaining assets instantly to your liquid spending balance in emergencies."
    },
    {
      q: "Why does PennyOtter utilize single Programmable Transaction Blocks (PTB)?",
      a: "Sui's unique runtime allows developers to bundle multiple instructions (splitting coins, transferring objects, triggering move-module entry calls) into a single atomic executive. PennyOtter executes its routing rules using PTB logic, meaning that no matter how complex your split configuration looks, it signs. This ensures minimal gas usage and guarantees either all actions execute successfully or the state rolls back cleanly with absolute transaction integrity."
    }
  ];

  return (
    <div className="space-y-16 py-4">
      
      {/* HERO SECTION WITH INTEGRATED WALLET CONNECT AND DYNAMIC BLUR EFFECTS */}
      <section className="relative px-4 py-16 md:py-24 rounded-3xl overflow-hidden bg-gradient-to-b from-[#0c0c0e] via-[#050506] to-[#010101] border border-white/[0.06] text-center">
        {/* Abstract futuristic glowing shapes in background */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
        
        {/* Animated badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950/90 border border-zinc-850 rounded-full text-[11px] font-bold text-slate-300 font-sans tracking-wide mb-6 uppercase shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Sui Programmable Finance Engine &bull; Secure V2.1 Sandbox</span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight"
        >
          Programmable Autopilot for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-blue-500">
            Your SUI Asset Streams
          </span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-350 text-slate-300 font-medium text-sm md:text-base mt-6 max-w-2xl mx-auto leading-relaxed"
        >
          PennyOtter automatically splits, routes, and stakes incoming transactions using native Programmable Transaction Blocks (PTB). Connect your SUI wallet to access premium AI budgeting tools, Flexible yield pools, and Fixed savers.
        </motion.p>

        {/* CONNECT WALLET CALL TO ACTION */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 max-w-md mx-auto p-6 bg-black/85 border border-white/[0.08] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl relative z-10"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Authorize Web3 Access
            </h3>
            
            <p className="text-xs text-slate-300 font-semibold max-w-xs mx-auto leading-relaxed">
              Connect a compatible SUI wallet to authorize automated routing parameters and view your live treasury balances.
            </p>

            <div className="pt-2 flex justify-center" id="landing-connect-wallet-container">
              <ConnectButton 
                connectText="Launch Autopilot with SUI Wallet"
                className="!bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-500 hover:!to-indigo-500 !text-white !font-extrabold !text-xs md:!text-sm !py-3.5 !px-8 !rounded-2xl !border-none !shadow-lg !shadow-blue-500/20 hover:!shadow-blue-500/30 transition-all active:scale-95 cursor-pointer !font-sans" 
              />
            </div>

            {onBypass && (
              <div className="pt-2 border-t border-slate-800/60 mt-4 flex flex-col items-center gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Or test in sandbox mode</span>
                <button
                  type="button"
                  id="btn-bypass-wallet"
                  onClick={onBypass}
                  className="w-full text-xs font-bold text-slate-200 hover:text-white bg-blue-950/45 hover:bg-blue-900/30 border border-blue-900/20 hover:border-blue-850 rounded-xl py-2.5 transition-all text-center cursor-pointer font-sans"
                >
                  Proceed as Sandbox Guest ➔
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Non-custodial. Audited, secure, on-chain execution sandboxing.</span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* BENCHMARK COMPARISONS & REVOLUTIONARY APY TICKER SHOWCASE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
        
        {/* LIVE YIELD TICKER DEMO CARD */}
        <div className="bg-black/75 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-green-950/60 border border-green-900/60 text-green-400 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Simulation demo
              </span>
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span>Yield Accruing Live</span>
              </div>
            </div>

            <div className="text-left space-y-1">
              <h3 className="text-lg font-bold text-white font-sans tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>oWealth Continuous Yield Pool</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Watch how your assets generate interest continuously. SUI oWealth utilizes multi-pool liquidity mechanisms to distribute steady 8.5% APY payout.
              </p>
            </div>

            {/* Numeric Accruing Area */}
            <div className="p-5 bg-zinc-950/45 border border-zinc-900 rounded-2xl text-center space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                Simulated Interest Gained (1,000 SUI Base)
              </span>
              <div className="text-2xl font-extrabold text-green-400 font-mono select-all tracking-tight">
                +{simulatedAccrued.toFixed(8)} <span className="text-xs text-slate-400 font-semibold font-sans">SUI</span>
              </div>
              <div className="text-xs text-slate-400 font-mono font-bold">
                &bull; USD equivalent: <span className="text-white">${fiatEquivalent.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 text-left border-t border-slate-800/60 pt-3.5 flex justify-between text-[11px] text-slate-500 font-sans">
            <div>
              Flexible Vault APY: <span className="font-bold text-green-400 block mt-0.5">8.5% Stable</span>
            </div>
            <div>
              Compound Interval: <span className="font-bold text-slate-300 block mt-0.5">Every Fraction-Second</span>
            </div>
            <div>
              Minimum Locked: <span className="font-bold text-slate-300 block mt-0.5">0.00 SUI (Unbounded)</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE PAYSTREAM AUTOROUTING SANDBOX */}
        <div className="bg-black/75 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-blue-950/60 border border-blue-900/60 text-blue-400 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Interactive Router Workbench
              </span>
              <span className="text-slate-400 text-xs font-bold font-sans">
                PTB Split Sandbox
              </span>
            </div>

            <div className="text-left space-y-1">
              <h3 className="text-lg font-bold text-white font-sans tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Auto-Routing Custom Splits</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                PennyOtter decomposes every incoming stream block. Choose a routing template to preview the automatic PTB allocation logic:
              </p>
            </div>

            {/* Slider Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950/90 rounded-xl border border-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedRoutePreset('balanced')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  selectedRoutePreset === 'balanced' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Balanced V1
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoutePreset('acc_savings')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  selectedRoutePreset === 'acc_savings' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Accelerated Saving
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoutePreset('alpha_lock')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  selectedRoutePreset === 'alpha_lock' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Alpha Staker
              </button>
            </div>

            {/* Split visualization bars */}
            <div className="p-4 bg-zinc-950/20 border border-zinc-900/40 rounded-2xl space-y-3.5">
              <p className="text-[11px] text-slate-400 text-left leading-relaxed font-semibold italic min-h-[36px]">
                "{routeDetails.description}"
              </p>

              <div className="space-y-2">
                {/* Spending bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-350 text-slate-300 mb-1">
                    <span>LIQUID SPENDING BALANCE</span>
                    <span className="text-white">{routeDetails.spending}%</span>
                  </div>
                  <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-300 h-full transition-all duration-500" style={{ width: `${routeDetails.spending}%` }} />
                  </div>
                </div>

                {/* oWealth Flexible bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-green-400 mb-1">
                    <span>oWEALTH FLEXIBLE POOL (8.5% APY)</span>
                    <span>{routeDetails.flexible}%</span>
                  </div>
                  <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${routeDetails.flexible}%` }} />
                  </div>
                </div>

                {/* Target savings bar */}
                {routeDetails.target > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-blue-400 mb-1">
                      <span>SAVINGS GOALS & MILESTONES</span>
                      <span>{routeDetails.target}%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${routeDetails.target}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 text-left border-t border-slate-800/60 pt-3.5 flex justify-between text-[11px] text-slate-500 font-sans">
            <div>
              Network Execution: <span className="font-bold text-blue-400 block mt-0.5">Atomic PTB Block</span>
            </div>
            <div>
              Split Cost: <span className="font-bold text-slate-350 text-slate-300 block mt-0.5">&lt; 0.005 SUI Gas</span>
            </div>
            <div>
              Automatic Routing: <span className="font-bold text-green-400 block mt-0.5">Fully Enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* APY PROJECTIONS CALCULATOR SECTION */}
      <section className="bg-gradient-to-br from-[#0c0c0e] to-[#040405] border border-white/[0.06] p-6 md:p-8 rounded-3xl shadow-xl relative">
        <div className="absolute top-0 right-0 w-45 h-45 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Inputs area */}
          <div className="md:col-span-1 space-y-6 text-left">
            <div>
              <h3 className="text-xl font-extrabold text-white font-sans tracking-tight">
                SUI Growth Projection Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                Configure your hypothetical total SUI balance and lock-up parameters to examine predicted returns in our treasury sandbox.
              </p>
            </div>

            <div className="space-y-4">
              {/* Slider for amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-slate-400 uppercase">Principal SUI Deposit</span>
                  <span className="text-blue-400 text-sm">{calculatorAmount.toLocaleString()} SUI</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={25000}
                  step={50}
                  id="calc-suideposit-slider"
                  className="w-full h-1.5 cursor-pointer accent-blue-500 bg-slate-800 rounded-lg"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
                  <span>10 SUI</span>
                  <span>10K SUI</span>
                  <span>25K SUI</span>
                </div>
              </div>

              {/* Slider for duration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-slate-400 uppercase">Saver Tenure Locked</span>
                  <span className="text-indigo-400 text-sm">
                    {calcDurationYears === 0.08 ? '1 Month' : calcDurationYears === 0.5 ? '6 Months' : '1 Year'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCalcDurationYears(0.08)}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                      calcDurationYears === 0.08 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcDurationYears(0.5)}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                      calcDurationYears === 0.5 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcDurationYears(1)}
                    className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                      calcDurationYears === 1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Year
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Outputs area (Side-by-side returns) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* oWealth Flex Pool */}
            <div className="bg-black/45 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between text-left shadow-sm">
              <div>
                <div className="flex items-center gap-1.5 text-green-400 mb-1.5">
                  <Percent className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">oWealth Flexible</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  8.5% <span className="text-[10px] text-slate-400 font-semibold font-sans">APY</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  Fluid, instant asset availability. Perfect for standard liquidity routines.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/40 font-mono text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500">Projected Yield</span>
                <div className="text-md text-green-450 text-green-400 font-bold mt-0.5">
                  +{calculateGain(calculatorAmount, 8.5, calcDurationYears).toFixed(3)} SUI
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Total: {(calculatorAmount + calculateGain(calculatorAmount, 8.5, calcDurationYears)).toFixed(1)} SUI
                </span>
              </div>
            </div>

            {/* 90 Days Locker */}
            <div className="bg-black/45 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between text-left shadow-sm">
              <div>
                <div className="flex items-center gap-1.5 text-blue-400 mb-1.5">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">Moderate Lock Locker</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  10.0% <span className="text-[10px] text-slate-400 font-semibold font-sans">APY</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  Accumulate locked-interest. Released automatically upon term maturity.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/40 font-mono text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500">Projected Yield</span>
                <div className="text-md text-blue-400 font-bold mt-0.5">
                  +{calculateGain(calculatorAmount, 10.0, calcDurationYears).toFixed(3)} SUI
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Total: {(calculatorAmount + calculateGain(calculatorAmount, 10.0, calcDurationYears)).toFixed(1)} SUI
                </span>
              </div>
            </div>

            {/* 360 Days Locker */}
            <div className="bg-black/55 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between text-left shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600/10 text-blue-400 uppercase font-mono text-[8px] font-black px-2 py-0.5 rounded-bl-xl tracking-wider">
                MAX VALUE
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 text-indigo-400 mb-1.5">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">Peak Alpha Locker</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  20.0% <span className="text-[10px] text-slate-400 font-semibold font-sans">APY</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  Maximum growth. Yield coefficients augmented for secure 360-day savers.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-900/20 font-mono text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500">Projected Yield</span>
                <div className="text-md text-indigo-400 font-bold mt-0.5">
                  +{calculateGain(calculatorAmount, 20.0, calcDurationYears).toFixed(3)} SUI
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Total: {(calculatorAmount + calculateGain(calculatorAmount, 20.0, calcDurationYears)).toFixed(1)} SUI
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DEEP INTEGRATION TECHNICAL SPOTLIGHT - SUI PROGRAMMABLE TRANSACTION BLOCKS */}
      <section className="bg-black/40 border border-zinc-900/50 p-6 md:p-8 rounded-3xl relative overflow-hidden text-left">
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-950/80 border border-blue-900 border-opacity-40 rounded text-[9px] font-bold text-blue-400 font-mono uppercase tracking-wider">
              Advanced technical mechanism
            </div>
            
            <h3 className="text-2xl font-black text-white font-sans tracking-tight leading-tight">
              Powered by Sui Programmable <br />
              Transaction Blocks (PTB)
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Unlike typical EVM chains where complex splits require multiple transaction authorizations and compound gas costs, Sui's executive model enables true atomic chaining.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 font-semibold font-sans">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>One-Click Split Signatures: Execute multisend, stake, and transfers in 1 block.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Exceptional Gas Efficiency: Save up to 80% on network execution fees.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Absolute Asset Safety: Non-custodial contracts keep you in complete control.</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 w-full p-4.5 bg-zinc-950/80 border border-zinc-900 rounded-2xl shadow-inner font-mono text-[10px] text-slate-400 space-y-2 select-all max-h-[195px] overflow-y-auto">
            <span className="text-[9px] text-[#aaaccc] font-extrabold uppercase tracking-widest block border-b border-[#1b2b45] pb-1.5 mb-1.5">
              Atomic Routing Decompiled Execution Block (PTB Mock)
            </span>
            <div className="text-blue-400 font-bold">// Initialize atomic transaction block assembler</div>
            <div>let tx = new TransactionBlock();</div>
            <div className="text-indigo-400">tx.setSender(0x_active_user_wallet_address);</div>
            <div className="text-blue-400">// Split incoming Sui PayStream block directly into rules</div>
            <div>let [coin_1, coin_2] = tx.splitCoins(tx.gas, [tx.pure(500), tx.pure(500)]);</div>
            <div className="text-emerald-400">tx.moveCall({`{`}</div>
            <div className="pl-4">target: "suiwealth::oWealth_vault::deposit",</div>
            <div className="pl-4">arguments: [coin_1]</div>
            <div className="text-emerald-400">{`}`});</div>
            <div className="text-blue-400">// Distribute remaining balance dynamically into active targets</div>
            <div>tx.transferObjects([coin_2], 0x_active_user_wallet_address);</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-extrabold text-white font-sans tracking-tight">
            How it Works
          </h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-semibold">
            Follow our four simple step pipeline to establish an automated treasury in the oWealth Sandbox universe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-zinc-950/45 border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-black text-xs">
              01
            </div>
            <h4 className="font-bold text-sm text-white font-sans">Connect Wallet</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Establish a secure wallet link. Authenticate utilizing the Sui dApp Kit system with zero risk to personal assets.
            </p>
          </div>

          <div className="bg-zinc-950/45 border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-black text-xs">
              02
            </div>
            <h4 className="font-bold text-sm text-white font-sans">Establish Ratios</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Program custom division ratios of your income streams using the percentage-free budget policy manager.
            </p>
          </div>

          <div className="bg-zinc-950/45 border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-black text-xs">
              03
            </div>
            <h4 className="font-bold text-sm text-white font-sans">Run Sandbox Splits</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Simulate incoming transfers or request initial SUI faucet rewards to watch the platform distribute capital atomically.
            </p>
          </div>

          <div className="bg-zinc-950/45 border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono font-black text-xs">
              04
            </div>
            <h4 className="font-bold text-sm text-white font-sans">Accrue Yields</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Observe continuously compounding oWealth flexible interest payouts and audit optimization suggestions from the AI Advisor.
            </p>
          </div>

        </div>
      </section>

      {/* ACCORDION FAQ SECTION */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-extrabold text-white font-sans tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Everything you need to know about the PennyOtter non-custodial sandbox environment.
          </p>
        </div>

        <div className="border border-zinc-900 rounded-3xl overflow-hidden bg-black/40">
          
          {faqs.map((faq, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <div key={index} className="transition-all">
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  className="w-full py-4.5 px-6 flex justify-between items-center text-left hover:bg-slate-900/40 transition-all cursor-pointer"
                >
                  <span className="font-bold text-white text-xs md:text-sm font-sans">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-350 ${
                    isOpen ? 'rotate-180 text-blue-400' : ''
                  }`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden bg-black/10"
                    >
                      <div className="p-6 text-slate-350 text-slate-300 text-xs leading-relaxed font-semibold border-t border-slate-850 text-left">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

        </div>
      </section>

    </div>
  );
}
