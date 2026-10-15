import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { playTactileSound, triggerHaptic } from './utils/audio';

const STORAGE_KEY = 'numbr_counter_state_v1';

const INITIAL_LOGS = [
  { id: 1, deltaStr: '+10', actionType: 'INCREMENT_STEP', sourceTrigger: 'Mouse Click', isPositive: true, timestamp: '14:02:19.412' },
  { id: 2, deltaStr: '+10', actionType: 'INCREMENT_STEP', sourceTrigger: 'Key [Space]', isPositive: true, timestamp: '14:02:18.891' },
  { id: 3, deltaStr: '-10', actionType: 'DECREMENT_STEP', sourceTrigger: 'Mouse Click', isPositive: false, timestamp: '14:02:14.205' },
  { id: 4, deltaStr: '×2', actionType: 'MATH_DOUBLE', sourceTrigger: 'Macro', isPositive: true, timestamp: '14:02:08.110' },
  { id: 5, deltaStr: 'CLR', actionType: 'RESET_BUFFER', sourceTrigger: 'Key [R]', isPositive: null, timestamp: '14:01:52.004' }
];

const PRESETS = [
  { id: 'custom', name: '01 // Custom Tally', defaultCount: 1048, defaultStep: 10, defaultGoal: 2500 },
  { id: 'gym', name: '02 // Gym Sets & Reps', defaultCount: 12, defaultStep: 1, defaultGoal: 50 },
  { id: 'inventory', name: '03 // Inventory Audit', defaultCount: 1850, defaultStep: 25, defaultGoal: 5000 },
  { id: 'headcount', name: '04 // Headcount', defaultCount: 84, defaultStep: 1, defaultGoal: 300 }
];

