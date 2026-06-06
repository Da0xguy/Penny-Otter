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
  IncomingPaymentAlert,
  OtterInvestment
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
  Brain,
  Mail,
  Bell,
  Lock,
  Target,
  History,
  Droplets,
  QrCode,
  Camera,
  X,
  Settings,
  Briefcase,
  Bot,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectButton, useCurrentAccount, useSuiClient, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import jsQR from 'jsqr';

// ---------------- FIREBASE & CLOUD DATABASE PERSISTENCE SERVICES ----------------
import { auth } from './firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getUserProfile,
  saveUserProfile,
  getAllocationRules,
  saveAllocationRule,
  deleteAllocationRule,
  getTargetSavingsPlans,
  saveTargetSavingsPlan,
  deleteTargetSavingsPlan,
  getFixedDepositPlans,
  saveFixedDepositPlan,
  deleteFixedDepositPlan,
  getHistoricalTransactions,
  saveHistoricalTransaction
} from './firestoreService';

const INITIAL_ADDRESS = '0x3f5c8ca28e9301da01dfb0cb901b028dfac90da01fd8';

const CATEGORIES_CONFIG = [
  { id: 'flexible', label: 'Flexible Yield', icon: TrendingUp, badge: '0.001% WK' },
  { id: 'fixed', label: 'Fixed Lockers', icon: Lock, badge: 'UP TO 0.7%' },
  { id: 'target', label: 'Target Goals', icon: Target },
  { id: 'rules', label: 'Split Rules', icon: Layers },
  { id: 'advisor', label: 'Otter AI', icon: Brain },
  { id: 'investments', label: 'Current Invests', icon: Briefcase },
  { id: 'ledger', label: 'Flow Ledger', icon: History },
  { id: 'transfer', label: 'Outward Spend', icon: Send }
];

