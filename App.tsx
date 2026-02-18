import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Tab, Upgrade, Language, ShopItem } from './types';
import { INITIAL_ENERGY, ENERGY_REGEN_RATE, UPGRADES, SAVE_KEY, TRANSLATIONS, SHOP_ITEMS, OBSIDIAN_CONVERSION_RATE, OBSIDIAN_ICON_URL, ERIDROP_MILESTONE, OWNER_WALLET } from './constants';
import { Boinker } from './components/Boinker';
import { generateObsidianLogo } from './services/geminiService';

// Sound Configuration
const SOUNDS = {
  tap: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  collect: 'https://assets.mixkit.co/active_storage/sfx/608/608-preview.mp3',
  buy: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  mint: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
};

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Catch autoplay blocks
};

interface Mote {
  id: number;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

const ObsidianIcon: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg', customIcon?: string | null, className?: string }> = ({ size = 'md', customIcon, className = '' }) => {
  const sizeClass = size === 'xs' ? 'w-4 h-4' : size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';
  return (
    <img 
      src={customIcon || OBSIDIAN_ICON_URL} 
      className={`${sizeClass} obsidian-icon rounded-full object-contain pointer-events-none transition-all duration-700 ${className}`}
      alt="Obsidian"
    />
  );
};

const App: React.FC = () => {
  // Game State
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      balance: 0,
      totalEarned: 0,
      energy: INITIAL_ENERGY,
      maxEnergy: INITIAL_ENERGY,
      tapPower: 1,
      passiveIncome: 0,
      level: 1,
      lastUpdate: Date.now(),
      language: 'ar',
      walletAddress: null,
      obsidianBalance: 0,
      customObsidianIcon: null
    };
  });

  const lang: Language = state.language || 'ar';
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const [motes, setMotes] = useState<Mote[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<ShopItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Animation state for balance
  const [isBalancePulsing, setIsBalancePulsing] = useState(false);
  const lastBalanceRef = useRef(state.balance);

  // Persistence
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  // Balance Pulse Trigger
  useEffect(() => {
    if (Math.floor(state.balance) !== Math.floor(lastBalanceRef.current)) {
      setIsBalancePulsing(true);
      const timer = setTimeout(() => setIsBalancePulsing(false), 200);
      lastBalanceRef.current = state.balance;
      return () => clearTimeout(timer);
    }
  }, [state.balance]);

  // Automatic Logo Generation if missing
  useEffect(() => {
    if (!state.customObsidianIcon) {
      const initLogo = async () => {
        const logoUrl = await generateObsidianLogo();
        if (logoUrl) {
          setState(prev => ({ ...prev, customObsidianIcon: logoUrl }));
        }
      };
      initLogo();
    }
  }, [state.customObsidianIcon]);

  // Game Loop & Mote Spawner
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Passive Income & Energy
      setState(prev => {
        const delta = (now - prev.lastUpdate) / 1000;
        const passiveGain = prev.passiveIncome * delta;
        const newBalance = prev.balance + passiveGain;
        const newEnergy = Math.min(prev.maxEnergy, prev.energy + ENERGY_REGEN_RATE * delta);
        
        return {
          ...prev,
          balance: newBalance,
          totalEarned: prev.totalEarned + passiveGain,
          energy: newEnergy,
          lastUpdate: now
        };
      });

      // Spawn Tiny Points (Motes) randomly - 10% chance every second
      if (Math.random() < 0.1 && activeTab === Tab.HOME) {
        const newMote: Mote = {
          id: now,
          x: 10 + Math.random() * 80, // percentage
          y: 20 + Math.random() * 60, // percentage
          value: Math.ceil(state.tapPower * 5),
          createdAt: now
        };
        setMotes(prev => [...prev, newMote]);
      }

      // Cleanup old motes (lifespan 8 seconds)
      setMotes(prev => prev.filter(m => now - m.createdAt < 8000));

    }, 1000);

    return () => clearInterval(interval);
  }, [state.tapPower, activeTab]);

  const handleTap = useCallback((x: number, y: number) => {
    if (state.energy < 1) {
      playSound(SOUNDS.error);
      return;
    }
    
    playSound(SOUNDS.tap);
    const tapVal = state.tapPower;
    setState(prev => ({
      ...prev,
      balance: prev.balance + tapVal,
      totalEarned: prev.totalEarned + tapVal,
      energy: Math.max(0, prev.energy - 1)
    }));
    
    const id = Date.now();
    setClickEffects(prev => [...prev, { id, x, y, val: tapVal }]);
    setTimeout(() => {
      setClickEffects(prev => prev.filter(e => e.id !== id));
    }, 800);
  }, [state.energy, state.tapPower]);

  const handleMoteClick = (e: React.MouseEvent, moteId: number) => {
    e.stopPropagation();
    const mote = motes.find(m => m.id === moteId);
    if (!mote) return;

    playSound(SOUNDS.collect);
    if ('vibrate' in navigator) navigator.vibrate(30);

    setState(prev => ({
      ...prev,
      balance: prev.balance + mote.value,
      totalEarned: prev.totalEarned + mote.value
    }));

    setMotes(prev => prev.filter(m => m.id !== moteId));
  };

  const handleUpgrade = (upgrade: Upgrade) => {
    if (state.balance >= upgrade.cost) {
      playSound(SOUNDS.buy);
      if ('vibrate' in navigator) navigator.vibrate(20);
      setState(prev => ({
        ...prev,
        balance: prev.balance - upgrade.cost,
        tapPower: upgrade.type === 'tap' ? prev.tapPower + upgrade.increase : prev.tapPower,
        passiveIncome: upgrade.type === 'passive' ? prev.passiveIncome + upgrade.increase : prev.passiveIncome
      }));
    } else {
      playSound(SOUNDS.error);
    }
  };

  const handleMintObsidian = () => {
    if (state.balance >= OBSIDIAN_CONVERSION_RATE) {
      playSound(SOUNDS.mint);
      const obsidianToMint = Math.floor(state.balance / OBSIDIAN_CONVERSION_RATE);
      const pointsToDeduct = obsidianToMint * OBSIDIAN_CONVERSION_RATE;
      
      setState(prev => ({
        ...prev,
        balance: prev.balance - pointsToDeduct,
        obsidianBalance: prev.obsidianBalance + obsidianToMint
      }));

      if ('vibrate' in navigator) {
        navigator.vibrate([100, 30, 100, 30, 100]);
      }
    } else {
      playSound(SOUNDS.error);
    }
  };

  const handleConnectWallet = async () => {
    if (state.walletAddress) return;
    playSound(SOUNDS.tap);
    if ('vibrate' in navigator) navigator.vibrate(50);
    setIsConnecting(true);
    setTimeout(() => {
      const mockAddress = "UQ" + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      playSound(SOUNDS.mint);
      if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
      setState(prev => ({ ...prev, walletAddress: mockAddress }));
      setIsConnecting(false);
    }, 1500);
  };

  const toggleLanguage = () => {
    playSound(SOUNDS.tap);
    setState(prev => ({
      ...prev,
      language: prev.language === 'ar' ? 'en' : 'ar'
    }));
  };

  const processActualPayment = async () => {
    if (!pendingPurchase) return;
    setIsProcessingPayment(true);
    
    setTimeout(() => {
      playSound(SOUNDS.mint);
      if ('vibrate' in navigator) navigator.vibrate([50, 20, 50]);
      if (pendingPurchase.reward > 0) {
        setState(prev => ({ ...prev, balance: prev.balance + pendingPurchase.reward }));
      }
      setIsProcessingPayment(false);
      setPendingPurchase(null);
    }, 2000);
  };

  const handleBuyItem = (item: ShopItem) => {
    playSound(SOUNDS.tap);
    if (!state.walletAddress) {
      handleConnectWallet();
      return;
    }
    setPendingPurchase(item);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        const mintProgress = (state.balance % OBSIDIAN_CONVERSION_RATE) / OBSIDIAN_CONVERSION_RATE;
        const readyToMint = state.balance >= OBSIDIAN_CONVERSION_RATE;

        return (
          <div key="home" className="tab-content-enter flex flex-col items-center justify-between h-full py-8 relative">
            {/* Spawning Motes (Tiny Points) */}
            {motes.map(mote => (
              <div 
                key={mote.id}
                onClick={(e) => handleMoteClick(e, mote.id)}
                className="absolute w-8 h-8 cursor-pointer z-40 animate-pulse bg-indigo-500/40 rounded-full flex items-center justify-center border border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all hover:scale-125 active:scale-90"
                style={{ left: `${mote.x}%`, top: `${mote.y}%` }}
              >
                <span className="text-[10px] font-black text-white">+{mote.value}</span>
              </div>
            ))}

            <div className="text-center w-full px-6">
              <div className="flex flex-col gap-1 items-center mb-6">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">{t.obsidian}</span>
                <div className="flex items-center gap-3">
                  <ObsidianIcon size="lg" customIcon={state.customObsidianIcon} />
                  <h2 className={`text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-transform ${isBalancePulsing ? 'scale-110 text-purple-300' : ''}`}>
                    {state.obsidianBalance.toLocaleString()}
                  </h2>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 justify-center transition-all ${isBalancePulsing ? 'balance-update' : ''}`}>
                <span className="text-2xl">💎</span>
                <h1 className="text-3xl font-bold text-yellow-400">
                  {Math.floor(state.balance).toLocaleString()}
                </h1>
              </div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                {t.totalBoinks}
              </p>
            </div>

            <Boinker onTap={handleTap} disabled={state.energy < 1} disabledLabel={t.outOfEnergy} customIcon={state.customObsidianIcon} />

            <div className="w-full max-w-xs space-y-4 px-4">
               <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group">
                  <div className={`flex justify-between items-center text-[10px] font-black text-indigo-400 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-1">
                      <ObsidianIcon size="sm" customIcon={state.customObsidianIcon} />
                      <span>{t.pointsToObsidian}</span>
                    </div>
                    <span className="bg-indigo-500/10 px-2 py-0.5 rounded-full">{Math.floor(mintProgress * 100)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_100%] animate-gradient-shift rounded-full transition-all duration-300"
                      style={{ width: `${mintProgress * 100}%` }}
                    />
                  </div>
                  <button 
                    onClick={handleMintObsidian}
                    disabled={!readyToMint}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all transform active:scale-95 ${
                      readyToMint 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] shimmer-bg' 
                      : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {readyToMint ? t.mintReady : t.mint}
                  </button>
               </div>

              <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
                <div className={`flex justify-between text-[10px] font-black mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-slate-400 uppercase tracking-tighter">⚡ Core Stability</span>
                  <span className="text-yellow-500">{Math.floor(state.energy)} / {state.maxEnergy}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300 ${isRtl ? 'ml-auto' : ''}`}
                    style={{ width: `${(state.energy / state.maxEnergy) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case Tab.UPGRADES:
        return (
          <div key="upgrades" className="tab-content-enter flex flex-col h-full p-6 pb-24 overflow-y-auto">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-2 bg-yellow-500/20 rounded-lg">🚀</span> {t.upgrades}
            </h2>
            <div className="space-y-4">
              {UPGRADES.map((upgrade, idx) => {
                const canAfford = state.balance >= upgrade.cost;
                return (
                  <button 
                    key={upgrade.id}
                    onClick={() => handleUpgrade(upgrade)}
                    disabled={!canAfford}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    className={`item-enter flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-95 hover:border-slate-600 ${isRtl ? 'flex-row-reverse' : ''} ${
                      canAfford ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-transparent opacity-50 grayscale'
                    }`}
                  >
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">
                      {upgrade.icon}
                    </div>
                    <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <h3 className="font-bold text-white">{upgrade.name[lang]}</h3>
                      <p className="text-xs text-slate-400">{upgrade.description[lang]}</p>
                    </div>
                    <div className={isRtl ? 'text-left' : 'text-right'}>
                      <div className="text-yellow-400 font-bold whitespace-nowrap">💎 {upgrade.cost.toLocaleString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case Tab.SHOP:
        return (
          <div key="shop" className="tab-content-enter flex flex-col h-full p-6 pb-24 overflow-y-auto">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-2 bg-blue-500/20 rounded-lg">🛒</span> {t.shop}
            </h2>
            <div className="space-y-4">
              {SHOP_ITEMS.map((item, idx) => (
                <div 
                  key={item.id}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`item-enter flex items-center gap-4 p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center text-3xl shadow-lg">
                    {item.icon}
                  </div>
                  <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-bold text-white text-lg">{item.name[lang]}</h3>
                    <p className="text-sm text-yellow-400 font-bold">
                      {item.reward > 0 ? `+${item.reward.toLocaleString()} Points` : 'BOOST'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBuyItem(item)}
                    className="px-4 py-2 ton-gradient rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform"
                  >
                    {item.priceTon} TON
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case Tab.ERIDROP:
        const simulatedUsers = Math.floor(state.totalEarned * 0.5 + 4200000); 
        const progress = Math.min(100, (simulatedUsers / ERIDROP_MILESTONE) * 100);
        
        return (
          <div key="eridrop" className="tab-content-enter flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse"></div>
              <div className="w-56 h-56 bg-slate-900 border-4 border-blue-500 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-transform hover:scale-105 duration-700">
                 <ObsidianIcon size="lg" customIcon={state.customObsidianIcon} className="scale-150" />
              </div>
            </div>
            
            <div className="space-y-3 w-full max-sm:max-w-xs">
              <h2 className="text-4xl font-black text-white leading-tight uppercase">{(t as any).eriDropTitle}</h2>
              <p className="text-blue-400 font-black uppercase tracking-widest text-xs">{(t as any).eriDropSlogan}</p>
              <p className="text-slate-400 font-medium leading-relaxed">{(t as any).eriDropDesc}</p>
            </div>

            <div className="w-full max-w-md bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-2xl">
               <div className={`flex justify-between items-center text-xs font-black mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                 <div className="flex items-center gap-2">
                   <ObsidianIcon size="sm" customIcon={state.customObsidianIcon} />
                   <span className="text-blue-400 uppercase tracking-widest">{(t as any).eriDropProgress}</span>
                 </div>
                 <span className="text-white">{progress.toFixed(2)}%</span>
               </div>
               <div className="h-5 bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner relative">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 bg-[length:200%_100%] animate-gradient-shift rounded-full transition-all duration-500"
                   style={{ width: `${progress}%` }}
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white/50 font-black tracking-tighter uppercase">Community Milestone</span>
                 </div>
               </div>
               <div className={`flex justify-between mt-4 text-[10px] font-bold text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                 <span>{simulatedUsers.toLocaleString()} Users</span>
                 <span>{ERIDROP_MILESTONE.toLocaleString()} Users</span>
               </div>
            </div>
          </div>
        );

      case Tab.FRIENDS:
        return (
          <div key="friends" className="tab-content-enter flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
            <div className="text-6xl animate-bounce">🤝</div>
            <h2 className="text-3xl font-bold">{t.inviteFriends}</h2>
            <p className="text-slate-400">{t.inviteDesc}</p>
            <button 
              onClick={() => { playSound(SOUNDS.tap); }}
              className="w-full py-4 bg-yellow-500 text-black font-bold rounded-2xl text-xl shadow-lg active:scale-95 transition-all hover:brightness-110"
            >
              {t.inviteBtn}
            </button>
          </div>
        );

      case Tab.EARN:
        return (
          <div key="earn" className="tab-content-enter flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-24">
             <h2 className={`text-2xl font-bold ${isRtl ? 'text-right' : 'text-left'}`}>{t.dailyTasks}</h2>
             <div className="space-y-3">
               {[
                 { title: t.followTg, reward: '+5,000', btn: t.claim },
                 { title: t.watchVideo, reward: '+10,000', btn: t.play }
               ].map((task, i) => (
                 <div 
                   key={i} 
                   style={{ animationDelay: `${i * 0.05}s` }}
                   className={`item-enter p-4 bg-slate-800 border border-slate-700 rounded-xl flex justify-between items-center hover:bg-slate-700 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                 >
                   <div className={isRtl ? 'text-right' : 'text-left'}>
                     <h4 className="font-bold">{task.title}</h4>
                     <span className="text-yellow-400 font-bold">{task.reward} 💎</span>
                   </div>
                   <button 
                    onClick={() => { playSound(SOUNDS.tap); }}
                    className="px-4 py-1 bg-yellow-500 text-black rounded-lg text-sm font-bold active:scale-90 transition-transform"
                   >
                    {task.btn}
                   </button>
                 </div>
               ))}
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleTabChange = (newTab: Tab) => {
    if (activeTab === newTab) return;
    playSound(SOUNDS.tap);
    if ('vibrate' in navigator) navigator.vibrate(5);
    setActiveTab(newTab);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 overflow-hidden relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {clickEffects.map(effect => (
        <div key={effect.id} className="boink-number flex items-center gap-1" style={{ left: effect.x, top: effect.y }}>
          <ObsidianIcon size="xs" customIcon={state.customObsidianIcon} />
          <span>+{effect.val}</span>
        </div>
      ))}

      {/* Payment Confirmation Modal */}
      {pendingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => !isProcessingPayment && setPendingPurchase(null)}></div>
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                {pendingPurchase.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">{(t as any).confirmPayment}</h3>
                <p className="text-slate-400 font-medium">{pendingPurchase.name[lang]}</p>
              </div>

              <div className="w-full bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Price</span>
                  <span className="text-xl font-black text-blue-400">{pendingPurchase.priceTon} TON</span>
                </div>
                <div className="h-[1px] bg-slate-700 w-full"></div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{(t as any).sendTo}</span>
                  <p className="text-[10px] font-mono text-slate-400 break-all bg-slate-950 p-2 rounded-lg border border-slate-800">{OWNER_WALLET}</p>
                </div>
              </div>

              <button 
                onClick={processActualPayment}
                disabled={isProcessingPayment}
                className="w-full py-4 ton-gradient text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isProcessingPayment ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img src="https://ton.org/download/ton_symbol.png" className="w-5 h-5" alt="TON" />
                    {(t as any).payWithTon}
                  </>
                )}
              </button>

              {!isProcessingPayment && (
                <button 
                  onClick={() => { playSound(SOUNDS.tap); setPendingPurchase(null); }}
                  className="text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900 to-transparent flex items-center justify-between px-6 z-20 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-2 bg-slate-800/80 pr-4 py-1 pl-1 rounded-full border border-slate-700 shadow-lg transition-transform hover:scale-105 active:scale-95">
               <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center font-black text-black text-[10px]">A</div>
               <span className="font-black text-slate-200 text-[10px] uppercase tracking-tighter">{t.level} {state.level}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-transform hover:scale-105 active:scale-95">
              <ObsidianIcon size="sm" customIcon={state.customObsidianIcon} />
              <span className="font-black text-indigo-300 text-xs tracking-tight">
                {state.obsidianBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all shadow-lg active:scale-95 ${
                state.walletAddress 
                ? 'bg-slate-800 border border-green-500/50 text-green-400' 
                : 'ton-gradient text-white'
              }`}
            >
              {isConnecting ? '...' : (state.walletAddress ? `${state.walletAddress.slice(0,4)}...${state.walletAddress.slice(-3)}` : t.connectWallet)}
            </button>
            <button 
              onClick={toggleLanguage}
              className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black text-yellow-500 hover:bg-slate-700 transition-all active:scale-90"
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>
          </div>
        </div>
        {renderContent()}
      </main>

      <nav className={`h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-30 pb-safe ${isRtl ? 'flex-row-reverse' : ''}`}>
        <NavItem active={activeTab === Tab.HOME} label={t.boink} icon="🏠" onClick={() => handleTabChange(Tab.HOME)} />
        <NavItem active={activeTab === Tab.UPGRADES} label={t.upgrades} icon="🚀" onClick={() => handleTabChange(Tab.UPGRADES)} />
        <NavItem active={activeTab === Tab.SHOP} label={t.shop} icon="🛒" onClick={() => handleTabChange(Tab.SHOP)} />
        <NavItem active={activeTab === Tab.EARN} label={t.tasks} icon="📝" onClick={() => handleTabChange(Tab.EARN)} />
        <NavItem active={activeTab === Tab.ERIDROP} label={t.eriDrop} icon="✨" onClick={() => handleTabChange(Tab.ERIDROP)} />
        <NavItem active={activeTab === Tab.FRIENDS} label={t.squad} icon="🤝" onClick={() => handleTabChange(Tab.FRIENDS)} />
      </nav>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative group ${
      active ? 'text-yellow-400' : 'text-slate-500'
    }`}
  >
    <span className={`text-2xl mb-1 transition-transform duration-200 group-active:scale-125 ${active ? 'scale-110' : 'scale-100 opacity-70'}`}>{icon}</span>
    <span className={`text-[10px] font-black uppercase tracking-tighter text-center transition-opacity ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {active && <div className="absolute bottom-0 w-8 h-1 bg-yellow-400 rounded-t-full shadow-[0_-2px_10px_rgba(250,204,21,0.5)]" />}
  </button>
);

export default App;