export default function App() {
  // Primary State using useState hooks as requested
  const [count, setCount] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.count === 'number') return parsed.count;
      }
    } catch {
      // fallback to default
    }
    return 1048;
  });

  const [prevCount, setPrevCount] = useState(1038);
  const [step, setStep] = useState(10);
  const [customStepInput, setCustomStepInput] = useState('10');
  const [targetGoal, setTargetGoal] = useState(2500);
  const [totalClicks, setTotalClicks] = useState(1842);
  const [peakValue, setPeakValue] = useState(1500);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [activePreset, setActivePreset] = useState('custom');
  const [activeNavTab, setActiveNavTab] = useState('counter'); // 'counter', 'logs', 'targets', 'config'
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [undoStack, setUndoStack] = useState([]);
  const [floatingDelta, setFloatingDelta] = useState(null);
  const [bounceActive, setBounceActive] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(2539); // 00:42:19
  const [clickTimestamps, setClickTimestamps] = useState([]);
  const [goalEditing, setGoalEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState('2500');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Render Cycle Tracker (to showcase live React lifecycle inspection)
  const renderCyclesRef = useRef(143);
  renderCyclesRef.current += 1;

  // Track session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      const payload = {
        count,
        prevCount,
        step,
        targetGoal,
        totalClicks,
        peakValue,
        activePreset
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // LocalStorage access may fail in private window
    }
  }, [count, prevCount, step, targetGoal, totalClicks, peakValue, activePreset]);

  // Format Session Time string (HH:MM:SS)
  const sessionTimeString = useMemo(() => {
    const hrs = String(Math.floor(sessionSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(sessionSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }, [sessionSeconds]);

  // Radix & parity derived values (stable with useMemo)
  const { hexString, binString, isEven } = useMemo(() => {
    const absVal = Math.abs(count);
    const hex = '0x' + absVal.toString(16).toUpperCase().padStart(4, '0');
    const rawBin = absVal.toString(2).padStart(16, '0');
    const bin = rawBin.match(/.{1,4}/g)?.join(' ') || rawBin;
    const even = count % 2 === 0;
    return { hexString: hex, binString: bin, isEven: even };
  }, [count]);

  // Goal Progress percentage
  const progressPercent = useMemo(() => {
    if (targetGoal <= 0) return 0;
    const pct = (count / targetGoal) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [count, targetGoal]);

  // Clicks Per Second (CPS) moving measurement over last 3 seconds
  const currentCPS = useMemo(() => {
    const now = Date.now();
    const windowStart = now - 3000;
    const validClicks = clickTimestamps.filter(t => t >= windowStart);
    if (validClicks.length === 0) return '0.0';
    return (validClicks.length / 3).toFixed(1);
  }, [clickTimestamps]);

  // Show floating delta badge with auto-cleanup
  const showFloatingDelta = useCallback((label, isPos) => {
    setFloatingDelta({ label, isPos, id: Date.now() });
    setTimeout(() => {
      setFloatingDelta(null);
    }, 550);
  }, []);

  // Append entry to Audit Buffer (max 50 events)
  const appendLog = useCallback((deltaStr, actionType, sourceTrigger, isPositive) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const newEntry = {
      id: Date.now() + Math.random(),
      deltaStr,
      actionType,
      sourceTrigger,
      isPositive,
      timestamp: timeStr
    };
    setLogs(prev => [newEntry, ...prev.slice(0, 49)]);
  }, []);

  // Core Dispatcher: Applies count transformation
  const applyCountChange = useCallback((nextCountOrFn, actionName, deltaDisplay, source = 'Mouse Click', isPositive = null, soundType = 'inc') => {
    setCount(currentCount => {
      const nextCount = typeof nextCountOrFn === 'function' ? nextCountOrFn(currentCount) : nextCountOrFn;
      
      // Push previous state to undo stack
      setUndoStack(prev => [...prev.slice(-49), currentCount]);
      setPrevCount(currentCount);

      // Audio & Haptic feedback
      if (audioEnabled) {
        playTactileSound(soundType);
      }
      if (hapticsEnabled) {
        triggerHaptic(soundType === 'reset' ? 30 : 15);
      }

      // Check for goal completion celebration
      if (nextCount >= targetGoal && currentCount < targetGoal && targetGoal > 0) {
        if (audioEnabled) {
          setTimeout(() => playTactileSound('goal'), 150);
        }
        try {
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#00b4d8', '#05c48b', '#ffffff', '#ffd166']
          });
        } catch {}
      }

      // Update Peak value
      setPeakValue(prevPeak => Math.max(prevPeak, nextCount));
      
      // Update Total Clicks & CPS timestamps
      setTotalClicks(prev => prev + 1);
      const now = Date.now();
      setClickTimestamps(prev => [...prev.filter(t => t >= now - 3500), now]);

      // Visual animations
      setBounceActive(true);
      setTimeout(() => setBounceActive(false), 90);
      showFloatingDelta(deltaDisplay, isPositive);
      appendLog(deltaDisplay, actionName, source, isPositive);

      return nextCount;
    });
  }, [audioEnabled, hapticsEnabled, targetGoal, showFloatingDelta, appendLog]);

  // Primary Button Handlers
  const handleIncrement = useCallback((source = 'Mouse Click') => {
    applyCountChange(
      c => c + step,
      'INCREMENT_STEP',
      `+${step}`,
      source,
      true,
      'inc'
    );
  }, [step, applyCountChange]);

  const handleDecrement = useCallback((source = 'Mouse Click') => {
    applyCountChange(
      c => c - step,
      'DECREMENT_STEP',
      `-${step}`,
      source,
      false,
      'dec'
    );
  }, [step, applyCountChange]);

  const handleReset = useCallback((source = 'Button [R]') => {
    applyCountChange(
      0,
      'RESET_ZERO',
      'CLR 0',
      source,
      null,
      'reset'
    );
  }, [applyCountChange]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setPrevCount(count);
    setCount(previous);
    if (audioEnabled) playTactileSound('macro');
    if (hapticsEnabled) triggerHaptic(15);
    appendLog('UNDO', 'BUFFER_UNDO', 'Undo Click', null);
    showFloatingDelta(`↺ ${previous}`, null);
  }, [undoStack, count, audioEnabled, hapticsEnabled, appendLog, showFloatingDelta]);

  // Quick Math Modifiers
  const handleDouble = useCallback(() => {
    applyCountChange(c => c * 2, 'MATH_DOUBLE', '×2', 'Macro', true, 'macro');
  }, [applyCountChange]);

  const handleHalf = useCallback(() => {
    applyCountChange(c => Math.floor(c / 2), 'MATH_HALF', '÷2', 'Macro', false, 'macro');
  }, [applyCountChange]);

  const handleInvert = useCallback(() => {
    applyCountChange(c => -c, 'MATH_INVERT', '± INV', 'Macro', null, 'macro');
  }, [applyCountChange]);

  const handleRound = useCallback(() => {
    applyCountChange(c => Math.round(c / 100) * 100, 'MATH_ROUND100', 'ROUND', 'Macro', true, 'macro');
  }, [applyCountChange]);

  const handleRandom = useCallback(() => {
    const rnd = Math.floor(Math.random() * 999) + 1;
    applyCountChange(rnd, 'MATH_RANDOM', `RND ${rnd}`, 'Macro', true, 'macro');
  }, [applyCountChange]);

  // Step change handler
  const handleSelectStep = useCallback((val) => {
    setStep(val);
    setCustomStepInput(String(val));
    if (audioEnabled) playTactileSound('inc');
    if (hapticsEnabled) triggerHaptic(10);
  }, [audioEnabled, hapticsEnabled]);

  const handleCustomStepInput = (e) => {
    const raw = e.target.value;
    setCustomStepInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setStep(parsed);
    }
  };

  // Preset Selection Handler
  const handleSelectPreset = useCallback((preset) => {
    setActivePreset(preset.id);
    setCount(preset.defaultCount);
    setPrevCount(preset.defaultCount);
    setStep(preset.defaultStep);
    setCustomStepInput(String(preset.defaultStep));
    setTargetGoal(preset.defaultGoal);
    setTempGoal(String(preset.defaultGoal));
    if (audioEnabled) playTactileSound('macro');
    if (hapticsEnabled) triggerHaptic(20);
    appendLog(preset.name.split('//')[1]?.trim() || preset.id, 'PRESET_LOAD', 'Preset Selector', true);
    showFloatingDelta(preset.id.toUpperCase(), true);
  }, [audioEnabled, hapticsEnabled, appendLog, showFloatingDelta]);

  // Copy Snippet to clipboard
  const handleCopyCodeSnippet = () => {
    const snippet = `const [count, setCount] = useState(${count});\nconst [step, setStep] = useState(${step});\nconst [history, dispatch] = useReducer(counterReducer, initialTape);`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(snippet).then(() => {
        setCopyCodeSuccess(true);
        setTimeout(() => setCopyCodeSuccess(false), 1800);
      }).catch(() => {
        setCopyCodeSuccess(true);
        setTimeout(() => setCopyCodeSuccess(false), 1800);
      });
    } else {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 1800);
    }
  };

  // Export Log File
  const handleExportLogs = () => {
    const headers = 'ID,Timestamp,Delta,Action,Source\n';
    const rows = logs.map(l => `"${l.id}","${l.timestamp}","${l.deltaStr}","${l.actionType}","${l.sourceTrigger}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numbr_audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (audioEnabled) playTactileSound('macro');
  };

  // Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
    appendLog('BUFFER_FLUSH', 'AUDIT_CLEAR', 'Admin Trigger', null);
    if (audioEnabled) playTactileSound('reset');
  };

  // Target Goal Editing Submit
  const handleSaveGoal = (e) => {
    e.preventDefault();
    const val = parseInt(tempGoal, 10);
    if (!isNaN(val) && val > 0) {
      setTargetGoal(val);
    }
    setGoalEditing(false);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't intercept if user is typing into an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          handleDecrement('Key [Shift+Space]');
        } else {
          handleIncrement('Key [Space]');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset('Key [R]');
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const stepMap = { '1': 1, '2': 5, '3': 10, '4': 50, '5': 100 };
        handleSelectStep(stepMap[e.key]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleIncrement, handleDecrement, handleReset, handleUndo, handleSelectStep]);

  return (
    <div className="bg-[#e6ecf4] min-h-[100dvh] text-slate-800 antialiased selection:bg-cyan-500 selection:text-white pb-28 sm:pb-24">
      {/* =========================================================================
          TOP HEADER NAV: Neumorphic Floating Island Bar
      ========================================================================== */}
      <header className="sticky top-0 z-40 bg-[#e6ecf4]/95 backdrop-blur-md px-3 sm:px-6 md:px-8 py-3 border-b border-white/60 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl neu-convex flex items-center justify-center p-0.5 overflow-hidden transition-transform active:scale-95 shrink-0">
              <img
                src="/logo.png"
                alt="NUMBR Official Tally Counter Logo"
                className="w-full h-full object-contain rounded-xl"
                width="44"
                height="44"
                loading="eager"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="flex items-center gap-1.5 sm:gap-2 m-0 p-0 text-inherit font-inherit">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">NUMBR</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold text-cyan-700 neu-sunken">v19.2</span>
              </h1>
              <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 tracking-wide font-mono uppercase truncate max-w-[170px] sm:max-w-none">
                Hardware-Level Tally Runtime
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center p-1.5 rounded-2xl neu-sunken gap-1" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setActiveNavTab('counter')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeNavTab === 'counter'
                  ? 'text-cyan-700 neu-convex shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Counter
            </button>
            <button
              type="button"
              onClick={() => setActiveNavTab('logs')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeNavTab === 'logs'
                  ? 'text-cyan-700 neu-convex shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Logs
            </button>
            <button
              type="button"
              onClick={() => setActiveNavTab('targets')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeNavTab === 'targets'
                  ? 'text-cyan-700 neu-convex shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Targets
            </button>
            <button
              type="button"
              onClick={() => setActiveNavTab('config')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeNavTab === 'config'
                  ? 'text-cyan-700 neu-convex shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Config
            </button>
          </nav>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Hotkey Hint Badge (Desktop only) */}
            <div className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl neu-sunken text-[11px] font-mono text-slate-500 font-medium">
              <span className="neu-keycap px-1.5 py-0.5 rounded text-slate-700 font-bold">SPACE</span>
              <span>+1</span>
              <span className="mx-1 opacity-40">|</span>
              <span className="neu-keycap px-1.5 py-0.5 rounded text-slate-700 font-bold">ESC</span>
              <span>CLR</span>
            </div>

            {/* Live Session Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl neu-convex-sm text-xs font-mono text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              <span className="text-slate-500 text-[10px]">SESSION</span>
              <span className="font-semibold text-slate-800">{sessionTimeString}</span>
            </div>

            {/* Audio Toggle Button */}
            <button
              onClick={() => setAudioEnabled(a => !a)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl neu-btn flex items-center justify-center text-slate-600 hover:text-cyan-600 active:scale-95 transition-all"
              title={audioEnabled ? "Tactile Audio: Enabled" : "Tactile Audio: Muted"}
              type="button"
              aria-label="Toggle Sound"
            >
              <span className={`material-symbols-outlined text-[19px] sm:text-[20px] ${audioEnabled ? 'text-cyan-600' : 'text-slate-400'}`}>
                {audioEnabled ? 'graphic_eq' : 'volume_off'}
              </span>
            </button>

            {/* Mobile Tab Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl neu-btn flex items-center justify-center text-slate-700 active:scale-95 transition-all"
              type="button"
              aria-label="Toggle Mobile Menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* User Profile Avatar Pill */}
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl neu-convex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Pills (when toggled on mobile) */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-300/60 max-w-7xl mx-auto flex flex-col gap-2 animate-fadeIn">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveNavTab('counter'); setMobileMenuOpen(false); }}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  activeNavTab === 'counter' ? 'neu-sunken text-cyan-700' : 'neu-btn text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">pin</span>
                <span>Counter</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveNavTab('logs'); setMobileMenuOpen(false); }}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  activeNavTab === 'logs' ? 'neu-sunken text-cyan-700' : 'neu-btn text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Logs</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveNavTab('targets'); setMobileMenuOpen(false); }}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  activeNavTab === 'targets' ? 'neu-sunken text-cyan-700' : 'neu-btn text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">flag</span>
                <span>Targets</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveNavTab('config'); setMobileMenuOpen(false); }}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  activeNavTab === 'config' ? 'neu-sunken text-cyan-700' : 'neu-btn text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Config</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-2 py-1 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                SESSION: {sessionTimeString}
              </span>
              <span className="text-[10px] text-cyan-700 font-bold">100% PURE SOFT_UI</span>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN WRAPPER
      ========================================================================== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 flex flex-col gap-5 sm:gap-6">
        
        {/* =========================================================================
            PRESET SELECTOR & TELEMETRY TICKER BAR
        ========================================================================== */}
        <section className="p-3.5 sm:p-4 rounded-3xl neu-convex flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Preset Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0 mr-1">
              <span className="material-symbols-outlined text-[18px] text-cyan-600">tune</span>
              <span>Presets:</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {PRESETS.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    type="button"
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'font-semibold text-cyan-700 neu-sunken'
                        : 'text-slate-500 neu-btn hover:text-slate-800'
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Counters Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl neu-sunken flex items-center gap-2 text-slate-600">
              <span className="text-[11px] text-slate-400">TOTAL:</span>
              <span className="font-bold text-slate-800">{Number(totalClicks).toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl neu-sunken flex items-center gap-2 text-slate-600">
              <span className="text-[11px] text-slate-400">CPS:</span>
              <span className="font-bold text-emerald-600">{currentCPS}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl neu-sunken flex items-center gap-2 text-slate-600">
              <span className="text-[11px] text-slate-400">PEAK:</span>
              <span className="font-bold text-slate-800">{Number(peakValue).toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl neu-convex-sm flex items-center gap-1.5 text-rose-500 font-bold shrink-0">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              <span>14-DAY STREAK</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CORE WORKSPACE GRID: Left (Main Engine) + Right (Inspector & Logs)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: PRIMARY COUNTER ENGINE (Span 7)
          ========================================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            
            {/* THE MASTER DISPLAY CARD */}
            <div className="p-4 sm:p-6 rounded-3xl neu-convex flex flex-col gap-5 sm:gap-6 relative">
              {/* Top Card Meta Ribbon */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl neu-sunken font-bold text-cyan-700">
                    &lt;CounterEngine /&gt;
                  </span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    ID: 0x99A4F // DIRECT_RENDER
                  </span>
                </div>

                {/* Target Chip Label (Editable on click) */}
                <div className="flex items-center gap-2">
                  {goalEditing ? (
                    <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5 neu-sunken px-2 py-0.5 rounded-xl">
                      <span className="text-[10px] text-slate-500">GOAL:</span>
                      <input
                        type="number"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="w-16 bg-transparent text-xs font-mono font-bold text-cyan-700 outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-[10px] text-emerald-600 font-bold px-1 hover:underline">SET</button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGoalEditing(true)}
                      title="Click to customize Target Goal"
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl neu-convex-sm text-slate-700 font-semibold hover:text-cyan-700 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-cyan-600">flag</span>
                      <span>GOAL: {Number(targetGoal).toLocaleString()} [{Math.round(progressPercent)}%]</span>
                    </button>
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                </div>
              </div>

              {/* PRIMARY DEBOSSED SUNKEN READOUT DISPLAY */}
              <div className="relative p-6 sm:p-8 md:p-10 rounded-3xl neu-sunken-deep flex flex-col items-center justify-center overflow-hidden min-h-[220px] sm:min-h-[260px]">
                {/* Floating Indicator Toast */}
                {floatingDelta && (
                  <div
                    key={floatingDelta.id}
                    className={`animate-float-delta pointer-events-none absolute top-3 sm:top-4 right-4 sm:right-6 px-3 py-1 rounded-xl neu-convex text-xs sm:text-sm font-mono font-bold ${
                      floatingDelta.isPos === true
                        ? 'text-emerald-600'
                        : floatingDelta.isPos === false
                        ? 'text-rose-500'
                        : 'text-cyan-700'
                    }`}
                  >
                    {floatingDelta.label}
                  </div>
                )}

                {/* Subheader Metatag with soft glowing LED */}
                <div className="flex items-center gap-2 mb-2 text-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#00b4d8] animate-pulse"></span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Decimal Precision Integer // 64-bit
                  </span>
                </div>

                {/* Massive Digits with Scale Bounce */}
                <div className="my-1 sm:my-2 select-none text-center w-full px-2">
                  <span
                    className={`font-sans fluid-counter-number font-extrabold tracking-tight text-slate-800 leading-none inline-block transition-transform duration-75 ${
                      bounceActive ? 'scale-105' : 'scale-100'
                    }`}
                  >
                    {Number(count).toLocaleString()}
                  </span>
                </div>

                {/* Radix & Sub-LED Readout Pill */}
                <div className="mt-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl neu-convex-xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-500 font-mono text-[10px] sm:text-[11px] font-medium">
                  <span>HEX: <strong className="text-slate-800 font-semibold">{hexString}</strong></span>
                  <span className="opacity-30">|</span>
                  <span className="hidden sm:inline">BIN: <strong className="text-slate-800 font-semibold">{binString}</strong></span>
                  <span className="hidden sm:inline opacity-30">|</span>
                  <span>PARITY: <strong className={isEven ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{isEven ? 'EVEN' : 'ODD'}</strong></span>
                </div>
              </div>

              {/* RECESSED GOAL PROGRESS BAR */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1 font-medium">
                  <span>PROGRESS TOWARDS TARGET {Number(targetGoal).toLocaleString()}</span>
                  <span className="font-bold text-slate-700">{progressPercent.toFixed(2)}%</span>
                </div>
                <div className="h-4 w-full rounded-full neu-sunken p-1 flex items-center">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(6,214,160,0.5)] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* PRIMARY TACTILE PHYSICAL CONTROLS (Convex Buttons) */}
              <div className="flex flex-col gap-4 sm:gap-5 pt-1">
                <div className="grid grid-cols-12 gap-3 sm:gap-4">
                  {/* DECREMENT Push Button */}
                  <button
                    onClick={() => handleDecrement('Mouse Click')}
                    className="col-span-5 py-4 sm:py-5 px-3 sm:px-4 rounded-2xl neu-btn-dec flex flex-col items-center justify-center gap-1 group text-slate-700 hover:text-rose-600 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
                    type="button"
                    aria-label="Decrement Count"
                  >
                    <span className="material-symbols-outlined text-[28px] sm:text-[32px] group-hover:scale-110 group-active:scale-95 transition-transform text-rose-500">
                      remove
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase font-sans">
                      Decrement
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full neu-sunken text-slate-500 group-hover:text-rose-600">
                      - {step} STEP
                    </span>
                  </button>

                  {/* RESET Tactile Knob / Key */}
                  <button
                    onClick={() => handleReset('Button [R]')}
                    className="col-span-2 py-4 px-1 sm:px-2 rounded-2xl neu-btn flex flex-col items-center justify-center gap-1 group text-slate-600 hover:text-amber-600 active:scale-95 transition-all touch-manipulation cursor-pointer"
                    title="Reset Counter [R]"
                    type="button"
                    aria-label="Reset Counter"
                  >
                    <span className="material-symbols-outlined text-[22px] sm:text-[24px] group-hover:rotate-180 transition-transform duration-300 text-amber-500">
                      restart_alt
                    </span>
                    <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider">RESET</span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 font-semibold">[R]</span>
                  </button>

                  {/* INCREMENT Push Button */}
                  <button
                    onClick={() => handleIncrement('Mouse Click')}
                    className="col-span-5 py-4 sm:py-5 px-3 sm:px-4 rounded-2xl neu-btn-inc flex flex-col items-center justify-center gap-1 group text-slate-700 hover:text-emerald-600 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
                    type="button"
                    aria-label="Increment Count"
                  >
                    <span className="material-symbols-outlined text-[28px] sm:text-[32px] group-hover:scale-110 group-active:scale-95 transition-transform text-emerald-500">
                      add
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase font-sans">
                      Increment
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full neu-sunken text-slate-500 group-hover:text-emerald-600">
                      + {step} STEP
                    </span>
                  </button>
                </div>

                {/* STEP DELTA SELECTOR SWITCHES */}
                <div className="p-3 rounded-2xl neu-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-cyan-600">straighten</span>
                    <span>Step Delta:</span>
                  </div>

                  {/* Segmented Tactile Steps */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 5, 10, 50, 100].map((sVal) => {
                      const isSelected = step === sVal;
                      return (
                        <button
                          key={sVal}
                          onClick={() => handleSelectStep(sVal)}
                          type="button"
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? 'neu-sunken text-cyan-700 shadow-inner'
                              : 'neu-btn text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sVal}
                        </button>
                      );
                    })}

                    {/* Custom Input Pill */}
                    <div className="flex items-center rounded-xl neu-convex-xs px-2 py-1 ml-0.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-400 mr-1">CUST:</span>
                      <input
                        className="w-12 bg-transparent border-0 p-0 text-xs font-mono font-bold text-slate-800 text-center focus:ring-0 outline-none"
                        max="100000"
                        min="1"
                        type="number"
                        value={customStepInput}
                        onChange={handleCustomStepInput}
                        aria-label="Custom step input"
                      />
                    </div>
                  </div>
                </div>

                {/* QUICK MATH MODIFIERS ROW */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                  <button
                    onClick={handleDouble}
                    className="py-2.5 px-2 rounded-xl neu-btn text-xs font-mono font-semibold text-slate-700 hover:text-cyan-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                    type="button"
                  >
                    <span className="text-cyan-600 font-bold">×2</span> Double
                  </button>
                  <button
                    onClick={handleHalf}
                    className="py-2.5 px-2 rounded-xl neu-btn text-xs font-mono font-semibold text-slate-700 hover:text-cyan-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                    type="button"
                  >
                    <span className="text-cyan-600 font-bold">÷2</span> Half
                  </button>
                  <button
                    onClick={handleInvert}
                    className="py-2.5 px-2 rounded-xl neu-btn text-xs font-mono font-semibold text-slate-700 hover:text-rose-600 transition-all flex items-center justify-center gap-1 active:scale-95"
                    type="button"
                  >
                    <span className="text-rose-500 font-bold">±</span> Invert
                  </button>
                  <button
                    onClick={handleRound}
                    className="py-2.5 px-2 rounded-xl neu-btn text-xs font-mono font-semibold text-slate-700 hover:text-cyan-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                    type="button"
                  >
                    <span className="text-cyan-600 font-bold">00</span> Round
                  </button>
                  <button
                    onClick={handleRandom}
                    className="col-span-2 sm:col-span-1 py-2.5 px-2 rounded-xl neu-btn text-xs font-mono font-semibold text-slate-700 hover:text-emerald-600 transition-all flex items-center justify-center gap-1 active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-500">casino</span> Rand
                  </button>
                </div>
              </div>

              {/* Bottom Footer Status Stamp */}
              <div className="pt-2 border-t border-slate-300/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  BUFFER STATE: SYNCHRONIZED
                </span>
                <span className="hidden sm:inline font-semibold text-cyan-700">
                  INTERRUPT LATENCY: &lt; 0.4ms
                </span>
              </div>
            </div>

            {/* QUICK SYSTEM HIGHLIGHT PILLS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl neu-convex flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neu-sunken flex items-center justify-center text-cyan-600 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Zero Runtime Bloat</span>
                  <span className="text-[10px] font-mono text-slate-500">Pure Native DOM Ticks</span>
                </div>
              </div>

              {/* Undo Capacity Pill (Interactive Click to Undo!) */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`p-3.5 rounded-2xl neu-convex flex items-center gap-3 text-left transition-all ${
                  undoStack.length > 0 ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-85'
                }`}
                title="Click to Undo Last Action"
              >
                <div className="w-9 h-9 rounded-xl neu-sunken flex items-center justify-center text-rose-500 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Undo Capacity
                    {undoStack.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-600 font-mono">
                        {undoStack.length}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">LIFO Buffer: 50 Steps</span>
                </div>
              </button>

              <div className="p-3.5 rounded-2xl neu-convex flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl neu-sunken flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">offline_bolt</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Offline Persist</span>
                  <span className="text-[10px] font-mono text-slate-500">Auto-saved to Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: STATE INSPECTOR & AUDIT LOG (Span 5)
          ========================================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            
            {/* REACT DEVTOOLS STATE INSPECTOR CARD */}
            <div className="p-4 sm:p-5 rounded-3xl neu-convex flex flex-col gap-4">
              {/* Terminal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg neu-sunken flex items-center justify-center text-cyan-600">
                    <span className="material-symbols-outlined text-[16px]">code</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-tight">
                    React State Inspector
                  </span>
                </div>
                <button
                  onClick={handleCopyCodeSnippet}
                  className="px-3 py-1 rounded-xl neu-btn text-[11px] font-mono font-bold text-cyan-700 hover:text-cyan-900 active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  {copyCodeSuccess ? 'COPIED!' : 'COPY SNIPPET'}
                </button>
              </div>

              {/* Debossed Dark Snippet Well */}
              <div className="p-3.5 sm:p-4 rounded-2xl neu-sunken-dark text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text no-scrollbar">
                <div className="text-slate-400 font-medium pb-1.5">// Live Hook State</div>
                <div>
                  <span className="text-rose-400">const</span> [<span className="text-emerald-400">count</span>, <span className="text-cyan-300">setCount</span>] = <span className="text-sky-300">useState</span>(<span className="text-amber-300 font-bold">{count}</span>);
                </div>
                <div>
                  <span className="text-rose-400">const</span> [<span className="text-emerald-400">step</span>, <span className="text-cyan-300">setStep</span>] = <span className="text-sky-300">useState</span>(<span className="text-amber-300 font-bold">{step}</span>);
                </div>
                <div>
                  <span className="text-rose-400">const</span> [<span className="text-emerald-400">history</span>, <span className="text-cyan-300">dispatch</span>] = <span className="text-sky-300">useReducer</span>(counterReducer, initialTape);
                </div>
              </div>

              {/* Key-Value State Telemetry */}
              <div className="p-3.5 rounded-2xl neu-sunken flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-300/60">
                  <span className="text-slate-500 font-medium">prevCount:</span>
                  <span className="font-bold text-slate-800">{Number(prevCount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-300/60">
                  <span className="text-slate-500 font-medium">renderCycles:</span>
                  <span className="font-bold text-cyan-700">{renderCyclesRef.current}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-300/60">
                  <span className="text-slate-500 font-medium">memoization:</span>
                  <span className="font-bold text-emerald-700 px-2 py-0.5 rounded-full neu-convex-xs text-[10px]">
                    STABLE (USE_MEMO)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">sessionTimeMounted:</span>
                  <span className="font-bold text-slate-700">{sessionTimeString}</span>
                </div>
              </div>
            </div>

            {/* AUDIT EVENT BUFFER CARD */}
            <div className="p-4 sm:p-5 rounded-3xl neu-convex flex flex-col gap-4 flex-1">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg neu-sunken flex items-center justify-center text-cyan-600">
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-tight">
                    Audit Event Buffer
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLogs}
                    className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-mono font-semibold text-slate-600 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
                    type="button"
                    title="Export buffer as CSV"
                  >
                    EXPORT
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-mono font-semibold text-rose-500 hover:text-rose-700 active:scale-95 transition-all cursor-pointer"
                    type="button"
                    title="Flush event buffer"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              {/* Sunken Log Event Stream */}
              <div className="p-3 rounded-2xl neu-sunken-deep flex flex-col gap-2 overflow-y-auto max-h-[300px] sm:max-h-[340px] font-mono text-xs select-none">
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-mono text-xs">
                    [NO EVENTS IN BUFFER]
                  </div>
                ) : (
                  logs.map((item) => {
                    const isPos = item.isPositive;
                    const valColor = isPos === true ? 'text-emerald-600' : isPos === false ? 'text-rose-500' : 'text-cyan-600';
                    const badgeColor = isPos === true ? 'text-cyan-700' : isPos === false ? 'text-rose-600' : 'text-amber-600';

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl neu-convex-xs transition-all hover:bg-white/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-bold shrink-0 ${valColor}`}>{item.deltaStr}</span>
                          <span className={`px-1.5 py-0.5 rounded-md neu-sunken text-[9px] font-bold shrink-0 ${badgeColor}`}>
                            {item.actionType}
                          </span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline truncate">
                            {item.sourceTrigger}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px] sm:text-[11px] shrink-0 ml-2">
                          {item.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Summary Strip */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1 pt-1">
                <span>BUFFER ALLOCATION: {logs.length} / 50</span>
                <span className="font-semibold text-slate-700">SYNC: LOCAL_STORAGE</span>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            BOTTOM SECTION: PHYSICAL KEYCAPS HOTKEYS RIBBON
        ========================================================================== */}
        <section className="p-3.5 sm:p-4 rounded-3xl neu-convex flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase shrink-0">
            <div className="w-8 h-8 rounded-xl neu-sunken flex items-center justify-center text-cyan-600">
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
            </div>
            <span>Tactile Hotkeys:</span>
          </div>

          {/* Keycap Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl neu-sunken">
              <span className="neu-keycap px-2 py-0.5 rounded text-cyan-700 font-bold text-[10px] sm:text-[11px]">SPACE</span>
              <span className="text-slate-600 font-medium text-[11px]">INCREMENT</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl neu-sunken">
              <span className="neu-keycap px-2 py-0.5 rounded text-rose-600 font-bold text-[10px] sm:text-[11px]">SHIFT+SPACE</span>
              <span className="text-slate-600 font-medium text-[11px]">DECREMENT</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl neu-sunken">
              <span className="neu-keycap px-2 py-0.5 rounded text-slate-700 font-bold text-[10px] sm:text-[11px]">R</span>
              <span className="text-slate-600 font-medium text-[11px]">RESET</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl neu-sunken">
              <span className="neu-keycap px-2 py-0.5 rounded text-slate-700 font-bold text-[10px] sm:text-[11px]">1 - 5</span>
              <span className="text-slate-600 font-medium text-[11px]">STEP MULTIPLIER</span>
            </div>
          </div>

          {/* Refined Soft Badge */}
          <div className="hidden xl:flex items-center shrink-0">
            <span className="px-3 py-1.5 rounded-xl neu-convex text-xs font-mono font-bold text-cyan-700">
              100% PURE SOFT_UI
            </span>
          </div>
        </section>

        {/* =========================================================================
            SEO INFORMATIONAL ENGINE & FAQ SECTION (Crawlable by Googlebot)
        ========================================================================== */}
        <section aria-label="About NUMBR Tally Counter" className="p-4 sm:p-6 rounded-3xl neu-convex flex flex-col gap-4 text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl neu-convex flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                <img src="/logo.png" alt="NUMBR Logo" className="w-full h-full object-contain rounded-lg" width="32" height="32" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 uppercase font-mono">
                About NUMBR // Precision Online Tally Runtime
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-semibold px-2 py-0.5 rounded-full neu-sunken">
              SEO_INDEX: ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs font-sans leading-relaxed">
            <article className="p-3.5 rounded-2xl neu-sunken flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Online Tally & Clicker
              </h3>
              <p className="text-slate-600">
                NUMBR is a free digital tally counter and click tracking utility designed for gym reps, habits, inventory audits, and event headcount tracking with zero latency and real-time state telemetry.
              </p>
            </article>

            <article className="p-3.5 rounded-2xl neu-sunken flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Tactile Audio & Haptics
              </h3>
              <p className="text-slate-600">
                Equipped with synthetic Web Audio mechanical clicks and mobile haptic vibration feedback for physical button simulation on any smartphone or tablet.
              </p>
            </article>

            <article className="p-3.5 rounded-2xl neu-sunken flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Radix & Local Storage
              </h3>
              <p className="text-slate-600">
                Full 64-bit integer conversion showcasing hexadecimal (HEX), binary (BIN), parity analysis, customizable step sizes, and instant offline local storage persistence.
              </p>
            </article>
          </div>
        </section>

      </main>

      {/* =========================================================================
          FIXED BOTTOM STATUS BAR
      ========================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#e6ecf4]/95 backdrop-blur-md border-t border-white/60 py-2 px-3 sm:px-6 md:px-8 text-xs font-mono text-slate-500 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-cyan-700 font-medium text-[11px] sm:text-xs">
              <span className="material-symbols-outlined text-[14px] sm:text-[15px]">memory</span>
              <span>SYS_HEAP: 41.2 MB</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px] sm:text-xs">
              <span className="material-symbols-outlined text-[14px] sm:text-[15px]">speed</span>
              <span>THROUGHPUT: {currentCPS} CLICKS/S</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-600 text-xs">
              <span className="material-symbols-outlined text-[15px]">storage</span>
              <span>LOCAL_BUFFER: ACTIVE (LOCAL_STORAGE)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              STATUS: OPERATIONAL
            </span>
            <span className="hidden sm:inline text-slate-400 font-medium">NUMBR ENGINE SOFT_UI v19.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