function AnimatedSuiBalance({ value, isVisible, onClick }: { value: number; isVisible: boolean; onClick?: () => void }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [balanceChange, setBalanceChange] = useState<{ amount: number; type: 'increase' | 'decrease' } | null>(null);
  const prevValueRef = useRef(0);
  const isFirstMountRef = useRef(true);
  const animationRef = useRef<number | null>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    
    if (value !== prevValue) {
      const diff = value - prevValue;
      if (Math.abs(diff) > 0.0001 && !isFirstMountRef.current) {
        setBalanceChange({
          amount: Math.abs(diff),
          type: diff > 0 ? 'increase' : 'decrease'
        });

        if (changeTimeoutRef.current) {
          clearTimeout(changeTimeoutRef.current);
        }
        changeTimeoutRef.current = setTimeout(() => {
          setBalanceChange(null);
        }, 4000);
      }

      // Smooth modern duration (1200ms for first mount loading count-up, 800ms otherwise)
      const duration = isFirstMountRef.current ? 1200 : 800;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutExpo formula
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentValue = prevValue + (value - prevValue) * ease;
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
          isFirstMountRef.current = false;
        }
      };

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
      
      prevValueRef.current = value;
    } else {
      setDisplayValue(value);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, [value]);

  if (!isVisible) {
    return (
      <span 
        onClick={onClick}
        className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent font-sans cursor-pointer hover:opacity-80 transition-opacity select-none"
        title="Click to reveal balance"
      >
        •••• SUI
      </span>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-90 select-none transition-all active:scale-[0.99]"
      title="Click to hide balance"
    >
      <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent font-sans">
        {formatSui(displayValue, 3)}
      </span>
      
      <AnimatePresence>
        {balanceChange && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.7, x: 10 }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight font-mono border select-none ${
              balanceChange.type === 'increase'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            <span>{balanceChange.type === 'increase' ? '▲' : '▼'}</span>
            <span>{balanceChange.type === 'increase' ? '+' : '-'}{formatSui(balanceChange.amount, 3)}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

interface QrScannerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (address: string) => void;
  title?: string;
}

function QrScannerOverlay({ isOpen, onClose, onScanSuccess, title = "Scan QR Code" }: QrScannerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanSpeed, setScanSpeed] = useState<'idle' | 'scanning' | 'success'>('idle');

  // Webcam Setup & Real-time decoding
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let localStream: MediaStream | null = null;
    let animFrame: number | null = null;

    async function initWebcam() {
      try {
        setErrorMsg(null);
        setScanSpeed('scanning');
        
        // request permissions and get devices
        const constraints: MediaStreamConstraints = {
          video: activeCameraId ? { deviceId: { exact: activeCameraId } } : { facingMode: 'environment' }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(e => console.log("Video playback delayed:", e));
        }

        // List cameras
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setCameras(videoDevices);
        } catch (e) {
          console.warn("Failed accessing camera list:", e);
        }

        // Processing loop
        const processFrame = () => {
          if (!isMounted) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = Math.min(video.videoWidth, 480);
              canvas.height = Math.min(video.videoHeight, 480);
              
              // Draw scaled video frame onto analysis canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              // Decode using real jsQR parser!
              const code = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: "dontInvert"
              });

              if (code && code.data) {
                const checkedStr = code.data.trim();
                // Match SUI Address signature (hex with optional Ox of right length)
                const addressMatch = checkedStr.match(/(0x)?[0-9a-fA-F]{64}/);
                const resultAddress = addressMatch ? addressMatch[0] : checkedStr;

                if (resultAddress) {
                  setScanSpeed('success');
                  onScanSuccess(resultAddress);
                  isMounted = false;
                  return;
                }
              }
            }
          }
          animFrame = requestAnimationFrame(processFrame);
        };

        animFrame = requestAnimationFrame(processFrame);

      } catch (err: any) {
        console.error("Camera connection failed:", err);
        setHasPermission(false);
        setErrorMsg("Webcam access is restricted or unavailable. Please choose an image containing a SUI Address QR Code below.");
      }
    }

    initWebcam();

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
    };
  }, [isOpen, activeCameraId]);

  // Handle uploaded image fallback scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const iData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const result = jsQR(iData.data, iData.width, iData.height);
          if (result && result.data) {
            setScanSpeed('success');
            onScanSuccess(result.data.trim());
          } else {
            alert("No valid QR Code matrix detected in this image. Please supply a high-contrast QR containing a valid SUI wallet address.");
          }
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#0a0f1d] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">{title}</h3>
              <p className="text-[10px] text-slate-400">Scan webcam streams, upload files, or select demo targets.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Camera stream or Error State */}
        <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-white/5 mb-4 flex flex-col justify-center items-center">
          {hasPermission ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                muted
                playsInline
              />
              {/* Scan box indicator overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-blue-500/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-10 h-10 border-t-4 border-l-4 border-blue-400 absolute top-0 left-0 rounded-tl-md" />
                <div className="w-10 h-10 border-t-4 border-r-4 border-blue-400 absolute top-0 right-0 rounded-tr-md" />
                <div className="w-10 h-10 border-b-4 border-l-4 border-blue-400 absolute bottom-0 left-0 rounded-bl-md" />
                <div className="w-10 h-10 border-b-4 border-r-4 border-blue-400 absolute bottom-0 right-0 rounded-br-md" />
                
                {scanSpeed === 'scanning' && (
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-3">
              <Camera className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{errorMsg || "Connecting to camera feed..."}</p>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && (
          <div className="mb-3 text-left">
            <label className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">Switch Video Ingest</label>
            <select
              value={activeCameraId || ''}
              onChange={(e) => setActiveCameraId(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 rounded-lg p-2 text-[10px] text-slate-300 font-bold focus:outline-none focus:border-blue-500"
            >
              {cameras.map((cam, idx) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Uploader Fallback */}
        <div className="space-y-3.5 text-left border-t border-white/5 pt-3">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="uppercase tracking-wider font-extrabold">File Decryptor</span>
            <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">REAL TIME</span>
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-white/5 transition-all text-center cursor-pointer"
            >
              Upload QR Image File
            </button>
          </div>
        </div>

        {/* Quick Testing SUI addresses selector */}
        <div className="space-y-2 border-t border-white/5 pt-3 mt-3 text-left">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Demo Addresses (Quick-Fill Simulator)</label>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { label: 'Active SUI Payee', address: '0x3f5c8ca28e9301da01dfb0cb901b028dfac90da01fd8' },
              { label: 'PennyOtter Stream Routing', address: '0x8b321ca22e239ffd15b0ca1dfac22da02fd81c88' },
              { label: 'Multisig Custody Vault', address: '0x777dfac22da02fd81c883f5c8ca28e9301da01dfbcba' }
            ].map(item => (
              <button
                key={item.address}
                onClick={() => {
                  setScanSpeed('success');
                  onScanSuccess(item.address);
                }}
                className="w-full text-left bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 px-3 py-1.5 rounded-lg flex justify-between items-center transition-all cursor-pointer text-[10px] text-slate-300"
              >
                <div>
                  <span className="font-extrabold block text-blue-400 leading-tight">{item.label}</span>
                  <span className="font-mono text-[9px] text-slate-500 tracking-tight block">{item.address.slice(0,12)}...{item.address.slice(-10)}</span>
                </div>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide bg-blue-500/10 px-1.5 py-0.5 rounded">Scan</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const currentAccount = useCurrentAccount();

  const { data: suiBalanceData, refetch: refetchSuiBalance } = useSuiClientQuery('getBalance', {
    owner: currentAccount?.address ?? '',
  }, {
    enabled: !!currentAccount?.address,
  });

  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Firebase Authentication context & Cloud syncing ready indicators
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

  // Listen to Google/Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsDbLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsDbLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      showNotification("Verified Google secure vault sync successfully!", "success");
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      showNotification("Google Sign-In failed. Please try again.", "error");
      setIsDbLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsDbLoading(true);
    try {
      await signOut(auth);
      setIsDbLoaded(false);
      showNotification("Disconnected secure cloud vault. Switched to local storage.", "success");
    } catch (err) {
      console.error("Sign-Out failed:", err);
      showNotification("Could not sign out.", "error");
    } finally {
      setIsDbLoading(false);
    }
  };

  // Sync state FROM Firestore on Authentication completion
  useEffect(() => {
    if (!currentUser) return;

    let active = true;

    const loadCloudData = async () => {
      setIsDbLoading(true);
      try {
        const uid = currentUser.uid;

        // 1. User Profile
        const profile = await getUserProfile(uid);
        if (!active) return;

        if (profile) {
          setWallet(prev => ({
            ...prev,
            spendingBalance: profile.spendingBalance,
            flexibleBalance: profile.flexibleBalance,
            accumulatedYieldSui: profile.accumulatedYieldSui,
            spendAndSaveEnabled: profile.spendAndSaveEnabled,
            spendAndSavePercentage: profile.spendAndSavePercentage,
            suiAddress: profile.suiAddress || prev.suiAddress
          }));
          setRoutingRatioPolicy(profile.routingRatioPolicy as any || 'balanced');
          setEmailAlertsEnabled(profile.emailAlertsEnabled);
          setUserEmailAddress(profile.userEmailAddress || 'ayobamioketona@gmail.com');
        } else {
          // Initialize fresh db doc
          await saveUserProfile(uid, {
            suiAddress: wallet.suiAddress,
            spendingBalance: wallet.spendingBalance,
            flexibleBalance: wallet.flexibleBalance,
            accumulatedYieldSui: wallet.accumulatedYieldSui,
            spendAndSaveEnabled: wallet.spendAndSaveEnabled,
            spendAndSavePercentage: wallet.spendAndSavePercentage,
            routingRatioPolicy,
            emailAlertsEnabled,
            userEmailAddress
          });
        }

        // 2. Allocation Rules
        const dbRules = await getAllocationRules(uid);
        if (!active) return;
        if (dbRules && dbRules.length > 0) {
          setRules(dbRules as AllocationRule[]);
        } else {
          for (const rule of rules) {
            await saveAllocationRule(uid, rule);
          }
        }

        // 3. Target Plans
        const dbTargets = await getTargetSavingsPlans(uid);
        if (!active) return;
        if (dbTargets && dbTargets.length > 0) {
          setTargetPlans(dbTargets as TargetSavingsPlan[]);
        } else {
          for (const plan of targetPlans) {
            await saveTargetSavingsPlan(uid, plan);
          }
        }

        // 4. Fixed Deposits
        const dbFixed = await getFixedDepositPlans(uid);
        if (!active) return;
        if (dbFixed && dbFixed.length > 0) {
          setFixedDeposits(dbFixed as FixedDepositPlan[]);
        } else {
          for (const fd of fixedDeposits) {
            await saveFixedDepositPlan(uid, fd);
          }
        }

        // 5. Transactions List
        const dbTxs = await getHistoricalTransactions(uid);
        if (!active) return;
        if (dbTxs && dbTxs.length > 0) {
          setTransactions(dbTxs as HistoricalTransaction[]);
        } else {
          for (const tx of transactions) {
            await saveHistoricalTransaction(uid, tx);
          }
        }

        if (active) {
          setIsDbLoaded(true);
        }
      } catch (err) {
        console.error("Error reading full setup from Firestore:", err);
      } finally {
        if (active) {
          setIsDbLoading(false);
        }
      }
    };

    loadCloudData();

    return () => {
      active = false;
    };
  }, [currentUser]);

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
      const realBalance = suiBalanceData ? parseFloat(suiBalanceData.totalBalance) / 1_000_000_000 : 340.50;
      setWallet(prev => ({
        ...prev,
        suiAddress: currentAccount.address,
        spendingBalance: realBalance,
        connected: true
      }));
    } else {
      setWallet(prev => ({
        ...prev,
        suiAddress: INITIAL_ADDRESS,
        connected: false
      }));
    }
  }, [currentAccount, suiBalanceData]);

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

  const [otterInvestments, setOtterInvestments] = useState<OtterInvestment[]>(() => {
    const saved = localStorage.getItem('sui_wealth_otter_investments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Yield accumulation speed controls
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x is live APY rate for accurate representation
  const [lastTxHash, setLastTxHash] = useState<string>('0xe295cda28e9301da01dfb0cb901b028dfac90da01fd80ccbc920a0129abc1029');
  const [mockSendAddress, setMockSendAddress] = useState('');
  const [mockSendAmount, setMockSendAmount] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // --- SETTINGS VALUES PER USER INTENT ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('sui_wealth_theme') as 'dark' | 'light') || 'dark';
  });

  const [txPassword, setTxPassword] = useState<string>(() => {
    return localStorage.getItem('sui_wealth_tx_password') || '';
  });

  const [oldPasswordChangeInput, setOldPasswordChangeInput] = useState<string>('');
  const [newPasswordChangeInput, setNewPasswordChangeInput] = useState<string>('');
  const [newPasswordSetupInput, setNewPasswordSetupInput] = useState<string>('');

  const [isTxPasswordEnabled, setIsTxPasswordEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sui_wealth_tx_password_enabled') === 'true';
  });

  const [activeNetwork, setActiveNetwork] = useState<'mainnet' | 'testnet' | 'devnet'>(() => {
    return (localStorage.getItem('sui_wealth_network') as any) || 'mainnet';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // States for password execution interceptor
  const [pendingTxAction, setPendingTxAction] = useState<{
    description: string;
    action: () => void;
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('sui_wealth_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_tx_password', txPassword);
  }, [txPassword]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_tx_password_enabled', String(isTxPasswordEnabled));
  }, [isTxPasswordEnabled]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_network', activeNetwork);
  }, [activeNetwork]);

  const executeWithPassword = (description: string, action: () => void) => {
    if (isTxPasswordEnabled && txPassword) {
      setPendingTxAction({ description, action });
      setPasswordInput('');
      setPasswordError('');
    } else {
      action();
    }
  };

  // Active terminal preview steps
  const [currentPtbSteps, setCurrentPtbSteps] = useState<string[]>([]);

  // Simulation Faucet / Peer Payout Trigger Form
  const [currentView, setCurrentView] = useState<'hub' | 'advisor'>('hub');
  const [activeService, setActiveService] = useState<'flexible' | 'fixed' | 'target' | 'rules' | 'advisor' | 'ledger' | 'faucet' | 'transfer' | 'investments'>('flexible');
  const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null);
  const [faucetAmountSim, setFaucetAmountSim] = useState('300');
  const [incomingAlert, setIncomingAlert] = useState<IncomingPaymentAlert | null>(null);
  
  // Custom Add Money States
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('50');

  // Custom QR Code scanner states
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [qrScannerTargetField, setQrScannerTargetField] = useState<'add_money_source' | 'transfer_recipient'>('add_money_source');
  const [customAddMoneySourceAddress, setCustomAddMoneySourceAddress] = useState('');

  const handleQrScanSuccess = (address: string) => {
    if (qrScannerTargetField === 'add_money_source') {
      setCustomAddMoneySourceAddress(address);
      showNotification(`Set Route Source to: ${address.slice(0, 10)}...`, 'success');
    } else {
      setMockSendAddress(address);
      showNotification(`Set Recipient to: ${address.slice(0, 10)}...`, 'success');
    }
    setIsQrScannerActive(false);
  };
  const [addMoneyMode, setAddMoneyMode] = useState<'auto_split' | 'incoming_banner'>('auto_split');
  const [addMoneyStep, setAddMoneyStep] = useState<'idle' | 'handshake' | 'signature' | 'broadcasting' | 'complete'>('idle');
  const [bypassed, setBypassed] = useState<boolean>(() => {
    const saved = localStorage.getItem('penny_otter_wallet_bypassed');
    return saved === 'true';
  });
  const [manualAllocationActive, setManualAllocationActive] = useState(false);
  const [tempManualRules, setTempManualRules] = useState<AllocationRule[]>([]);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('sui_wealth_balance_visible');
    return saved !== 'false';
  });

  // Email Alert Integration and Simulation State
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('penny_otter_email_alerts_enabled');
    return saved === 'true';
  });

  const [userEmailAddress, setUserEmailAddress] = useState<string>(() => {
    return localStorage.getItem('penny_otter_email_address') || 'ayobamioketona@gmail.com';
  });

  const [showEmailAlertMockToast, setShowEmailAlertMockToast] = useState<boolean>(false);
  const [emailMockDetails, setEmailMockDetails] = useState<{
    to: string;
    subject: string;
    body: string;
    amount: number;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('penny_otter_email_alerts_enabled', String(emailAlertsEnabled));
    if (isDbLoaded && currentUser) {
      saveUserProfile(currentUser.uid, {
        suiAddress: wallet.suiAddress,
        spendingBalance: wallet.spendingBalance,
        flexibleBalance: wallet.flexibleBalance,
        accumulatedYieldSui: wallet.accumulatedYieldSui,
        spendAndSaveEnabled: wallet.spendAndSaveEnabled,
        spendAndSavePercentage: wallet.spendAndSavePercentage,
        routingRatioPolicy,
        emailAlertsEnabled,
        userEmailAddress
      }).catch(err => console.error(err));
    }
  }, [emailAlertsEnabled, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('penny_otter_email_address', userEmailAddress);
    if (isDbLoaded && currentUser) {
      saveUserProfile(currentUser.uid, {
        suiAddress: wallet.suiAddress,
        spendingBalance: wallet.spendingBalance,
        flexibleBalance: wallet.flexibleBalance,
        accumulatedYieldSui: wallet.accumulatedYieldSui,
        spendAndSaveEnabled: wallet.spendAndSaveEnabled,
        spendAndSavePercentage: wallet.spendAndSavePercentage,
        routingRatioPolicy,
        emailAlertsEnabled,
        userEmailAddress
      }).catch(err => console.error(err));
    }
  }, [userEmailAddress, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('penny_otter_wallet_bypassed', String(bypassed));
  }, [bypassed]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_balance_visible', String(isBalanceVisible));
  }, [isBalanceVisible]);

  // Local storage & Cloud database syncing
  useEffect(() => {
    localStorage.setItem('sui_wealth_wallet', JSON.stringify(wallet));
    if (isDbLoaded && currentUser) {
      saveUserProfile(currentUser.uid, {
        suiAddress: wallet.suiAddress,
        spendingBalance: wallet.spendingBalance,
        flexibleBalance: wallet.flexibleBalance,
        accumulatedYieldSui: wallet.accumulatedYieldSui,
        spendAndSaveEnabled: wallet.spendAndSaveEnabled,
        spendAndSavePercentage: wallet.spendAndSavePercentage,
        routingRatioPolicy,
        emailAlertsEnabled,
        userEmailAddress
      }).catch(err => console.error(err));
    }
  }, [wallet, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_rules', JSON.stringify(rules));
    if (isDbLoaded && currentUser) {
      const syncRules = async () => {
        const dbRules = await getAllocationRules(currentUser.uid);
        const currentIds = new Set(rules.map(r => r.id));
        for (const dbRule of dbRules) {
          if (!currentIds.has(dbRule.id)) {
            await deleteAllocationRule(currentUser.uid, dbRule.id);
          }
        }
        for (const rule of rules) {
          await saveAllocationRule(currentUser.uid, rule);
        }
      };
      syncRules().catch(err => console.error(err));
    }
  }, [rules, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_targets', JSON.stringify(targetPlans));
    if (isDbLoaded && currentUser) {
      const syncTargets = async () => {
        const dbTargets = await getTargetSavingsPlans(currentUser.uid);
        const currentIds = new Set(targetPlans.map(tp => tp.id));
        for (const dbTarget of dbTargets) {
          if (!currentIds.has(dbTarget.id)) {
            await deleteTargetSavingsPlan(currentUser.uid, dbTarget.id);
          }
        }
        for (const plan of targetPlans) {
          await saveTargetSavingsPlan(currentUser.uid, plan);
        }
      };
      syncTargets().catch(err => console.error(err));
    }
  }, [targetPlans, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_fixed', JSON.stringify(fixedDeposits));
    if (isDbLoaded && currentUser) {
      const syncFixed = async () => {
        const dbFixed = await getFixedDepositPlans(currentUser.uid);
        const currentIds = new Set(fixedDeposits.map(fd => fd.id));
        for (const dbFd of dbFixed) {
          if (!currentIds.has(dbFd.id)) {
            await deleteFixedDepositPlan(currentUser.uid, dbFd.id);
          }
        }
        for (const fd of fixedDeposits) {
          await saveFixedDepositPlan(currentUser.uid, fd);
        }
      };
      syncFixed().catch(err => console.error(err));
    }
  }, [fixedDeposits, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_txs', JSON.stringify(transactions));
    if (isDbLoaded && currentUser) {
      for (const tx of transactions) {
        saveHistoricalTransaction(currentUser.uid, tx).catch(err => console.error(err));
      }
    }
  }, [transactions, isDbLoaded, currentUser]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_otter_investments', JSON.stringify(otterInvestments));
  }, [otterInvestments]);

  useEffect(() => {
    localStorage.setItem('sui_wealth_policy', routingRatioPolicy);
    if (isDbLoaded && currentUser) {
      saveUserProfile(currentUser.uid, {
        suiAddress: wallet.suiAddress,
        spendingBalance: wallet.spendingBalance,
        flexibleBalance: wallet.flexibleBalance,
        accumulatedYieldSui: wallet.accumulatedYieldSui,
        spendAndSaveEnabled: wallet.spendAndSaveEnabled,
        spendAndSavePercentage: wallet.spendAndSavePercentage,
        routingRatioPolicy,
        emailAlertsEnabled,
        userEmailAddress
      }).catch(err => console.error(err));
    }
  }, [routingRatioPolicy, isDbLoaded, currentUser]);

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
          // oWealth yields 0.001% weekly APY per user instruction
          // R_second = 0.00001 / (7 * 24 * 3600)
          const interestRatePerSecond = 0.00001 / (7 * 24 * 3600);
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

        // 3. Tick Active Otter Autopilot Investments
        let totalRefundAmount = 0;
        let totalRefundProfit = 0;
        const maturedList: OtterInvestment[] = [];

        setOtterInvestments(prev => {
          if (prev.length === 0 || !prev.some(inv => inv.status === 'active')) return prev;
          return prev.map(inv => {
            if (inv.status === 'active') {
              const interestRatePerSecond = (inv.apy / 100) / (365 * 24 * 3600);
              const earned = inv.amountSui * interestRatePerSecond * effectiveDelta;
              const remaining = inv.timeRemainingSec - effectiveDelta;

              if (remaining <= 0) {
                const finalProfit = inv.profitMade + earned;
                totalRefundAmount += inv.amountSui;
                totalRefundProfit += finalProfit;
                const updated = {
                  ...inv,
                  profitMade: finalProfit,
                  timeRemainingSec: 0,
                  status: 'completed' as const
                };
                maturedList.push(updated);
                return updated;
              } else {
                return {
                  ...inv,
                  profitMade: inv.profitMade + earned,
                  timeRemainingSec: remaining
                };
              }
            }
            return inv;
          });
        });

        if (totalRefundAmount > 0) {
          setWallet(prev => ({
            ...prev,
            flexibleBalance: prev.flexibleBalance + totalRefundAmount + totalRefundProfit,
            accumulatedYieldSui: prev.accumulatedYieldSui + totalRefundProfit
          }));

          maturedList.forEach(inv => {
            showNotification(`🦦 Autopilot triggered! Otter successfully redeemed ${inv.amountSui.toFixed(1)} SUI from ${inv.protocol} (+${inv.profitMade.toFixed(4)} SUI gain) back to oWealth Flexible Yield as matured!`, 'success');

            // Log transition
            const hash = generateMockTxHash();
            const newTx: HistoricalTransaction = {
              id: Math.random().toString(),
              txHash: hash,
              type: 'withdraw_flexible',
              amountSui: inv.amountSui + inv.profitMade,
              timestamp: new Date().toISOString(),
              description: `Otter Autopilot successfully evacuated collateral from ${inv.protocol}. Deposited ${inv.amountSui.toFixed(1)} SUI capital + ${inv.profitMade.toFixed(4)} SUI earnings back to oWealth Flexible savings.`,
              ptbCommandCount: 3,
              ptbSteps: [
                '// Otter Autopilot Automated Redemption Block',
                `tx.moveCall({ target: "0x2::otter_investment::exit_protocol", arguments: [tx.pure.u64(${Math.floor(inv.amountSui * 1e9)})] });`,
                `tx.moveCall({ target: "0x2::suiwealth::deposit_flexible", arguments: [] });`
              ],
              status: 'success'
            };
            setTransactions(prevTxs => [newTx, ...prevTxs]);
          });
        }
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

  const handleTriggerAddMoney = async () => {
    const amt = parseFloat(addMoneyAmount);
    if (isNaN(amt) || amt <= 0) {
      showNotification('Please choose or enter a valid SUI amount.', 'error');
      return;
    }

    if (currentAccount?.address) {
      // 1. REAL ON-CHAIN TRANSACTION WITH CONNECTED SUI WALLET
      try {
        setAddMoneyStep('handshake');
        
        // Construct the transaction block
        const tx = new Transaction();
        tx.setSender(currentAccount.address);
        
        // Split amount SUI from current account balance
        const amountInMist = BigInt(Math.floor(amt * 1_000_000_000));
        const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
        
        // Self transfer to keep funds safe while proving a real transaction sign of the choice amount
        tx.transferObjects([coin], currentAccount.address);
        
        setAddMoneyStep('signature');
        
        // Sign and execute via connected wallet
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });
        
        setAddMoneyStep('broadcasting');
        
        const txDigest = result.digest;
        
        setAddMoneyStep('complete');
        
        // Trigger split or payment alert banner on PennyOtter
        setTimeout(async () => {
          if (addMoneyMode === 'auto_split') {
            executePtbSplitWithRules(rules, amt, true);
          } else {
            setIncomingAlert({
              id: Math.random().toString(),
              senderAddress: currentAccount.address,
              amountSui: amt,
              timestamp: new Date().toISOString(),
              title: 'Incoming PennyOtter PayStream Payment',
              message: `${formatSui(amt)} received. Re-route or split dynamically?`,
              isPending: true,
            });
            showNotification(`Sui Wallet collected ${formatSui(amt)} SUI and broadcasted inflow banner to PennyOtter!`, 'success');
          }
          
          // Refetch real on-chain balance to keep app synchronized
          try {
            await refetchSuiBalance();
          } catch(e) {
            console.error("Refetch sui balance err:", e);
          }

          // Create the transaction block item for transaction history
          const newTx: HistoricalTransaction = {
            id: Math.random().toString(),
            txHash: txDigest,
            type: 'programmable_allocation',
            amountSui: amt,
            timestamp: new Date().toISOString(),
            description: `On-Chain SUI payment settled via Slush Wallet. Collected and distributed +${formatSui(amt)} SUI.`,
            ptbCommandCount: 3,
            ptbSteps: [
              '// On-chain Slush Ledger Settlement',
              `tx.setSender(${currentAccount.address});`,
              `let [split_coin] = tx.splitCoins(tx.gas, [${amountInMist}]);`,
              `tx.transferObjects([split_coin], ${currentAccount.address});`
            ],
            status: 'success'
          };
          setTransactions(prev => [newTx, ...prev]);

          setIsAddMoneyOpen(false);
          setAddMoneyStep('idle');
        }, 1000);

      } catch (error: any) {
        console.error("Transaction failed:", error);
        showNotification(error?.message || 'Transaction signing rejected or failed on Slush.', 'error');
        setAddMoneyStep('idle');
      }
    } else {
      // 2. SANDBOX MODE (If wallet not connected)
      setAddMoneyStep('handshake');
      
      setTimeout(() => {
        setAddMoneyStep('signature');
        setTimeout(() => {
          setAddMoneyStep('broadcasting');
          setTimeout(() => {
            setAddMoneyStep('complete');
            setTimeout(() => {
              const finalSender = customAddMoneySourceAddress || '0x8b321ca22e239ffd15b0ca1dfac22da02fd81c88';
              if (addMoneyMode === 'auto_split') {
                executePtbSplitWithRules(rules, amt, true);
              } else {
                setIncomingAlert({
                  id: Math.random().toString(),
                  senderAddress: finalSender,
                  amountSui: amt,
                  timestamp: new Date().toISOString(),
                  title: 'Incoming PennyOtter PayStream Payment',
                  message: `${formatSui(amt)} received. Re-route or split dynamically?`,
                  isPending: true,
                });
                showNotification(`Sui Wallet collected ${formatSui(amt)} SUI and broadcasted inflow banner to PennyOtter!`, 'success');
              }
              
              // Add transaction to history
              const hash = generateMockTxHash();
              const newTx: HistoricalTransaction = {
                id: Math.random().toString(),
                txHash: hash,
                type: 'programmable_allocation',
                amountSui: amt,
                timestamp: new Date().toISOString(),
                description: `Sandbox SUI payment settled via Slush Wallet. Collected and distributed +${formatSui(amt)} SUI.`,
                ptbCommandCount: 3,
                ptbSteps: [
                  '// Sandbox Slush Mock Transaction Block',
                  `tx.setSender(${finalSender});`,
                  `let [split_coin] = tx.splitCoins(tx.gas, [${BigInt(Math.floor(amt * 1_000_000_000))}]);`,
                  `tx.transferObjects([split_coin], ${finalSender});`
                ],
                status: 'success'
              };
              setTransactions(prev => [newTx, ...prev]);

              setIsAddMoneyOpen(false);
              setAddMoneyStep('idle');
            }, 800);
          }, 1000);
        }, 800);
      }, 700);
    }
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

    executeWithPassword(`Confirm Transfer of ${formatSui(amt)} SUI`, () => {
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
    });
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
      title: 'Incoming PennyOtter PayStream Payment',
      message: `${formatSui(amt)} received. Re-route or split dynamically?`,
      isPending: true,
    });
  };

  const executePtbSplitWithRules = (activeRules: AllocationRule[], customAmount: number, skipAlertCheck = false) => {
    if (!skipAlertCheck && !incomingAlert) return;

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

    // Trigger Simulated Email Alerts
    if (emailAlertsEnabled) {
      const activeRulesLabels = activeRules
        .filter(r => r.isActive)
        .map(r => {
          const share = customAmount * (r.percentage / 100);
          return `• ${r.name}: ${share.toFixed(2)} SUI (${r.percentage}%) routed directly into ${
            r.destination === 'spending' ? 'Liquid Spending Balance' :
            r.destination === 'flexible' ? 'oWealth Flexible Interest Vault' :
            r.destination === 'target' ? 'Stated Savings Target' : 'Fixed Savings Term'
          }`;
        })
        .join('\n');

      setEmailMockDetails({
        to: userEmailAddress || 'ayobamioketona@gmail.com',
        subject: `PennyOtter Automated split compiled successfully | Received: +${customAmount.toFixed(1)} SUI`,
        body: `Hi there!\n\nA fresh incoming PayStream of +${customAmount.toFixed(2)} SUI has been processed through your customized routing rules.\n\n` +
          `PTB TX Block Signed: ${hash.slice(0, 16)}...${hash.slice(-12)}\n` +
          `Timestamp: ${new Date().toLocaleString()}\n\n` +
          `Distribution Logs:\n${activeRulesLabels}\n\n` +
          `Your assets are generating continuous sandbox interest compound curves. Open PennyOtter to claim or view.`,
        amount: customAmount,
        timestamp: new Date().toLocaleTimeString(),
      });
      setShowEmailAlertMockToast(true);
    }
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

    let defaultApy = 0.6;
    if (durationDays === 30) defaultApy = 0.5;
    if (durationDays === 180) defaultApy = 0.65;
    if (durationDays === 360) defaultApy = 0.7;

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
        apy: 0.6, // 0.60% APY
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

  const handleOtterDeployInvestment = (protocol: string, amountSui: number, apy: number, durationSec: number, rationale: string) => {
    if (amountSui > wallet.flexibleBalance) {
      showNotification(`Insufficient oWealth Flexible Balance. You only have ${wallet.flexibleBalance.toFixed(2)} SUI, but requested ${amountSui.toFixed(2)} SUI.`, 'error');
      return;
    }

    // Deduct from flexibleBalance
    setWallet(prev => ({
      ...prev,
      flexibleBalance: prev.flexibleBalance - amountSui
    }));

    // Add to otterInvestments
    const newInv: OtterInvestment = {
      id: 'otter_' + Math.random().toString().slice(2, 6),
      protocol,
      amountSui,
      apy,
      profitMade: 0,
      timeRemainingSec: durationSec,
      totalDurationSec: durationSec,
      status: 'active',
      description: rationale,
      createdAt: new Date().toISOString()
    };
    
    setOtterInvestments(prev => [newInv, ...prev]);

    // Create historical transaction
    const hash = generateMockTxHash();
    const newTx: HistoricalTransaction = {
      id: Math.random().toString(),
      txHash: hash,
      type: 'programmable_allocation',
      amountSui: amountSui,
      timestamp: new Date().toISOString(),
      description: `Otter Autopilot deployed ${amountSui.toFixed(1)} SUI into ${protocol} at ${apy.toFixed(2)}% APY. Autopilot set to redeem in ${(durationSec / 60).toFixed(0)} mins.`,
      ptbCommandCount: 4,
      ptbSteps: [
        '// Otter Autopilot Investment Deploy Block',
        `tx.setSender(${wallet.suiAddress});`,
        `let [withdraw_coin] = tx.moveCall({ target: "0x2::oWealth::withdraw_flex", arguments: [tx.pure.u64(${Math.floor(amountSui * 1e9)})] });`,
        `tx.moveCall({ target: "0x2::otter_investment::enter_protocol", arguments: [tx.pure("${protocol}"), withdraw_coin, tx.pure.u64(${durationSec})] });`
      ],
      status: 'success'
    };

    setTransactions(prev => [newTx, ...prev]);
    showNotification(`Otter Autopilot: Deployed ${amountSui.toFixed(1)} SUI into ${protocol}!`, 'success');
    
    // Switch active view and active service to investments
    setCurrentView('hub');
    setActiveService('investments');
  };

  const handleTerminateInvestment = (investmentId: string) => {
    const inv = otterInvestments.find(i => i.id === investmentId);
    if (!inv || inv.status !== 'active') {
      showNotification("Investment position is either completed or already closed.", "error");
      return;
    }

    executeWithPassword(`Terminate Autopilot Investment on ${inv.protocol}`, () => {
      // Refund principal + accrued profit back to flexible saving
      const refundAmount = inv.amountSui;
      const profit = inv.profitMade;
      const totalRefund = refundAmount + profit;

      setWallet(prev => ({
        ...prev,
        flexibleBalance: prev.flexibleBalance + totalRefund,
        accumulatedYieldSui: prev.accumulatedYieldSui + profit
      }));

      // Update investment status to completed
      setOtterInvestments(prev => prev.map(item => {
        if (item.id === investmentId) {
          return {
            ...item,
            status: 'completed' as const,
            timeRemainingSec: 0,
            description: `${item.description} (Terminated Early by User)`
          };
        }
        return item;
      }));

      // Create historical log transaction
      const hash = generateMockTxHash();
      const newTx: HistoricalTransaction = {
        id: Math.random().toString(),
        txHash: hash,
        type: 'withdraw_flexible',
        amountSui: totalRefund,
        timestamp: new Date().toISOString(),
        description: `Early termination: Evacuated ${refundAmount.toFixed(1)} SUI + ${profit.toFixed(4)} SUI accrued interest from ${inv.protocol} back to oWealth Flexible Savings.`,
        ptbCommandCount: 3,
        ptbSteps: [
          '// Early Force Autopilot Evacuation',
          `tx.moveCall({ target: "0x2::otter_investment::force_exit", arguments: [tx.pure.u64(${Math.floor(refundAmount * 1e9)})] });`,
          `tx.moveCall({ target: "0x2::suiwealth::deposit_flexible", arguments: [] });`
        ],
        status: 'success'
      };

      setTransactions(prev => [newTx, ...prev]);
      showNotification(`Investment on ${inv.protocol} terminated successfully. Refunded ${totalRefund.toFixed(4)} SUI.`, 'success');
    });
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
    <div className={`${theme === 'light' ? 'light text-slate-900 bg-[#f8fafc]' : 'text-slate-100 bg-[#050506]'} min-h-screen selection:bg-blue-500/30 selection:text-white font-sans antialiased relative overflow-hidden transition-colors duration-300`}>
      
      {/* Background Ambient Radial Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[-15%] w-[65%] h-[65%] bg-blue-500/5 rounded-full blur-[150px] animate-glow-slow" />
        <div className="absolute bottom-[10%] right-[-10%] w-[55%] h-[55%] bg-indigo-500/4 rounded-full blur-[160px] animate-glow-slower" />
        <div className="absolute top-[35%] left-[25%] w-[45%] h-[45%] bg-sky-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Modern thin neon mesh layout line overlay */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />

      {/* 1. TOP HEADER & TELEMETRY NAV BAR */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-md">
              <Coins className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight tracking-tight text-white font-sans">
                PennyOtter
              </h1>
            </div>
          </div>



          <div className="flex items-center gap-3">
            {/* Preference & Network Status Pill */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 font-mono text-[9px] font-bold text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${activeNetwork === 'mainnet' ? 'bg-emerald-500' : activeNetwork === 'testnet' ? 'bg-blue-500 animate-pulse' : 'bg-purple-500'}`} />
              <span className="uppercase">{activeNetwork}</span>
            </div>

            {/* General App Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-slate-400 hover:text-white hover:bg-zinc-900 duration-200 transition-all text-xs font-sans font-bold flex items-center justify-center cursor-pointer shrink-0"
              title="PennyOtter Preferences & Security Settings"
            >
              <Settings className="w-4 h-4 text-slate-350 hover:rotate-45 transition-transform" />
            </button>

            {/* Address connection bar */}
            <div id="suidappkit-connect-component" className="text-xs flex items-center gap-2">
              {bypassed && !currentAccount?.address && (
                <button
                  id="btn-disconnect-bypass"
                  onClick={() => setBypassed(false)}
                  className="bg-amber-950/20 text-amber-400 border border-amber-900/40 font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-amber-950/40 hover:text-white transition-all cursor-pointer border-solid"
                >
                  Sandbox Guest Active (Show Landing)
                </button>
              )}
              <ConnectButton 
                connectText="Connect SUI Wallet"
                className="!bg-blue-600 hover:!bg-blue-500 !text-white !font-bold !text-xs !py-1.5 !px-3.5 !rounded-lg !border-none !shadow-sm transition-all active:scale-95 cursor-pointer !font-sans" 
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {(!currentAccount?.address && !bypassed) ? (
          <LandingPage onBypass={() => setBypassed(true)} />
        ) : (
          <>
            {/* 1. DARK GLASSY WALLET MASTER PANEL (Inspired by user image with dark glass option) */}
            <div className="glass-panel text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left max-w-4xl mx-auto">
              {/* Decorative grid pattern & halos in alignment with the style sheet */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30" />
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-6">
                <div>
                  <span className="text-[10px] sm:text-xs text-emerald-400 font-sans font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Consolidated Net Assets
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-sans flex items-baseline gap-1.5 min-h-[44px]">
                    <AnimatedSuiBalance value={totalBalanceSui} isVisible={isBalanceVisible} onClick={() => setIsBalanceVisible(!isBalanceVisible)} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                    className="flex items-center gap-1.5 text-[9px] sm:text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer backdrop-blur-md"
                  >
                    {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{isBalanceVisible ? "Hide" : "Show"}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentView('advisor');
                      setActiveService('advisor');
                    }}
                    className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* Balances list */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 border-t border-white/5 pt-4 mb-6 text-[11px] sm:text-xs text-slate-300 relative z-10 font-sans">
                <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.04] select-none transition-colors" onClick={() => setIsBalanceVisible(!isBalanceVisible)} title="Click to toggle balance visibility">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block col-span-1">Spending Cash</span>
                  <span className="font-extrabold font-mono text-xs sm:text-sm mt-0.5 block text-white">{isBalanceVisible ? formatSui(wallet.spendingBalance, 1) : '••••'}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.04] select-none transition-colors" onClick={() => setIsBalanceVisible(!isBalanceVisible)} title="Click to toggle balance visibility">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block font-sans col-span-1">oWealth Flexible</span>
                  <span className="font-extrabold font-mono text-xs sm:text-sm mt-0.5 block text-emerald-400">{isBalanceVisible ? formatSui(wallet.flexibleBalance, 1) : '••••'}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.04] select-none transition-colors" onClick={() => setIsBalanceVisible(!isBalanceVisible)} title="Click to toggle balance visibility">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block col-span-1">Vaulted/Fixed</span>
                  <span className="font-extrabold font-mono text-xs sm:text-sm mt-0.5 block text-blue-400">{isBalanceVisible ? formatSui(totalLockedFixed + totalLockedTarget, 1) : '••••'}</span>
                </div>
              </div>

              {/* 3 Action Square buttons like the image */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    setIsAddMoneyOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent animate-fade-in"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-hover:bg-white/10 active:scale-95">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-400 stroke-[2px]" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white font-sans mt-0.5 transition-colors">Fund account</span>
                </button>

                <button
                  onClick={() => {
                    setActiveService('ledger');
                    setCurrentView('hub');
                    setIsServiceModalOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent animate-fade-in"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-hover:bg-white/10 active:scale-95">
                    <History className="w-5 h-5 text-emerald-400 stroke-[2px]" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white font-sans mt-0.5 transition-colors">Transaction</span>
                </button>

                <button
                  onClick={() => {
                    setActiveService('transfer');
                    setCurrentView('hub');
                    setIsServiceModalOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent animate-fade-in"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-hover:bg-white/10 active:scale-95">
                    <ArrowUpRight className="w-6 h-6 text-emerald-400 stroke-[2.5px]" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white font-sans mt-0.5 transition-colors">Withdrawal</span>
                </button>
              </div>
            </div>

            {/* 2. PAYMENT CATEGORY GRID (Inspired by user image) */}
            <div className="glass-panel p-5 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden max-w-4xl mx-auto text-left">
              <h3 className="text-white font-bold text-xs font-sans uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Payments & Yield Services
              </h3>
              
              <div className="grid grid-cols-4 gap-y-5 gap-x-2 sm:gap-x-4">
                {CATEGORIES_CONFIG.map((cat) => {
                  const isActive = activeService === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveService(cat.id as any);
                        if (cat.id === 'advisor') {
                          setCurrentView('advisor');
                        } else {
                          setCurrentView('hub');
                        }
                        setIsServiceModalOpen(true);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none border-none bg-transparent"
                    >
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        isActive 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105 border border-emerald-400' 
                          : 'border border-white/5 bg-white/[0.02] text-slate-300 hover:text-white hover:bg-white/[0.05] hover:scale-105'
                      }`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5px]' : 'group-hover:rotate-6 transition-transform text-slate-300'}`} />
                        {cat.badge && (
                          <span className="absolute -top-1 -right-1.5 bg-amber-500 text-[8px] font-black text-slate-950 px-1.5 py-0.5 rounded-full animate-pulse tracking-tight border border-[#0d1527]">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] sm:text-[11px] text-center font-bold tracking-tight transition-colors whitespace-nowrap ${
                        isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. REAL-TIME BLOCKCHAIN POPUP / INCOMING ALERTS */}
            <AnimatePresence>
              {incomingAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  id="incoming-stream-toast-panel"
                  className="bg-gradient-to-br from-[#0b1325] to-[#060a14] border-2 border-blue-500/80 rounded-3xl p-6 shadow-[0_12px_40px_rgba(37,99,235,0.15)] relative overflow-hidden text-left max-w-4xl mx-auto"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={() => setIncomingAlert(null)}
                      className="text-slate-300 hover:text-white text-xs font-bold bg-[#111c34] border border-[#22365e] px-2.5 py-1 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-start gap-4 flex-col md:flex-row relative z-10">
                    <div className="p-3 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded-2xl flex-shrink-0">
                      <ArrowDownLeft className="w-6 h-6" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-950/60 border border-blue-800 text-blue-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded animate-pulse">
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

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
                    <button
                      type="button"
                      id="btn-use-default-router"
                      onClick={() => executePtbSplitWithRules(rules, incomingAlert.amountSui)}
                      className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl text-xs font-sans hover:bg-blue-500 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Use Default Allocation Rules (1-Tap PTB Split)</span>
                    </button>

                    <button
                      type="button"
                      id="btn-trigger-manual-adjust"
                      onClick={triggerManualAdjustAlert}
                      className="flex-1 bg-[#0c1428] hover:bg-[#121c38] text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs font-sans border border-[#22355c] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Manually Adjust Percentages First</span>
                    </button>
                  </div>

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
                                className="w-full h-1 cursor-pointer accent-blue-500 bg-[#121d36] rounded-lg border-none"
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
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all border-none cursor-pointer"
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

               {/* 4. ACTIVE WORKBENCH WORKSPACE VIEW - NOW RENDERED AS A RESPONSIVE POPUP MODAL */}
            <AnimatePresence>
              {isServiceModalOpen && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
                  id="unified-feature-modal-overlay"
                >
                  {/* Backdrop click to close */}
                  <div 
                    className="absolute inset-0 cursor-default" 
                    onClick={() => setIsServiceModalOpen(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ type: "spring", duration: 0.35, ease: "easeOut" }}
                    className="w-full max-w-4xl max-h-[88vh] bg-zinc-950/95 border border-[#1e2e4e]/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative z-10 backdrop-blur-2xl flex flex-col focus:outline-none text-slate-100 overflow-hidden"
                  >
                    {/* Glowing highlight accents inside modal */}
                    <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Modal head control rail */}
                    <div className="flex justify-between items-center pb-3.5 mb-4 border-b border-white/5 relative z-10 shrink-0">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans font-extrabold uppercase tracking-widest block">
                            Portfolio Console
                          </span>
                          <span className="text-xs sm:text-sm text-white font-extrabold tracking-tight font-sans block mt-0.5">
                            {currentView === 'advisor' ? "SUIWealth Copilot Strategy" : `${CATEGORIES_CONFIG.find(c => c.id === activeService)?.label ?? 'Active Portal'}`}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setIsServiceModalOpen(false)}
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/10 bg-transparent cursor-pointer flex items-center justify-center outline-none"
                        aria-label="Close portal modal"
                      >
                        <X className="w-4 h-4 font-bold" />
                      </button>
                    </div>

                    {/* Scrollable content canvas - responsive size constraints */}
                    <div className="overflow-y-auto flex-1 pr-1.5 text-left relative z-10 text-slate-100">
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
                          onBack={() => {
                            setIsServiceModalOpen(false);
                          }}
                          onInvest={handleOtterDeployInvestment}
                        />
                      ) : (
                        <>
                          {activeService === 'flexible' && (
                            <FlexibleSavings
                              flexibleBalance={wallet.flexibleBalance}
                              accumulatedYieldSui={wallet.accumulatedYieldSui}
                              spendingBalance={wallet.spendingBalance}
                              onDeposit={handleDepositToFlexible}
                              onWithdraw={handleWithdrawFromFlexible}
                            />
                          )}

                          {activeService === 'fixed' && (
                            <FixedDeposits
                              plans={fixedDeposits}
                              onAddFixedDeposit={handleAddFixedDeposit}
                              onWithdrawFixedDeposit={handleWithdrawFixedDeposit}
                              onTopUpFixedDeposit={handleTopUpFixedDeposit}
                              spendingBalance={wallet.spendingBalance}
                            />
                          )}

                          {activeService === 'target' && (
                            <TargetSavings
                              plans={targetPlans}
                              onAddPlan={handleAddTargetPlan}
                              onDepositToPlan={handleDepositToTargetPlan}
                              onWithdrawPlan={handleWithdrawTargetPlan}
                              spendingBalance={wallet.spendingBalance}
                            />
                          )}

                          {activeService === 'rules' && (
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
                          )}

                          {activeService === 'investments' && (
                            <div className="space-y-6">
                              {/* Headers layout */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-3">
                                <div>
                                  <h2 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 font-mono">
                                    <Briefcase className="w-5 h-5 text-emerald-400" />
                                    <span>Otter Autopilot Investments</span>
                                  </h2>
                                  <p className="text-xs text-slate-400 font-sans">
                                    Track real-time yields and smart autopilot positions managed by Otter SUI AI
                                  </p>
                                </div>
                                <div className="text-[10px] uppercase font-bold font-mono tracking-wider bg-emerald-955/40 text-emerald-400 border border-emerald-900/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                                  <Bot className="w-3.5 h-3.5" />
                                  <span>Otter Copilot Active</span>
                                </div>
                              </div>

                              {otterInvestments.length === 0 ? (
                                <div className="glass-panel border-dashed p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
                                  <div className="bg-emerald-950/40 p-4 rounded-full border border-emerald-900/30 mb-4 text-emerald-450">
                                    <Briefcase className="w-8 h-8 text-emerald-400" />
                                  </div>
                                  <h3 className="text-white font-bold text-sm font-sans">No Active Deployments</h3>
                                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 font-sans">
                                    You don't have any active autopilot investments. Instruct Otter AI to search and deploy SUI tokens from your Flexible Yield balance now!
                                  </p>
                                  <button
                                    onClick={() => {
                                      setCurrentView('advisor');
                                      setActiveService('advisor');
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer border-none font-sans"
                                  >
                                    Ask Otter AI to Deploy Yield
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {/* Active Investments */}
                                  <div className="space-y-3 text-left">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                                      Active Autopilot Positions
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                      {otterInvestments.filter(i => i.status === 'active').length === 0 ? (
                                        <p className="text-[11px] text-slate-400 pl-1 p-4 bg-zinc-900/20 rounded-xl italic font-sans border border-zinc-805">
                                          No active positions. All investments processed by Otter AI have matured.
                                        </p>
                                      ) : (
                                        otterInvestments.filter(i => i.status === 'active').map((inv) => {
                                          const pctElapsed = ((inv.totalDurationSec - inv.timeRemainingSec) / inv.totalDurationSec) * 100;
                                          const isExpanded = expandedInvestmentId === inv.id;
                                          return (
                                            <div 
                                              key={inv.id}
                                              className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-emerald-500/30 shadow-lg shadow-emerald-950/10' : 'hover:border-zinc-800'}`}
                                            >
                                              <div 
                                                onClick={() => setExpandedInvestmentId(isExpanded ? null : inv.id)}
                                                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                                              >
                                                {/* Details */}
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">{inv.protocol}</span>
                                                    <span className="text-[9px] bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-md">
                                                      {inv.apy.toFixed(2)}% APY
                                                    </span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-sans">
                                                    <Info className="w-3.5 h-3.5 text-emerald-400/85" />
                                                    <span>Click to toggle protocol rationale and auto-redemption logs</span>
                                                  </p>
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex items-center gap-6 font-mono self-stretch sm:self-auto justify-between sm:justify-start">
                                                  <div className="text-left w-24">
                                                    <span className="text-[9px] text-slate-500 block font-bold">PRINCIPAL:</span>
                                                    <span className="text-white text-xs font-extrabold">{inv.amountSui.toFixed(1)} SUI</span>
                                                  </div>

                                                  <div className="text-left w-28">
                                                    <span className="text-[9px] text-slate-500 block font-bold">YIELD ACCRUED:</span>
                                                    <span className="text-emerald-400 text-xs font-black animate-pulse flex items-center gap-0.5">
                                                      +{inv.profitMade.toFixed(4)} <span className="text-[8px] text-slate-300">SUI</span>
                                                    </span>
                                                  </div>

                                                  <div className="text-right w-24">
                                                    <span className="text-[9px] text-slate-500 block font-bold">AUTO-EXIT:</span>
                                                    <span className="text-blue-300 text-xs font-black flex items-center gap-1 justify-end">
                                                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                      <span>{inv.timeRemainingSec.toFixed(0)}s</span>
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Elapsed Time indicator */}
                                              <div className="h-1 bg-zinc-900 w-full relative">
                                                <div 
                                                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                                                  style={{ width: `${Math.min(100, Math.max(0, pctElapsed))}%` }}
                                                />
                                              </div>

                                              {/* Expanded Details container */}
                                              <AnimatePresence>
                                                {isExpanded && (
                                                  <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="border-t border-white/5 bg-zinc-950/50"
                                                  >
                                                    <div className="p-5 space-y-4 text-xs text-left">
                                                      <div className="space-y-1 block">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-550 font-mono">Otter Investment Analysis & Rationale</span>
                                                        <p className="text-slate-300 leading-relaxed font-sans">{inv.description}</p>
                                                      </div>

                                                      <div className="p-3.5 bg-black/60 border border-zinc-900 rounded-xl space-y-2 font-mono text-[10px] text-slate-400">
                                                        <div className="flex justify-between flex-wrap gap-1">
                                                          <span>Smart Autopilot Contract:</span>
                                                          <span className="text-slate-300 underline">0x88f2::otter_autopilot::pool_index</span>
                                                        </div>
                                                        <div className="flex justify-between flex-wrap gap-1">
                                                          <span>Automatic Action Time:</span>
                                                          <span className="text-indigo-405 text-indigo-300">In {inv.timeRemainingSec.toFixed(0)} seconds</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-white/5 pt-2 mt-2 flex-wrap gap-1">
                                                          <span>Simulated Action logic:</span>
                                                          <span className="text-emerald-405 text-emerald-400">Otter AI will evacuate collateral and re-deposit SUI into oWealth Flexible Pool (0.001% weekly yield).</span>
                                                        </div>
                                                      </div>

                                                      <div className="flex justify-end pt-1">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTerminateInvestment(inv.id);
                                                          }}
                                                          className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 hover:border-rose-800/40 text-rose-400 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                                                        >
                                                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                                          <span>Terminate Position Early</span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>

                                  {/* Matured History list */}
                                  <div className="space-y-3 pt-3 text-left">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                                      Matured / Reaped Positions
                                    </h3>

                                    <div className="grid grid-cols-1 gap-3">
                                      {otterInvestments.filter(i => i.status === 'completed').length === 0 ? (
                                        <p className="text-[11px] text-slate-400 pl-1 p-3 bg-zinc-900/10 rounded-xl italic font-sans border border-zinc-805">
                                          No historical investments. Start your first Otter AI strategy above!
                                        </p>
                                      ) : (
                                        otterInvestments.filter(i => i.status === 'completed').map((inv) => (
                                          <div 
                                            key={inv.id}
                                            className="p-4 bg-zinc-950/40 border border-zinc-905 w-full rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 opacity-75 border border-zinc-805"
                                          >
                                            <div>
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-xs font-bold text-slate-300 font-mono">{inv.protocol}</span>
                                                <span className="text-[9px] bg-zinc-90 w-auto border border-zinc-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                                                  {inv.apy.toFixed(1)}% APY
                                                </span>
                                                <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-bold uppercase font-mono">
                                                  Matured
                                                </span>
                                              </div>
                                              <p className="text-[10px] text-slate-450 font-sans">
                                                Launched on {new Date(inv.createdAt).toLocaleString()}
                                              </p>
                                            </div>

                                            <div className="flex items-center gap-6 font-mono self-stretch sm:self-auto justify-between sm:justify-start">
                                              <div className="text-left">
                                                <span className="text-[9px] text-slate-500 block font-bold">PRINCIPAL REFUNDED:</span>
                                                <span className="text-slate-350 text-xs font-semibold">{inv.amountSui.toFixed(1)} SUI</span>
                                              </div>
                                              <div className="text-right">
                                                <span className="text-[9px] text-slate-500 block font-bold">TOTAL PROFIT REAPED:</span>
                                                <span className="text-emerald-405 text-emerald-400 text-xs font-black">
                                                  +{inv.profitMade.toFixed(4)} SUI
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>
                          )}

                          {activeService === 'ledger' && (
                            <TransactionsHistory
                              transactions={transactions}
                              onClearHistory={clearHistory}
                            />
                          )}

                          {activeService === 'faucet' && (
                            <div id="sandbox-simulator-settings" className="glass-panel p-5 rounded-3xl shadow-xl relative overflow-hidden text-left border border-white/5">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                              
                              <div className="flex items-center gap-2 text-white font-bold text-xs font-sans mb-4 border-b border-white/5 pb-3 uppercase tracking-wider">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span>Sandbox Simulator & Mock Email Alert Integrations</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <label className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5 cursor-pointer" htmlFor="email-notifications-toggle">
                                        <span>Enable Real-Time Email Alerts</span>
                                      </label>
                                      <p className="text-[10px] text-slate-400 font-medium leading-normal">
                                        Get mock email alerts with atomic PTB log breakdowns when PennyOtter intercepts incoming payments.
                                      </p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      id="email-notifications-toggle"
                                      checked={emailAlertsEnabled}
                                      onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>

                                  <div className="space-y-1.5 font-sans">
                                    <label className="block text-[10px] text-slate-400 font-sans uppercase font-bold">Simulator Target Email Address</label>
                                    <input
                                      type="email"
                                      disabled={!emailAlertsEnabled}
                                      placeholder="e.g. ayobamioketona@gmail.com"
                                      value={userEmailAddress}
                                      onChange={(e) => setUserEmailAddress(e.target.value)}
                                      className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none transition-all ${
                                        emailAlertsEnabled
                                          ? "glass-input text-white focus:border-blue-500 font-mono"
                                          : "bg-slate-900/10 border-slate-800/30 text-slate-500 cursor-not-allowed font-mono"
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-3.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5 font-sans">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-200 font-sans flex items-center gap-1.5 uppercase tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Interactive PayStream Sandbox Faucet</span>
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-sans">
                                      Trigger a simulated incoming transfer block into PennyOtter to audit dynamic ratio routing rules in action and preview notifications!
                                    </p>
                                  </div>

                                  <div className="flex gap-2.5 items-center font-sans">
                                    <div className="relative flex-1">
                                      <input
                                        type="number"
                                        step="any"
                                        value={faucetAmountSim}
                                        onChange={(e) => setFaucetAmountSim(e.target.value)}
                                        placeholder="SUI Amt"
                                        className="w-full glass-input text-xs px-3 py-2 rounded-xl pr-8 text-white font-mono focus:outline-none focus:border-blue-500 font-bold"
                                      />
                                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[9px] font-bold text-slate-500 font-mono">SUI</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={generateSimulatedIncomingTransfer}
                                      className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none"
                                    >
                                      Simulate Payment
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeService === 'transfer' && (
                            <div className="glass-panel p-6 rounded-3xl text-left relative overflow-hidden max-w-lg mx-auto border border-white/5 shadow-2xl">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                              
                              <div className="flex items-center gap-2 text-white font-bold text-xs font-sans mb-4 border-b border-white/5 pb-3 uppercase tracking-wider">
                                <Send className="w-4 h-4 text-blue-400 animate-pulse" />
                                <span>Outward Peer-to-Peer SUI Transfer</span>
                              </div>

                              <p className="text-[10px] text-slate-400 mb-4 font-sans leading-normal">
                                Initiate outward peer transfers. If your <strong>Spend & Save Split Rule</strong> is currently active under Ratio Rules, a proportional quantum will be automatically intercepted and safely compound in flexible yields in real-time!
                              </p>

                              <form onSubmit={(e) => {
                                handleSpendWealth(e);
                                setIsServiceModalOpen(false);
                              }} className="space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10.5px] font-bold uppercase text-slate-400 font-sans tracking-wide">
                                    <label>Recipient SUI Address</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQrScannerTargetField('transfer_recipient');
                                        setIsQrScannerActive(true);
                                      }}
                                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold bg-transparent border-none cursor-pointer text-[10px] outline-none"
                                      title="Scan recipient SUI address via Camera"
                                    >
                                      <QrCode className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                      <span>Scan QR Code</span>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    id="spending-recipient-address"
                                    placeholder="Recipient Wallet Address (0x...)"
                                    value={mockSendAddress}
                                    onChange={(e) => setMockSendAddress(e.target.value)}
                                    className="w-full glass-input text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none font-mono focus:border-blue-500 font-bold"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10.5px] font-bold uppercase text-slate-400 font-sans tracking-wide">Amount of SUI</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="any"
                                      required
                                      id="spending-amount-to-send"
                                      placeholder={`Enter SUI amount (Limit: ${wallet.spendingBalance.toFixed(2)} SUI)`}
                                      value={mockSendAmount}
                                      onChange={(e) => setMockSendAmount(e.target.value)}
                                      className="w-full glass-input text-xs px-3.5 py-2.5 rounded-xl pr-12 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                                    />
                                    <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-extrabold text-blue-400 font-mono">SUI</span>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  id="spending-send-submit-btn"
                                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-650/15 cursor-pointer border-none"
                                >
                                  <Send className="w-3.5 h-3.5 text-white" />
                                  <span>Execute Atomic Peer Transfer Block</span>
                                </button>
                              </form>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
        </>
      )}

      {/* 2. ADD MONEY POPUP MODAL (SUI WALLET INTERACTION + SLUSH blockchain consensus simulation) */}
      <AnimatePresence>
        {isAddMoneyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md max-h-[88vh] bg-[#090f1e] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col overflow-hidden backdrop-blur-xl animate-fade-in"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10 text-left shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Wallet className="w-5 h-5 font-bold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm font-sans uppercase tracking-wider">Fund SUI Account</h3>
                    <p className="text-[10px] text-slate-400 font-medium font-sans text-left">Fund SUI spending cash & execute direct treasury splits</p>
                  </div>
                </div>
                {addMoneyStep === 'idle' && (
                  <button
                    type="button"
                    onClick={() => setIsAddMoneyOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent p-1 -mt-1 -mr-1"
                  >
                    <span className="text-xl font-bold font-sans">&times;</span>
                  </button>
                )}
              </div>

              {/* Scrollable Modal Content Container */}
              <div className="overflow-y-auto flex-1 pr-1.5 -mr-2 relative z-10 text-slate-100">
                {addMoneyStep === 'idle' ? (
                  <div className="space-y-4 font-sans text-left pb-1">
                    {/* Select amount */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold text-left">Amount to Fund (SUI)</label>
                      <div className="grid grid-cols-4 gap-2 text-left">
                        {['25', '50', '100', '250'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAddMoneyAmount(val)}
                            className={`text-xs font-mono font-bold py-2 rounded-xl border transition-all cursor-pointer ${
                              addMoneyAmount === val
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-sm'
                                : 'bg-white/[0.02] text-slate-300 border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                          >
                            {val} SUI
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom amount */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Or Custom Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={addMoneyAmount}
                          onChange={(e) => setAddMoneyAmount(e.target.value)}
                          placeholder="Enter customized SUI amount"
                          className="w-full glass-input text-xs px-3.5 py-2.5 rounded-xl pr-12 text-white font-mono font-bold focus:outline-none focus:border-emerald-500/60"
                        />
                        <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[10px] font-black text-slate-400 font-mono">SUI</span>
                      </div>
                    </div>

                    {/* SUI Source Address with QR Code Scanner */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        <span>Source SUI Address (Optional)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setQrScannerTargetField('add_money_source');
                            setIsQrScannerActive(true);
                          }}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold bg-transparent border-none cursor-pointer text-[10px] outline-none"
                          title="Scan QR Code Address via Camera"
                        >
                          <QrCode className="w-3 md:w-3.5 h-3 md:h-3.5" />
                          <span>Scan Address</span>
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={customAddMoneySourceAddress}
                          onChange={(e) => setCustomAddMoneySourceAddress(e.target.value)}
                          placeholder="Default or scan SUI address (0x...)"
                          className="w-full glass-input text-[11px] px-3.5 py-2.5 rounded-xl pr-10 text-white font-mono focus:outline-none focus:border-blue-500/60 placeholder-slate-500 font-bold"
                        />
                        {customAddMoneySourceAddress && (
                          <button
                            type="button"
                            onClick={() => setCustomAddMoneySourceAddress('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-transparent border-none text-xs font-sans font-bold cursor-pointer"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Split routing rule description */}
                    <div className="space-y-2 text-left">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">SLUSH Inflow Settlement Mode</label>
                      
                      <div className="grid grid-cols-2 gap-2.5 text-left">
                        <button
                          type="button"
                          onClick={() => setAddMoneyMode('auto_split')}
                          className={`p-3 rounded-2xl text-left border flex flex-col justify-between h-24 transition-all cursor-pointer ${
                            addMoneyMode === 'auto_split'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-sm'
                              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider">Dynamic Ratio Split</span>
                          <span className="text-[9px] leading-snug">Atomically routing funds into Spending Cash, Flexible, and Target Plans.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAddMoneyMode('incoming_banner')}
                          className={`p-3 rounded-2xl text-left border flex flex-col justify-between h-24 transition-all cursor-pointer ${
                            addMoneyMode === 'incoming_banner'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-sm'
                              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider">Manual Inflow Alert</span>
                          <span className="text-[9px] leading-snug">Spawns an active ledger popup at the top of the hub for discretionary splits.</span>
                        </button>
                      </div>

                      {/* Active routing overview info widget */}
                      {addMoneyMode === 'auto_split' && (
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-[10px] text-slate-400 leading-relaxed font-sans space-y-1 text-left">
                          <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px]">Active Treasury Direct Splits:</span>
                          {rules.filter(r => r.isActive).map(r => {
                            const splitAmt = parseFloat(addMoneyAmount) * (r.percentage / 100);
                            return (
                              <div key={r.id} className="flex justify-between items-center font-mono">
                                <span>• {r.name} ({r.percentage}%)</span>
                                <span className="font-extrabold text-blue-400">+{isNaN(splitAmt) ? '0.00' : splitAmt.toFixed(2)} SUI</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      {!currentAccount?.address ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-amber-500/10 border border-amber-550/20 rounded-2xl text-[10px] text-amber-300 leading-relaxed font-sans text-left">
                            <span className="font-bold block text-xs mb-0.5">Sandbox Preview Mode</span>
                            No active SUI wallet detected in this window. Connect your SUI extension wallet to sign real-time programmable on-chain transaction blocks.
                          </div>
                          <div className="flex justify-center py-1">
                            <ConnectButton />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTriggerAddMoney()}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-1.5"
                          >
                            <span>Execute Sandbox Run (Simulated)</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTriggerAddMoney()}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-1.5"
                        >
                          <span>Trigger Transaction in Slush</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-left bg-[#070b14] border border-white/5 rounded-2xl p-4 text-[11px] leading-relaxed relative overflow-hidden my-1">
                    <div className="space-y-2 text-slate-300 text-left">
                      <div className="flex items-center gap-2">
                        <span className={addMoneyStep === 'handshake' || addMoneyStep === 'signature' || addMoneyStep === 'broadcasting' || addMoneyStep === 'complete' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>[✓]</span>
                        <span className={addMoneyStep === 'handshake' ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
                          CONNECTING WITH SUI WALLET COMPILER...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={addMoneyStep === 'signature' || addMoneyStep === 'broadcasting' || addMoneyStep === 'complete' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {addMoneyStep === 'handshake' ? '[⋯]' : '[✓]'}
                        </span>
                        <span className={addMoneyStep === 'signature' ? 'text-emerald-400 font-bold animate-pulse' : addMoneyStep === 'handshake' ? 'text-slate-600' : 'text-slate-400'}>
                          REQUESTING SECURE TRANSACTION BLOCK SIGNATURE...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={addMoneyStep === 'broadcasting' || addMoneyStep === 'complete' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {addMoneyStep === 'handshake' || addMoneyStep === 'signature' ? '[⋯]' : '[✓]'}
                        </span>
                        <span className={addMoneyStep === 'broadcasting' ? 'text-emerald-400 font-bold animate-pulse' : addMoneyStep === 'handshake' || addMoneyStep === 'signature' ? 'text-slate-600' : 'text-slate-400'}>
                          BROADCASTING ATOMIC PTB TO SLUSH CONSENSUS NODES...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={addMoneyStep === 'complete' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {addMoneyStep !== 'complete' ? '[⋯]' : '[✓]'}
                        </span>
                        <span className={addMoneyStep === 'complete' ? 'text-white font-extrabold animate-pulse' : 'text-slate-600'}>
                          LEDGER TRANSACTION CONFIRMED & SETTLED!
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 uppercase font-sans">
                      <span>Target: Slush Devnet-3</span>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-slate-950/45 backdrop-blur-md py-10 mt-20 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200 font-sans">PennyOtter (oWealth Sandbox Engine)</span>
          </div>

          <div className="text-blue-450 text-blue-400 font-medium font-mono text-xs">
            Sui Mainnet RPC Live Connected
          </div>

          <div className="text-slate-400 font-sans font-medium">
            A comprehensive automated treasury model structured for the Sui Move dynamic ecosystem.
          </div>
        </div>
      </footer>

      {/* Float Toasts for instant user response validation */}
      <div className="fixed bottom-4 right-4 z-50 space-y-4 flex flex-col items-end">
        {/* Real-time Email Alert Mock Simulation Toast */}
        <AnimatePresence>
          {showEmailAlertMockToast && emailMockDetails && (
            <motion.div
              id="simulated-email-toast"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#0b1329] border-2 border-blue-500 rounded-2xl p-4.5 shadow-[0_12px_40px_rgba(0,0,0,0.65)] w-80 md:w-96 text-left relative overflow-hidden text-slate-100 border-solid"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-950 text-blue-400 rounded-lg border border-blue-900/40">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-wider">Simulated Inbound Email</span>
                    <span className="text-[9px] text-slate-500 block">Sent via PennyOtter Mail Engine</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailAlertMockToast(false)}
                  className="p-1 hover:bg-[#121c38] rounded-lg text-slate-400 hover:text-white transition-all border-none bg-transparent cursor-pointer"
                >
                  <span className="font-extrabold text-xs">✕</span>
                </button>
              </div>

              <div className="h-[1px] bg-slate-800/60 my-2" />

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 font-extrabold uppercase text-[9px]">To:</span>{' '}
                  <span className="text-slate-200 font-mono font-medium select-all">{emailMockDetails.to}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-extrabold uppercase text-[9px]">Subject:</span>{' '}
                  <span className="text-white font-bold select-all">{emailMockDetails.subject}</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-300 font-mono bg-[#070b16] border border-slate-800/70 p-3 rounded-lg overflow-y-auto max-h-48 whitespace-pre-line leading-relaxed scrollbar-thin select-all">
                  {emailMockDetails.body}
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center bg-blue-950/20 px-2 py-1 rounded-lg border border-blue-900/10">
                <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Email Simulated
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmailAlertMockToast(false)}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-2.5 py-1 rounded-md transition-all border-none cursor-pointer"
                >
                  Confirm Read
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* 4. REAL-TIME QR CODE CAMERA VIEW SCANNER MODAL OVERLAY */}
      <AnimatePresence>
        {isQrScannerActive && (
          <QrScannerOverlay
            isOpen={isQrScannerActive}
            onClose={() => setIsQrScannerActive(false)}
            onScanSuccess={handleQrScanSuccess}
            title={qrScannerTargetField === 'add_money_source' ? "Scan Source SUI Wallet Address" : "Scan Destination SUI Recipient Address"}
          />
        )}
      </AnimatePresence>

      {/* 5. PREFERENCES & GENERAL SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="absolute inset-0 cursor-default" 
              onClick={() => setIsSettingsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-3xl p-6 shadow-2xl relative z-10 text-left overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-900/30 border border-blue-800/40 rounded-xl text-blue-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">System Preferences</h2>
                    <span className="text-[10px] text-slate-400 leading-none">Configure sandbox network, themes, & credentials</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="space-y-5 overflow-y-auto pr-1">
                {/* 1. Theme Configuration */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visual Appearance</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-zinc-900 border-blue-500 text-blue-400 font-extrabold shadow-md' 
                          : 'bg-zinc-950/40 border-zinc-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Slate Dark Mode
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        theme === 'light' 
                          ? 'bg-white border-blue-600 text-blue-600 font-extrabold shadow-md' 
                          : 'bg-zinc-955/40 border-zinc-800 text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Interactive Light Mode
                    </button>
                  </div>
                </div>

                {/* 2. Network Selection */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active RPC Blockchain Gateway</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mainnet', 'testnet', 'devnet'] as const).map((net) => {
                      const isSelected = activeNetwork === net;
                      return (
                        <button
                          key={net}
                          onClick={() => {
                            setActiveNetwork(net);
                            showNotification(`Switched RPC gateway terminal to SUI ${net.toUpperCase()}`, 'success');
                          }}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-zinc-900 border-emerald-500 text-emerald-400 font-extrabold' 
                              : 'bg-zinc-950/45 border-zinc-800 text-slate-400 hover:text-slate-350 hover:bg-zinc-900/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mb-1 ${net === 'mainnet' ? 'bg-emerald-500' : net === 'testnet' ? 'bg-blue-400' : 'bg-purple-500'}`} />
                          {net}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal italic">
                    Note: Different RPC networks load separate sandbox states and testnet multiplier calculations on the Sui validator ledger.
                  </p>
                </div>

                {/* 3. Transaction Security Password */}
                <div className="space-y-4 bg-[#0a0f1d]/60 border border-blue-950/40 rounded-2xl p-4.5 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider">Security Access Code</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isTxPasswordEnabled} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked && !txPassword) {
                            showNotification("Please set a transaction password below before enabling.", "error");
                            return;
                          }
                          setIsTxPasswordEnabled(checked);
                          showNotification(
                            checked 
                              ? "Transaction Password requirement activated!" 
                              : "Transaction security password protection deactivated.", 
                            "success"
                          );
                        }} 
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500 relative"></div>
                    </label>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal">
                    Secure your assets. Once enabled, major outflows, flexible saving redemptions, and locker deposits require inputting this verification password.
                  </p>

                  {/* Password configuration conditional interface */}
                  {!txPassword ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Create Security Passcode / PIN</span>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="e.g. 123456"
                          value={newPasswordSetupInput}
                          onChange={(e) => setNewPasswordSetupInput(e.target.value)}
                          className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cleaned = newPasswordSetupInput.trim();
                            if (cleaned.length === 0) {
                              showNotification("PIN passcode cannot be empty.", "error");
                              return;
                            }
                            setTxPassword(cleaned);
                            setNewPasswordSetupInput('');
                            showNotification("Sectors synchronized! Code security passcode initialized. You can now enable the security toggle above.", "success");
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border-none"
                        >
                          Set PIN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1.5">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-950/40 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">✓ Security Passcode Configured</span>
                        <button
                          type="button"
                          onClick={() => {
                            // Quick way to clear/reset passcode if needed
                            if (window.confirm("Are you sure you want to completely remove your transaction passcode?")) {
                              setTxPassword('');
                              setIsTxPasswordEnabled(false);
                              showNotification("Transaction passcode completely cleared.", "success");
                            }
                          }}
                          className="text-[9px] text-rose-400 hover:text-rose-300 font-bold underline bg-transparent border-none cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Change Password Input Blocks */}
                      <div className="space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-300 block uppercase font-mono">Change Security Password / PIN</span>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-slate-500 block">Current PIN / Password Code</label>
                          <input
                            type="password"
                            placeholder="Enter current password code"
                            value={oldPasswordChangeInput}
                            onChange={(e) => setOldPasswordChangeInput(e.target.value)}
                            className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-slate-500 block">New PIN / Password Code</label>
                          <input
                            type="password"
                            placeholder="Enter brand new password code"
                            value={newPasswordChangeInput}
                            onChange={(e) => setNewPasswordChangeInput(e.target.value)}
                            className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (oldPasswordChangeInput !== txPassword) {
                              showNotification("Old password validation key did not match current PIN.", "error");
                              return;
                            }
                            const cleanedNew = newPasswordChangeInput.trim();
                            if (cleanedNew.length === 0) {
                              showNotification("New security passcode PIN cannot be empty.", "error");
                              return;
                            }
                            setTxPassword(cleanedNew);
                            setOldPasswordChangeInput('');
                            setNewPasswordChangeInput('');
                            showNotification("System secure credentials updated successfully!", "success");
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold py-2 rounded-xl transition-all cursor-pointer border-none font-mono"
                        >
                          Update Security Passcode Key
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Email Asset Alerts */}
                <div className="space-y-4 bg-[#0a0f1d]/60 border border-blue-950/40 rounded-2xl p-4.5 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider">Email Asset Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailAlertsEnabled} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEmailAlertsEnabled(checked);
                          showNotification(
                            checked 
                              ? "Real-time Email Alerts target mode activated!" 
                              : "Email notification alerts deactivated.", 
                            "success"
                          );
                        }} 
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500 relative"></div>
                    </label>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal">
                    Receive immediate notifications, portfolio updates, dynamic automated ratio sweeps, and transaction reports directly in your inbox.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] text-slate-400 font-sans uppercase font-bold">Simulator Target Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="e.g. your-email@domain.com"
                        value={userEmailAddress}
                        disabled={!emailAlertsEnabled}
                        onChange={(e) => setUserEmailAddress(e.target.value)}
                        className={`flex-1 text-xs px-3 py-1.5 rounded-xl border focus:outline-none transition-all ${
                          emailAlertsEnabled
                            ? "glass-input text-white focus:border-blue-500 font-mono"
                            : "bg-slate-900/10 border-slate-800/30 text-slate-500 cursor-not-allowed font-mono"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (userEmailAddress.trim().length === 0) {
                            showNotification("Email address cannot be empty.", "error");
                            return;
                          }
                          showNotification("Alert target email configuration updated!", "success");
                        }}
                        disabled={!emailAlertsEnabled}
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-xl transition-all border-none ${
                          emailAlertsEnabled
                            ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Other sandbox features */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Sandbox Testing Harness</span>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xs text-white font-bold block">Simulation multiplier</span>
                        <span className="text-[9px] text-slate-500 block leading-tight">Augment sandbox yield accruement speeds</span>
                      </div>
                      <select
                        value={simulationSpeed}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSimulationSpeed(val);
                          showNotification(`Set Sandbox simulator speed multiplier to ${val}x`, 'success');
                        }}
                        className="glass-input rounded-xl px-2.5 py-1 text-xs text-slate-300 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value={1}>1x Normal Speed</option>
                        <option value={10}>10x Accumulator</option>
                        <option value={500}>500x Fast-Accrual</option>
                        <option value={5000}>5000x Max Growth</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Close Button Footer */}
              <div className="pt-4 mt-5 border-t border-white/5 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-zinc-900 border border-zinc-800 text-slate-300 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-zinc-855 hover:text-white transition-all cursor-pointer"
                >
                  Save & Return
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PASSWORD CONFIRMATION POPUP INTERCEPTOR */}
      <AnimatePresence>
        {pendingTxAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
            <div 
              className="absolute inset-0 cursor-default" 
              onClick={() => {
                setPendingTxAction(null);
                setPasswordInput('');
                setPasswordError('');
              }} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-sm bg-zinc-950 border-2 border-amber-900/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(245,158,11,0.1)] relative z-10 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5 mb-4">
                <div className="p-1.5 bg-amber-950/40 border border-amber-900/40 rounded-xl text-amber-500">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">Verify Security Code</h3>
                  <p className="text-[9px] text-slate-455 capitalize">Transaction auth required</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] text-slate-300 font-semibold bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  {pendingTxAction.description}
                </p>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Security Password Pin</span>
                  <input
                    type="password"
                    placeholder="Enter security password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    autoFocus
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 font-bold focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (passwordInput === txPassword) {
                          const taskToRun = pendingTxAction.action;
                          setPendingTxAction(null);
                          setPasswordInput('');
                          taskToRun();
                        } else {
                          setPasswordError('Invalid transaction passkey pin. Please retry.');
                        }
                      }
                    }}
                  />
                  {passwordError && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingTxAction(null);
                      setPasswordInput('');
                      setPasswordError('');
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-slate-400 font-bold text-[10px] px-3.5 py-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (passwordInput === txPassword) {
                        const taskToRun = pendingTxAction.action;
                        setPendingTxAction(null);
                        setPasswordInput('');
                        taskToRun();
                      } else {
                        setPasswordError('Invalid transaction passkey pin. Please retry.');
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none"
                  >
                    Authorize Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
