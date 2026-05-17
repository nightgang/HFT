import React, { useState, useEffect, useRef, useCallback } from "react";
import { createChart } from "lightweight-charts";
import {
  LayoutDashboard, Terminal, Zap, Wallet, Target, Briefcase,
  FileText, History, BarChart3, Brain, Activity,
  TrendingUp, TrendingDown, DollarSign, Shield,
  Wifi, WifiOff, ChevronRight, ChevronLeft,
  RefreshCw, Lock, ChevronDown, Menu, X, AlertCircle, Bell,
  CheckCircle, Server, Globe, LineChart, Play,
  Radar, Square, Pause, Flame, Crosshair, Copy,
  Gauge, Layers, PieChart, Eye, EyeOff, Download,
  Settings // Added missing import for Settings icon
} from "lucide-react";
import {
  useGetActiveTrades,
  useGetSystemStatus,
  useRealtimeDashboardData,
} from "../hooks";

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS & DATA
   ══════════════════════════════════════════════════════════════════════════ */

const NEON = {
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  green: "#00FF9D",
  red: "#FF3B3B",
  amber: "#FBBF24",
};

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trading", label: "Trading", icon: Zap },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "sniper", label: "Sniper", icon: Target },
  { id: "positions", label: "Positions", icon: Briefcase },
  { id: "orders", label: "Orders", icon: FileText },
  { id: "history", label: "History", icon: History },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "signals", label: "Signals", icon: Brain },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "plugins", label: "Plugins", icon: Activity },
];

const STATS = [
  { label: "Total PnL", value: "$18,742.60", change: "+7.8%", up: true },
  { label: "Win Rate", value: "86.3%", change: "+4.2%", up: true },
  { label: "Total Volume", value: "$127.4K", change: "+12.5%", up: true },
  { label: "Network Latency", value: "12 ms", change: "Optimal", up: null },
  { label: "RPC Health", value: "99.2%", change: "All green", up: true },
  { label: "Active Signals", value: "7", change: "Live", up: null },
];

const FLEET_TABS = [
  { key: "buy", label: "Buy", color: "#22C55E" },
  { key: "sell", label: "Sell", color: "#EF4444" },
];

const WALLET_DATA = [
  { asset: "SOL", bal: "12.45", chg: "+3.2%", up: true },
  { asset: "USDC", bal: "4,281", chg: "—", up: null },
  { asset: "HFT", bal: "84.2K", chg: "+12.1%", up: true },
  { asset: "RAY", bal: "142", chg: "-2.4%", up: false },
];

const MONITORING = [
  { label: "RPC Latency", value: "12", unit: "ms", Icon: Server, color: "#06B6D4", status: "Optimal" },
  { label: "Network Congestion", value: "32%", unit: null, Icon: Globe, color: "#F59E0B", status: "Moderate" },
  { label: "Order Book Depth", value: "$4.2M", unit: null, Icon: LineChart, color: "#8B5CF6", status: "Deep" },
  { label: "Pending Alerts", value: "3", unit: null, Icon: AlertCircle, color: "#EF4444", status: "High" },
];

const SIGNALS = [
  { label: "Whale signal", yellow: false, detail: "2.3 k SOL moved", color: "#86efac" },
  { label: "Momentum shift", yellow: false, detail: "Strong bullish", color: "#a5f3fc" },
  { label: "Mempool activity", yellow: true, detail: "12 tx / sec", color: "#fde047" },
  { label: "Slippage risk", yellow: false, detail: "0.2% avg", color: "#94a3b8" },
];

const CC_MARKET = [
  { label: "24h Change", value: "+211%", color: "#22C55E" },
  { label: "24h High", value: "0.00115", color: "#06B6D4" },
  { label: "24h Low", value: "0.00042", color: "#F59E0B" },
  { label: "Volume", value: "12.8M", color: "#8B5CF6" },
];

const PNL_PERIODS = ["day", "week", "month", "year"];

const PORTFOLIO_SUMMARY = [
  { label: "Total Value", value: "$124,582.40", icon: Wallet, color: "#06B6D4" },
  { label: "24h Change", value: "+$3,241.20", icon: TrendingUp, color: "#22C55E" },
  { label: "Win Rate", value: "86.3%", icon: BarChart3, color: "#8B5CF6" },
  { label: "Open Positions", value: "7", icon: Target, color: "#F59E0B" },
];

const TIME_FRAMES = ["1s", "5s", "15s", "1m", "5m", "15m", "1h", "4h"];
const TRADING_PAIRS = ["SOL/USDC", "BONK/USDC", "JTO/USDC", "ORCA/USDC"];

/* ══════════════════════════════════════════════════════════════════════════
   CHART HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

function buildCandles(count = 90, base = 0.00091, seed = 42) {
  let r = seed;
  const rng = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 0xffffffff; };
  const data = [];
  const now = Date.now();
  let price = base;
  for (let i = count; i >= 0; i--) {
    const drift = (rng() - 0.5) * 0.00008;
    const open = price;
    const close = Math.max(open + drift, 0.00025);
    const rng2 = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 0xffffffff; };
    const hi = Math.max(open, close) + rng2() * 0.00004;
    const lo = Math.min(open, close) - rng2() * 0.00004;
    data.push({ time: Math.floor((now - i * 60_000) / 1000), open: +open.toFixed(8), high: +hi.toFixed(8), low: +lo.toFixed(8), close: +close.toFixed(8) });
    price = close;
  }
  return data;
}

function buildVolume(candles) {
  return candles.map((c) => ({
    time: c.time,
    value: +(Math.random() * 2e6 + 2e5).toFixed(0),
    color: c.close >= c.open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

// 14 · SECTION LABEL
const SectionLabel = ({ label, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <span className="section-heading" style={{ fontSize: "0.6875rem", marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
      {label}
    </span>
    {right}
  </div>
);

// 11 · MONITORING CARD
const MonitorCard = ({ label, value, unit, Icon, color, status }) => (
  <div className="monitor-card">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span className="monitor-label">{label}</span>
      <Icon size={15} style={{ color: color, opacity: 0.65 }} />
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span className="monitor-main" style={{ color: color }}>{value}</span>
      {unit && <span className="monitor-sub">{unit}</span>}
    </div>
    <span className="pill" style={{ alignSelf: "flex-start", padding: "3px 10px", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.06em", color: color, background: `${color}12`, border: `1px solid ${color}28` }}>
      {status}
    </span>
  </div>
);

// 13 · STATS CARD
const StatCard = ({ label, value, change, up }) => {
  const isUp = up === true;
  const isNeutral = up === null;
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${isNeutral ? "flat" : isUp ? "up" : "down"}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: "0.75rem", fontWeight: 600 }}>
          {!isNeutral && (isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
          {change}
        </div>
      )}
    </div>
  );
};

// 16 · INSIGHT ROW
const InsightRow = ({ label, detail, color }) => ( // Changed pulseColor to color for consistency
  <div className="feed-row">
    <div>
      <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#F1F5F9" }}>{label}</div>
      <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: 1 }}>{detail}</div>
    </div>
    <span className="live-dot" style={{ background: color || "#94a3b8" }} />
  </div>
);

// 17 · WALLET ROW
const WalletRow = ({ asset, bal, chg, up }) => (
  <div className="feed-row">
    <div>
      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#F1F5F9" }}>{asset}</div>
      <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: 1 }}>Balance</div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#F1F5F9" }}>{bal}</div>
      <div style={{ fontSize: "0.75rem", color: up === null ? "#64748b" : up === true ? "#22c55e" : "#ef4444" }}>{chg}</div>
    </div>
  </div>
);


/* ══════════════════════════════════════════════════════════════════════════
   THIS DASHBOARD — accepts optional `dashboardConfig` prop (forward-compat)
   ══════════════════════════════════════════════════════════════════════════ */

const Dashboard = ({ dashboardConfig = {} }) => {
  // ── Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── Viewport detection
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const up = () => setIsMobile(window.innerWidth < 768);
    up();
    window.addEventListener("resize", up);
    return () => window.removeEventListener("resize", up);
  }, []);

  // ── Data
  const { data: activeTradesData = [] } = useGetActiveTrades();
  const { data: systemStatusData } = useGetSystemStatus();
  const realtime = useRealtimeDashboardData();
  const activeTrades = realtime.activeTrades ?? activeTradesData;
  const systemStatus = realtime.systemStatus ?? systemStatusData;

  // ── Clock
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1_000); return () => clearInterval(t); }, []);

  // ── Escape key closes mobile drawer
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     1 · CYBERPUNK GRID BACKGROUND  (inline — no sub-component import)
     ══════════════════════════════════════════════════════════════════════ */
  const CyberpunkBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          mixBlendMode: "overlay",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${NEON.cyan}11 40%, transparent 80%)` }}
      />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
      <div
        className="absolute inset-0 opacity-6"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='0.06'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     2 · STATUS BAR  (Cyberpunk / StatusBar component features)
     ══════════════════════════════════════════════════════════════════════ */
  const StatusBar = ({ realtime }) => {
    // These metrics should ideally come from `realtime` or `systemStatus` props
    // For a zero-error build and dynamic feel, we'll keep some internal state for demonstration
    const [metrics, setMetrics] = useState({
      botStatus: "SCANNING",
      latency: 2.3,
      rpcHealth: "healthy",
      walletBalance: { sol: 42.5, usdc: 12500.0 },
      tps: 1200,
      strategiesActive: 3,
      timestamp: new Date(),
    });

    useEffect(() => {
      // If realtime data is available, prioritize it
      if (realtime.systemStatus) {
        setMetrics(prev => ({
          ...prev,
          botStatus: realtime.systemStatus.botStatus || prev.botStatus,
          latency: realtime.systemStatus.latency || prev.latency,
          rpcHealth: realtime.systemStatus.rpcHealth || prev.rpcHealth,
          walletBalance: realtime.systemStatus.walletBalance || prev.walletBalance,
          tps: realtime.systemStatus.tps || prev.tps,
          strategiesActive: realtime.systemStatus.strategiesActive || prev.strategiesActive,
        }));
      }

      const interval = setInterval(() => {
        setMetrics((prev) => ({
          ...prev,
          latency: Math.max(0.5, Math.min(50, prev.latency + (Math.random() - 0.5) * 2)),
          tps: Math.max(100, Math.min(4000, prev.tps + (Math.random() - 0.5) * 300)),
          walletBalance: {
            sol: prev.walletBalance.sol + (Math.random() - 0.5) * 0.1,
            usdc: prev.walletBalance.usdc + (Math.random() - 0.5) * 50,
          },
          timestamp: new Date(),
        }));
      }, 1500);
      return () => clearInterval(interval);
    }, [realtime.systemStatus]); // Depend on realtime.systemStatus

    const botStatus = realtime.systemStatus?.botStatus || metrics.botStatus;
    const latency = realtime.systemStatus?.latency || metrics.latency;
    const rpcHealth = realtime.systemStatus?.rpcHealth || metrics.rpcHealth;
    const walletSol = realtime.systemStatus?.walletBalance?.sol || metrics.walletBalance.sol;
    const walletUsdc = realtime.systemStatus?.walletBalance?.usdc || metrics.walletBalance.usdc;
    const tps = realtime.systemStatus?.tps || metrics.tps;
    const strategiesActive = realtime.systemStatus?.strategiesActive || metrics.strategiesActive;
    const timestamp = metrics.timestamp; // Use internal state for clock for smoother updates

    const statusColors = { ONLINE: "#00FF9D", SCANNING: NEON.cyan, EXECUTING: NEON.purple, IDLE: NEON.amber };
    const rpcColors = { healthy: "text-green-400 bg-green-400/10", degraded: "text-amber-400 bg-amber-400/10", down: "text-red-400 bg-red-400/10" };
    const botColor = statusColors[botStatus] || NEON.amber;

    return (
      <div
        className="w-full bg-gradient-to-br from-black/40 via-black/25 to-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all hover:border-white/20"
        style={{ boxShadow: `0 20px 60px ${NEON.cyan}14`, borderLeft: `2px solid rgba(139,92,246,0.12)` }}
      >
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-[11px] font-mono">
          {/* Bot Status */}
          <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${botStatus !== "IDLE" ? "animate-pulse" : ""}`}
              style={{ backgroundColor: botColor, boxShadow: `0 0 8px ${botColor}` }} />
            <div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wider">BOT</div>
              <div className="font-bold" style={{ color: botColor }}>{botStatus}</div>
            </div>
          </div>

          {/* Latency */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">LATENCY</div>
            <div className="text-[#22D3EE] text-sm font-bold">{latency.toFixed(1)}ms</div>
          </div>

          {/* RPC Health */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">RPC HEALTH</div>
            <div className={`px-2 py-1 rounded text-center text-xs font-semibold ${rpcColors[rpcHealth] || ""}`}>
              ✓ {rpcHealth.toUpperCase()}
            </div>
          </div>

          {/* Wallet */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">WALLET</div>
            <div className="text-[#00FF9D] font-semibold">{walletSol.toFixed(2)} SOL</div>
            <div className="text-[10px] text-[#8B5CF6] font-semibold">${walletUsdc.toFixed(0)}</div>
          </div>

          {/* TPS */}
          <div className="p-3 bg-black/30 rounded-lg sm:col-span-2 md:col-span-1">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">NETWORK TPS</div>
            <div className="text-[#FBBF24] text-sm font-bold">{Math.floor(tps)}</div>
          </div>

          {/* Strategies */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">STRATEGIES</div>
            <div className="text-purple-400 text-sm font-bold">{strategiesActive}</div>
          </div>

          {/* Time */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">TIME</div>
            <div className="text-[#22D3EE] text-sm font-bold">{timestamp.toLocaleTimeString()}</div>
          </div>
        </div>
        <div className="mt-3 px-4 py-3 bg-black/10 border-t border-white/10 rounded-b-3xl flex flex-wrap gap-2 text-[10px] text-gray-400">
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">AI {realtime.aiPredictions?.length ?? 0}</span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Arb {realtime.arbitrageSignals?.length ?? 0}</span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Smart {realtime.smartMoneySignals?.length ?? 0}</span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Price {realtime.priceUpdates?.length ?? 0}</span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Retry {realtime.tradeRetries?.length ?? 0}</span>
        </div>
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     3 · CONTROL PANEL  (Bot start/stop, kill switch, strategy, risk)
     ══════════════════════════════════════════════════════════════════════ */
  const ControlPanel = () => {
    const [botRunning, setBotRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState("sniper");
    const [riskSettings, setRiskSettings] = useState({ maxDrawdown: 5, positionSize: 50, slippage: 0.5, gasPriority: "high" });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const strategies = [
      { id: "sniper", label: "SNIPER", icon: Crosshair },
      { id: "arbitrage", label: "ARBITRAGE", icon: Zap },
      { id: "momentum", label: "MOMENTUM", icon: TrendingUp },
      { id: "mev", label: "MEV SHIELD", icon: Lock },
    ];

    const emergencyStop = useCallback(() => { setBotRunning(false); setPaused(false); }, []);

    return (
      <div
        className="w-full border border-white/10 bg-gradient-to-br from-black/40 via-black/20 to-black/40 backdrop-blur-xl rounded-2xl lg:rounded-3xl overflow-hidden transition-all hover:border-purple-400/20"
        style={{ boxShadow: `0 20px 60px ${NEON.purple}14` }}
      >
        <div className="p-4 md:p-6 space-y-6">
          <div className="text-center border-b border-cyan-500/20 pb-4">
            <h2 className="text-cyan-400 font-mono font-bold text-base md:text-lg">Control Center</h2>
            <p className="text-xs text-gray-500 mt-1">Command &amp; Strategy</p>
          </div>

          {/* Bot start / stop */}
          <div className="space-y-3">
            <button
              onClick={() => setBotRunning(!botRunning)}
              className="w-full py-3 px-4 rounded-lg font-mono text-sm font-bold text-[#041018]"
              style={{
                background: botRunning
                  ? `linear-gradient(135deg, ${NEON.red}, rgba(255,59,59,0.8))`
                  : `linear-gradient(135deg, ${NEON.green}, rgba(0,255,157,0.8))`,
                boxShadow: botRunning
                  ? `0 12px 30px ${NEON.red}55, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : `0 12px 30px ${NEON.green}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {botRunning ? <Square size={16} /> : <Play size={16} />}
                {botRunning ? "STOP BOT" : "START BOT"}
              </div>
            </button>

            {botRunning && (
              <button
                onClick={() => setPaused(!paused)}
                className={`w-full py-3 px-4 rounded-lg font-mono text-sm font-bold transition-all ${
                  paused
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-600/30"
                    : "bg-amber-600/20 text-amber-300 border border-amber-400/50 hover:bg-amber-600/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                  {paused ? "RESUME" : "PAUSE"}
                </div>
              </button>
            )}
          </div>

          {/* Kill switch */}
          <button
            onClick={emergencyStop}
            className="w-full py-4 px-4 rounded-lg font-mono text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: `radial-gradient(circle at 25% 25%, rgba(255,59,59,0.95), ${NEON.red})`,
              boxShadow: `0 16px 48px ${NEON.red}66, inset 0 1px 0 rgba(255,255,255,0.1)`,
              border: "1px solid rgba(255,59,59,0.2)",
            }}
          >
            <Flame size={18} /> Kill Switch
          </button>

          {/* Strategy selector */}
          <div className="border-t border-cyan-500/20 pt-6">
            <h3 className="text-cyan-400 text-xs font-bold uppercase mb-3">Select Strategy</h3>
            <div className="grid grid-cols-2 gap-2">
              {strategies.map((strategy) => {
                const Icon = strategy.icon;
                return (
                  <button
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy.id)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 text-xs font-mono ${
                      selectedStrategy === strategy.id
                        ? "bg-purple-500/30 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20"
                        : "bg-black/40 border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline text-[10px]">{strategy.label}</span>
                    <span className="sm:hidden text-[10px]">{strategy.label.substring(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk settings */}
          <div className="border-t border-cyan-500/20 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-cyan-400 text-xs font-bold uppercase">Risk Settings</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-purple-400 hover:text-purple-300"
                aria-label="Toggle risk settings"
              >
                <ChevronDown size={16} style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-3">
                {/* Max drawdown */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Max Drawdown</label>
                    <span className="text-amber-400 text-xs font-bold">{riskSettings.maxDrawdown}%</span>
                  </div>
                  <input
                    type="range" min="1" max="20"
                    value={riskSettings.maxDrawdown}
                    onChange={(e) => setRiskSettings({ ...riskSettings, maxDrawdown: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Position size */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Position Size</label>
                    <span className="text-green-400 text-xs font-bold">{riskSettings.positionSize}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100"
                    value={riskSettings.positionSize}
                    onChange={(e) => setRiskSettings({ ...riskSettings, positionSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-green-400 cursor-pointer"
                  />
                </div>

                {/* Max slippage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Max Slippage</label>
                    <span className="text-cyan-400 text-xs font-bold">{riskSettings.slippage}%</span>
                  </div>
                  <input
                    type="range" min="0.1" max="5" step="0.1"
                    value={riskSettings.slippage}
                    onChange={(e) => setRiskSettings({ ...riskSettings, slippage: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Gas priority */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Gas Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["low", "medium", "high"].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setRiskSettings({ ...riskSettings, gasPriority: priority })}
                        className={`py-1 rounded text-xs font-mono transition-all ${
                          riskSettings.gasPriority === priority
                            ? "bg-purple-500/40 text-purple-300 border border-purple-400"
                            : "bg-black/40 text-gray-400 border border-gray-600 hover:border-purple-400"
                        }`}
                      >
                        {priority.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatRealtimeTimestamp = (value) => {
    const timestamp = value || value === 0 ? new Date(value) : null;
    const date = timestamp instanceof Date && !isNaN(timestamp) ? timestamp : new Date(); // Fallback to current date
    return date instanceof Date && !isNaN(date) ? date.toLocaleTimeString() : new Date().toLocaleTimeString();
  };

  const RealtimePanel = ({ title, count, children }) => {
    if (count === 0) return null; // Only render if there are items
    return (
      <div className="w-80 max-w-full">
        <div className="bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400 font-mono">{title}</div>
            <div className="text-[10px] text-gray-500">{count}</div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  };

  const RealtimeSummaryPanel = () => {
    const aiCount = realtime.aiPredictions?.length || 0;
    const arbCount = realtime.arbitrageSignals?.length || 0;
    const smartCount = realtime.smartMoneySignals?.length || 0;
    const priceCount = realtime.priceUpdates?.length || 0;
    const retryCount = realtime.tradeRetries?.length || 0;
    const totalCount = aiCount + arbCount + smartCount + priceCount + retryCount;

    if (totalCount === 0) return null;

    return (
      <div className="feed-card">
        <SectionLabel label="Realtime Summary" right={<span className="pill">Live</span>} />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">AI Signals</div>
            <div className="text-lg font-bold text-white">{aiCount}</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Arbitrage</div>
            <div className="text-lg font-bold text-white">{arbCount}</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Smart Money</div>
            <div className="text-lg font-bold text-white">{smartCount}</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Price Updates</div>
            <div className="text-lg font-bold text-white">{priceCount}</div>
          </div>
          <div className="col-span-2 bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Retry Events</div>
            <div className="text-lg font-bold text-white">{retryCount}</div>
          </div>
        </div>
      </div>
    );
  };

  const AiPredictionsPanel = () => {
    const aiPredictions = realtime.aiPredictions || [];
    return (
      <RealtimePanel title="AI Predictions" count={aiPredictions.length}>
        {aiPredictions.map((p, idx) => (
          <div key={p.tokenMint || idx} className="p-2 bg-black/30 rounded-md flex items-start gap-2">
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{p.tokenMint || p.token || 'UNKNOWN'}</div>
              <div className="text-xs text-gray-300">{p.recommendation || p.model || ''} — score {p.score ?? p.data?.score ?? 'N/A'}</div>
            </div>
            <div className="text-right text-xs text-gray-400">{formatRealtimeTimestamp(p.timestamp || p.receivedAt)}</div>
          </div>
        ))}
      </RealtimePanel>
    );
  };

  const ArbitrageSignalsPanel = () => {
    const arbitrageSignals = realtime.arbitrageSignals || [];
    return (
      <RealtimePanel title="Arbitrage Signals" count={arbitrageSignals.length}>
        {arbitrageSignals.map((signal, idx) => (
          <div key={signal.id || signal.tokenMint || idx} className="p-2 bg-black/30 rounded-md">
            <div className="text-sm font-semibold text-white">{signal.tokenMint || signal.mint || signal.token || 'UNKNOWN'}</div>
            <div className="text-xs text-gray-300">Route: {signal.route || 'unknown'}</div>
            <div className="text-xs text-gray-300">Spread: {signal.spread != null ? `${(signal.spread * 100).toFixed(2)}%` : 'N/A'}</div>
            <div className="text-right text-[10px] text-gray-500">{formatRealtimeTimestamp(signal.timestamp || signal.receivedAt || signal.createdAt)}</div>
          </div>
        ))}
      </RealtimePanel>
    );
  };

  const SmartMoneySignalsPanel = () => {
    const smartMoneySignals = realtime.smartMoneySignals || [];
    return (
      <RealtimePanel title="Smart Money" count={smartMoneySignals.length}>
        {smartMoneySignals.map((signal, idx) => (
          <div key={signal.id || signal.walletAddress || signal.tokenMint || idx} className="p-2 bg-black/30 rounded-md">
            <div className="text-sm font-semibold text-white">{signal.walletAddress || signal.tokenMint || signal.token || 'UNKNOWN'}</div>
            <div className="text-xs text-gray-300">Score: {signal.smartSignalScore || signal.score || 'N/A'}</div>
            <div className="text-xs text-gray-300">{signal.recommendation || 'No recommendation'}</div>
            <div className="text-right text-[10px] text-gray-500">{formatRealtimeTimestamp(signal.timestamp || signal.receivedAt || signal.createdAt)}</div>
          </div>
        ))}
      </RealtimePanel>
    );
  };

  const PriceUpdatesPanel = () => {
    const priceUpdates = realtime.priceUpdates || [];
    return (
      <RealtimePanel title="Price Updates" count={priceUpdates.length}>
        {priceUpdates.map((update, idx) => (
          <div key={update.id || update.tokenMint || update.mint || update.token || idx} className="p-2 bg-black/30 rounded-md">
            <div className="text-sm font-semibold text-white">{update.tokenMint || update.mint || update.token || 'UNKNOWN'}</div>
            <div className="text-xs text-gray-300">Price: {update.price != null ? `$${update.price}` : 'N/A'}</div>
            <div className="text-right text-[10px] text-gray-500">{formatRealtimeTimestamp(update.timestamp || update.receivedAt || update.createdAt)}</div>
          </div>
        ))}
      </RealtimePanel>
    );
  };

  const TradeRetriesPanel = () => {
    const tradeRetries = realtime.tradeRetries || [];
    return (
      <RealtimePanel title="Trade Retries" count={tradeRetries.length}>
        {tradeRetries.map((retry, idx) => {
          const trade = retry.trade || retry.data?.trade || retry.data || retry;
          return (
            <div key={retry.id || trade.id || idx} className="p-2 bg-black/30 rounded-md">
              <div className="text-sm font-semibold text-white">{trade.tokenMint || trade.mint || trade.token || 'UNKNOWN'}</div>
              <div className="text-xs text-gray-300">Reason: {retry.reason || trade.reason || 'Retry triggered'}</div>
              <div className="text-right text-[10px] text-gray-500">{formatRealtimeTimestamp(retry.timestamp || retry.receivedAt || retry.createdAt)}</div>
            </div>
          );
        })}
      </RealtimePanel>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     4 · MAIN PANEL  (trading chart, order flow, liquidity zones)
     ══════════════════════════════════════════════════════════════════════ */
  const MainPanel = () => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candlestickSeriesRef = useRef(null);
    const histogramSeriesRef = useRef(null);

    const [selectedPair, setSelectedPair] = useState("SOL/USDC");
    const [timeframe, setTimeframe] = useState("1m");

    useEffect(() => {
      if (!chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { color: "transparent" }, textColor: "#64748b" },
        grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
        timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
      });

      const candles = buildCandles();
      const newCandlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e", downColor: "#ef4444", borderVisible: false,
        wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      });
      newCandlestickSeries.setData(candles);
      candlestickSeriesRef.current = newCandlestickSeries;

      const newHistogramSeries = chart.addHistogramSeries({ color: "#8B5CF6", priceFormat: { type: "volume" } });
      newHistogramSeries.setData(buildVolume(candles));
      histogramSeriesRef.current = newHistogramSeries;

      chart.timeScale().fitContent();
      chartRef.current = chart;

      const ro = new ResizeObserver(() => {
        if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      });
      ro.observe(chartContainerRef.current);

      return () => { ro.disconnect(); chart.remove(); chartRef.current = null; candlestickSeriesRef.current = null; histogramSeriesRef.current = null; };
    }, []);

    const handleRefresh = () => {
      if (!chartRef.current || !candlestickSeriesRef.current || !histogramSeriesRef.current) return;
      const candles = buildCandles();
      candlestickSeriesRef.current.setData(candles);
      histogramSeriesRef.current.setData(buildVolume(candles));
      chartRef.current.timeScale().fitContent();
    };

    return (
      <div
        className="flex-1 flex flex-col border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl lg:rounded-3xl overflow-hidden transition-all"
        style={{ boxShadow: `0 30px 90px 6px rgba(0,0,0,0.5)` }}
      >
        {/* Chart top bar */}
        <div className="border-b border-cyan-500/20 px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-black/40">
          <div className="flex flex-wrap gap-2">
            {TRADING_PAIRS.map((pair) => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  selectedPair === pair
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400"
                    : "bg-black/50 text-gray-400 border border-gray-700 hover:border-cyan-400"
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            {TIME_FRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                  timeframe === tf
                    ? "bg-purple-500/30 text-purple-300"
                    : "bg-black/50 text-gray-400 hover:text-purple-300"
                }`}
              >
                {tf}
              </button>
            ))}
            <button onClick={handleRefresh} className="text-cyan-400 hover:text-cyan-300 ml-1" aria-label="Refresh chart">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Order Flow + Liquidity Zones */}
        <div className="p-4 border-b border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Order Flow</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#00FF9D]">BUY 68%</span>
                <span className="text-sm font-semibold text-[#FF3B3B]">SELL 32%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00FF9D] via-[#22D3EE] to-[#FF3B3B]" style={{ width: "68%" }} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Liquidity Zones</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-cyan-300">High</span>
                <span className="text-sm text-gray-400">3 zones</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="rounded-full bg-white/5 px-2 py-1">Bid wall at 0.0009</div>
                <div className="rounded-full bg-white/5 px-2 py-1">Ask wall at 0.0011</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart canvas */}
        <div className="flex-1 p-4 min-h-[320px]">
          <div className="w-full h-full rounded-lg border bg-black/60 backdrop-blur-sm overflow-hidden relative"
            style={{ borderColor: "rgba(34,211,238,0.06)", minHeight: 320 }}
          >
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-20" />
              <div className="absolute left-1/2 top-10 w-96 h-48 rounded-lg mix-blend-overlay opacity-20"
                style={{ background: `radial-gradient(circle at 30% 30%, #00FF9D33, transparent 30%), linear-gradient(90deg, #FF3B3B12, #22D3EE12)` }} />
              <div className="absolute right-8 bottom-16 text-xs text-[#00FF9D] font-bold animate-pulse">BUY</div>
              <div className="absolute left-8 bottom-24 text-xs text-[#FF3B3B] font-bold animate-pulse">SELL</div>
            </div>
          </div>
        </div>

        {/* Market info footer */}
        <div className="px-4 md:px-6 py-3 border-t border-cyan-500/20 bg-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div><span className="text-gray-400">24H HIGH</span><div className="text-green-400 font-bold">0.00115</div></div>
          <div><span className="text-gray-400">24H LOW</span><div className="text-red-400 font-bold">0.00042</div></div>
          <div><span className="text-gray-400">VOLUME</span><div className="text-cyan-400 font-bold">12.8M</div></div>
          <div><span className="text-gray-400">24H CHANGE</span><div className="text-green-400 font-bold">+211%</div></div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     5 · LIVE DATA STREAM  (real-time market events)
     ══════════════════════════════════════════════════════════════════════ */
  const LiveDataStream = () => {
    const [events, setEvents] = useState([
      { id: 1, type: "whale", text: "Whale moved 500 SOL → FEX9wD", time: "00:12:45", color: "purple" },
      { id: 2, type: "token", text: "New Token: MEME (Liq 18 SOL)", time: "00:11:30", color: "amber" },
      { id: 3, type: "swap", text: "Large Swap: 1000 BONK → 12.5 SOL", time: "00:10:15", color: "cyan" },
    ]);

    useEffect(() => {
      const interval = setInterval(() => {
        const texts = [
          "Whale moved 250 SOL → New Wallet",
          "New Token launched: 10M supply",
          "Arbitrage opportunity detected",
          "MEV opportunity in mempool",
        ];
        const colors = ["purple", "amber", "cyan", "green"];
        const types = ["whale", "token", "swap", "mev"];
        const idx = Math.floor(Math.random() * 4);
        setEvents((prev) => [{
          id: Date.now(),
          type: types[idx],
          text: texts[idx],
          time: new Date().toLocaleTimeString(),
          color: colors[idx],
        }, ...(prev || []).slice(0, 14)]);
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    const colorMap = {
      purple: "border-l-purple-500 text-purple-300",
      amber: "border-l-amber-500  text-amber-300",
      cyan: "border-l-cyan-500   text-cyan-300",
      green: "border-l-green-500  text-green-300",
      red: "border-l-red-500    text-red-300",
    };

    return (
      <div
        className="w-full border-l bg-black/20 backdrop-blur-3xl flex flex-col overflow-hidden rounded-3xl"
        style={{ borderLeft: "1px solid rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.cyan}14` }}
      >
        <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Radar size={14} className="text-cyan-500 animate-pulse" /> LIVE DATA STREAM
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time market intelligence</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs text-[#22D3EE]">
          {events.map((event) => (
            <div key={event.id}
              className={`p-3 border-l-4 bg-black/40 rounded-r-lg ${colorMap[event.color] || colorMap.cyan} hover:bg-black/60 transition-all cursor-pointer`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">{event.text}</div>
                <span className="text-gray-500 flex-shrink-0">{event.time}</span>
              </div>
            </div>
          ))}
          <div className="mt-4 text-cyan-400 font-mono">&gt; <span className="animate-pulse">_</span></div>
        </div>
        <div className="border-t border-cyan-500/20 px-4 py-3 bg-black/60 text-xs text-gray-500 flex items-center justify-between">
          <span>Connected • Live</span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     6 · MEMPOOL TRANSACTION VIEWER
     ══════════════════════════════════════════════════════════════════════ */
  const MempoolViewer = () => {
    const [mempool, setMempool] = useState([
      { id: 1, hash: "3hX9d...8Zq2", from: "Auth...Q7nK", to: "Prog...5L9Z", amount: "2.5 SOL", fee: 0.00005, priority: "critical", status: "pending", timestamp: "14:23:45" },
      { id: 2, hash: "7mK2w...5Ry4", from: "User...A3kP", to: "Auth...Q7nK", amount: "12.0 USDC", fee: 0.00003, priority: "high", status: "confirmed", timestamp: "14:23:40" },
      { id: 3, hash: "9pL4x...2Xy1", from: "Bot...Z8Qr", to: "Prog...5L9Z", amount: "50 BONK", fee: 0.00001, priority: "low", status: "pending", timestamp: "14:23:35" },
    ]);

    useEffect(() => {
      const interval = setInterval(() => {
        setMempool((prev) => {
          const newTx = {
            id: Date.now(),
            hash: `${Math.random().toString(36).substr(2, 5)}...${Math.random().toString(36).substr(2, 4)}`,
            from: `${Math.random() > 0.5 ? "Bot" : "User"}...${Math.random().toString(36).substr(2, 4)}`,
            to: `${Math.random() > 0.5 ? "Auth" : "Prog"}...${Math.random().toString(36).substr(2, 4)}`,
            amount: `${(Math.random() * 100).toFixed(1)} ${Math.random() > 0.5 ? "SOL" : "USDC"}`,
            fee: (Math.random() * 0.0001).toFixed(5),
            priority: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)],
            status: ["pending", "confirmed"][Math.floor(Math.random() * 2)],
            timestamp: new Date().toLocaleTimeString(),
          };
          return [newTx, ...(prev || []).slice(0, 7)];
        });
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    const priorityStyles = {
      low: "border-l-gray-500 text-gray-300",
      medium: "border-l-amber-500 text-amber-300",
      high: "border-l-purple-500 text-purple-300",
      critical: "border-l-red-500 text-red-300",
    };

    return (
      <div
        className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
        style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.cyan}14` }}
      >
        <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Layers size={14} className="text-cyan-500" /> MEMPOOL VIEWER
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time transaction monitoring</p>
        </div>
        <div className="max-h-64 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
          {mempool.map((tx) => (
            <div key={tx.id}
              className={`p-2 border-l-4 rounded-r bg-black/40 hover:bg-black/60 transition-all cursor-pointer ${priorityStyles[tx.priority] || priorityStyles.low}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-cyan-300 font-bold">{tx.hash}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full inline-block ${tx.status === "confirmed" ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-gray-500">{tx.timestamp}</span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2 text-[10px] text-gray-400">
                <span>{tx.from} → {tx.to}</span>
                <span className="text-green-400">{tx.amount}</span>
                <span className="text-purple-300">Fee: {tx.fee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     7 · COPY TRADING SIGNAL FEED
     ══════════════════════════════════════════════════════════════════════ */
  const CopyTradingFeed = () => {
    const [signals, setSignals] = useState([
      { id: 1, trader: "🐋 WhaleMaster", action: "BUY", token: "BONK", amount: "500K", confidence: 94, pnl: "+$2,450", followers: 1284, timestamp: "14:23:45" },
      { id: 2, trader: "⚡ MomentumKing", action: "BUY", token: "JTO", amount: "2000", confidence: 87, pnl: "+$1,120", followers: 892, timestamp: "14:23:30" },
      { id: 3, trader: "🔥 AlphaBot", action: "SELL", token: "ORCA", amount: "500", confidence: 92, pnl: "+$890", followers: 2145, timestamp: "14:23:15" },
    ]);

    useEffect(() => {
      const interval = setInterval(() => {
        const traders = ["🐋 WhaleMaster", "⚡ MomentumKing", "🔥 AlphaBot", "🤖 GridBot"];
        const tokens = ["BONK", "JTO", "ORCA", "COPE"];
        setSignals((prev) => [{
          id: Date.now(),
          trader: traders[Math.floor(Math.random() * 4)],
          action: Math.random() > 0.5 ? "BUY" : "SELL",
          token: tokens[Math.floor(Math.random() * 4)],
          amount: `${Math.floor(Math.random() * 10000)}${Math.random() > 0.5 ? "K" : ""}`,
          confidence: Math.floor(Math.random() * 15) + 80,
          pnl: `+$${Math.floor(Math.random() * 5000)}`,
          followers: Math.floor(Math.random() * 2000) + 500,
          timestamp: new Date().toLocaleTimeString(),
        }, ...(prev || []).slice(0, 5)]);
      }, 4000);
      return () => clearInterval(interval);
    }, []);

    const confidenceColor = (conf) => {
      if (conf >= 92) return "text-green-400 bg-green-500/10";
      if (conf >= 85) return "text-cyan-400 bg-cyan-500/10";
      return "text-amber-400 bg-amber-500/10";
    };

    return (
      <div
        className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
        style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px 20px rgba(0,0,0,0.4)` }}
      >
        <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Copy size={14} className="text-purple-500" /> COPY TRADING SIGNALS
          </h3>
          <p className="text-xs text-gray-500 mt-1">Top traders' latest moves</p>
        </div>
        <div className="max-h-64 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {signals.map((signal) => (
            <div key={signal.id}
              className="p-3 border border-purple-500/20 bg-black/40 rounded-lg hover:bg-black/60 transition-all cursor-pointer hover:border-purple-400/40"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-purple-300 font-bold">{signal.trader}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  signal.action === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {signal.action}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-gray-300 mb-2">
                <span className="text-cyan-300 font-semibold">{signal.token}</span>
                <span className="text-amber-300">{signal.amount}</span>
                <span className="text-green-400 font-semibold">{signal.pnl}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                <span>Followers: {signal.followers}</span>
                <span className={`px-2 py-1 rounded font-bold ${confidenceColor(signal.confidence)}`}>Confidence: {signal.confidence}%</span>
                <span className="text-gray-500">{signal.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     8 · NETWORK CONGESTION VISUALIZER
     ══════════════════════════════════════════════════════════════════════ */
  const NetworkCongestion = () => {
    const [congestion, setCongestion] = useState({
      current: 32, tps: 1200, avgLatency: 2.3, maxLatency: 8.5, failureRate: 0.12, networkHealth: "healthy",
    });

    useEffect(() => {
      const interval = setInterval(() => {
        setCongestion((prev) => ({
          current: Math.max(10, Math.min(100, prev.current + (Math.random() - 0.5) * 8)),
          tps: Math.max(100, Math.min(4000, prev.tps + (Math.random() - 0.5) * 200)),
          avgLatency: Math.max(0.5, Math.min(50, prev.avgLatency + (Math.random() - 0.5) * 1.5)),
          maxLatency: Math.max(1, Math.min(100, prev.maxLatency + (Math.random() - 0.5) * 3)),
          failureRate: Math.max(0, Math.min(10, prev.failureRate + (Math.random() - 0.5) * 0.5)),
          networkHealth: Math.random() > 0.1 ? "healthy" : "degraded",
        }));
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    const congestionColor = congestion.current < 40 ? "from-green-400" : congestion.current < 70 ? "from-amber-400" : "from-red-400";
    const healthColor = congestion.networkHealth === "healthy" ? "text-green-400" : "text-amber-400";

    return (
      <div className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden" style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px 14px rgba(0,0,0,0.4)` }}>
        <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
          <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
            <Gauge size={14} className="text-cyan-500" /> NETWORK CONGESTION
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time Solana network metrics</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Network Congestion</span>
              <span className="text-sm font-bold" style={{
                color: congestion.current < 40 ? "#22c55e" : congestion.current < 70 ? "#FBBF24" : "#EF4444",
              }}>{congestion.current.toFixed(0)}%</span>
            </div>
            <div className="h-3 rounded-full bg-black/40 border border-cyan-500/20 overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${congestionColor} to-cyan-400 transition-all duration-500`}
                style={{ width: `${congestion.current}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1">TPS</div>
              <div className="text-lg font-bold text-cyan-400">{Math.floor(congestion.tps)}</div>
            </div>
            <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1">AVG LATENCY</div>
              <div className="text-lg font-bold text-purple-400">{congestion.avgLatency.toFixed(1)}ms</div>
            </div>
            <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1">MAX LATENCY</div>
              <div className="text-lg font-bold text-amber-400">{congestion.maxLatency.toFixed(1)}ms</div>
            </div>
            <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1">FAILURE RATE</div>
              <div className="text-lg font-bold text-red-400">{congestion.failureRate.toFixed(2)}%</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-500/10 rounded-lg">
            <span className="text-xs text-gray-400">Network Health</span>
            <div className={`flex items-center gap-2 ${healthColor}`}>
              {congestion.networkHealth === "healthy" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <span className="text-sm font-bold uppercase">{congestion.networkHealth}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     9 · EXECUTION TERMINAL
     ══════════════════════════════════════════════════════════════════════ */
  const ExecutionTerminal = () => {
    const [trades, setTrades] = useState([
      { id: 1, type: "BUY", token: "BONK", amount: "50K", price: "0.00024", time: "14:23:45", pnl: null, confidence: 92 },
      { id: 2, type: "SELL", token: "JTO", amount: "500", price: "2.15", time: "14:20:12", pnl: "+$45.20", confidence: 87 },
      { id: 3, type: "BUY", token: "ORCA", amount: "100", price: "1.23", time: "14:18:30", pnl: null, confidence: 78 },
    ]);
    const [stats, setStats] = useState({
      winRate: 68.5, totalPnL: 1245.5, sessionPnL: 340.25, avgLatency: 2.1, tradesExecuted: 23,
    });

    useEffect(() => {
      const interval = setInterval(() => {
        const tokens = ["BONK", "JTO", "ORCA", "COPE"];
        const newTrade = {
          id: Date.now(),
          type: Math.random() > 0.5 ? "BUY" : "SELL",
          token: tokens[Math.floor(Math.random() * 4)],
          amount: `${Math.floor(Math.random() * 1000)}${Math.random() > 0.5 ? "K" : ""}`,
          price: (Math.random() * 3).toFixed(4),
          time: new Date().toLocaleTimeString(),
          pnl: Math.random() > 0.6 ? `+$${(Math.random() * 100).toFixed(2)}` : null,
          confidence: Math.floor(Math.random() * 25) + 70,
        };
        setTrades((prev) => [newTrade, ...(prev || []).slice(0, 11)]);
        setStats((prev) => ({
          ...prev,
          totalPnL: prev.totalPnL + (Math.random() - 0.4) * 50,
          sessionPnL: prev.sessionPnL + (Math.random() - 0.4) * 50,
          tradesExecuted: prev.tradesExecuted + 1,
          winRate: Math.min(100, Math.max(0, prev.winRate + (Math.random() - 0.5) * 2)),
        }));
      }, 2500);
      return () => clearInterval(interval);
    }, []);

    const confidenceColor = (c) => c >= 90 ? "bg-green-500/20 text-green-400" : c >= 80 ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400";

    return (
      <div className="border-t border-cyan-500/10 bg-black/20 backdrop-blur-3xl rounded-t-2xl overflow-hidden">
        <div className="px-6 md:px-8 py-4 border-b border-cyan-500/20 flex items-center gap-3 bg-black/60">
          <Radar size={16} className="text-green-400 animate-pulse" />
          <h3 className="font-mono font-bold text-cyan-400">EXECUTION TERMINAL</h3>
          <div className="flex-1" />
          <span className="text-xs text-gray-500">Live trading log</span>
        </div>

        <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Trade log */}
          <div className="xl:col-span-8 border rounded-lg bg-black/40 overflow-hidden" style={{ borderColor: "rgba(34,211,238,0.06)" }}>
            <div className="grid grid-cols-7 gap-4 px-4 md:px-6 py-3 bg-black/60 border-b border-cyan-500/20 text-xs font-mono text-gray-400 font-bold">
              <div>TYPE</div><div>TOKEN</div><div>AMOUNT</div><div>PRICE</div><div>CONF</div><div>TIME</div><div>P&amp;L</div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {trades.map((trade) => (
                <div key={trade.id}
                  className="grid grid-cols-7 gap-4 px-4 md:px-6 py-3 text-xs font-mono border-b border-cyan-500/10 hover:bg-black/60 transition-colors"
                >
                  <div className={trade.type === "BUY" ? "text-[#00FF9D] font-bold" : "text-[#FF3B3B] font-bold"}>{trade.type}</div>
                  <div className="text-cyan-300">{trade.token}</div>
                  <div className="text-gray-300">{trade.amount}</div>
                  <div className="text-amber-300">${trade.price}</div>
                  <div className={`font-bold px-2 py-1 rounded text-center ${confidenceColor(trade.confidence)}`}>{trade.confidence}%</div>
                  <div className="text-gray-400">{trade.time}</div>
                  <div className={trade.pnl ? "text-[#00FF9D] font-bold" : "text-gray-500"}>{trade.pnl || "-"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="xl:col-span-4 space-y-3">
            <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-1">
              <div className="text-xs text-gray-400 font-mono">WIN RATE</div>
              <div key={Math.floor(stats.winRate)} className="text-2xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-1">
              <div className="text-xs text-gray-400 font-mono">SESSION P&amp;L</div>
              <div key={Math.floor(stats.sessionPnL)} className="text-2xl font-bold text-green-400">+${stats.sessionPnL.toFixed(2)}</div>
            </div>
            <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-1">
              <div className="text-xs text-gray-400 font-mono">TOTAL TRADES</div>
              <div key={stats.tradesExecuted} className="text-2xl font-bold text-cyan-400">{stats.tradesExecuted}</div>
            </div>
            <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-1">
              <div className="text-xs text-gray-400 font-mono">AVG LATENCY</div>
              <div key={Math.floor(stats.avgLatency * 10)} className="text-2xl font-bold text-purple-400">{stats.avgLatency.toFixed(1)}ms</div>
            </div>
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/40 to-cyan-500/20" />
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     10 · P&L DASHBOARD  (integrated from PnLDashboard page)
     ══════════════════════════════════════════════════════════════════════ */
  const PnLPanel = () => {
    const [pnl, setPnl] = useState(null);
    const [period, setPeriod] = useState("day");

    useEffect(() => {
      const fetchData = () => {
        // Simulated PnL data (no server required for zero-error build)
        setPnl({
          totalPnL: 18742.60,
          realizedPnL: 12450.30,
          unrealizedPnL: 6292.30,
          roi: 47.8,
          winRate: 86.3,
          profitFactor: 2.41,
          maxDrawdown: 3.2,
        });
      };
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }, [period]);

    if (!pnl) return <div className="text-center py-8 text-gray-500">Loading P&amp;L data…</div>;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">P&amp;L Dashboard</h3>
            <p className="text-xs text-gray-500">Performance breakdown</p>
          </div>
          <div className="flex gap-1">
            {PNL_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  period === p
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800/60 text-gray-400 hover:bg-slate-700"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 4 highlight cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[{
            label: "Total P&L", value: `$${pnl.totalPnL.toFixed(2)}`, color: "#22c55e", icon: TrendingUp, border: "rgba(34,197,94,0.3)"
          },
            { label: "Realized P&L", value: `$${pnl.realizedPnL.toFixed(2)}`, color: "#3b82f6", icon: BarChart3, border: "rgba(59,130,246,0.3)" },
            { label: "Unrealized", value: `$${pnl.unrealizedPnL.toFixed(2)}`, color: "#8b5cf6", icon: Zap, border: "rgba(139,92,246,0.3)" },
            { label: "ROI", value: `${pnl.roi.toFixed(1)}%`, color: "#f59e0b", icon: DollarSign, border: "rgba(245,158,11,0.3)" },
          ].map(({ label, value, color, icon: Icon, border }) => (
            <div key={label} className="rounded-xl p-4"
              style={{
                background: `linear-gradient(135deg, ${color}1a, ${color}0d)`,
                border: `1px solid ${border}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">{label}</span>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="text-xl font-bold" style={{ color }}>{value}</div>
              <p className="text-[10px] text-gray-500 mt-1">
                {label === "Total P&L" ? "Realized + Unrealized" : label === "Realized P&L" ? "Locked gains/losses" : label === "Unrealized" ? "Open positions" : "Return on investment"}
              </p>
            </div>
          ))}
        </div>

        {/* Performance breakdown */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">Performance Breakdown</h4>

          <div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-xs">Win Rate</span>
              <span className="text-white font-semibold text-sm">{pnl.winRate?.toFixed(2) || 0}%</span></div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all" style={{ width: `${pnl.winRate}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-xs">Profit Factor</span>
              <span className="text-white font-semibold text-sm">{pnl.profitFactor?.toFixed(2)}x</span></div>
            <p className="text-[10px] text-gray-500">Gross profit / Gross loss ratio</p>
          </div>

          <div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-xs">Max Drawdown</span>
              <span className="text-red-400 font-semibold text-sm">{pnl.maxDrawdown?.toFixed(2)}%</span></div>
            <p className="text-[10px] text-gray-500">Largest peak to trough decline</p>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     12 · ACTIVE TRADES TABLE
     ══════════════════════════════════════════════════════════════════════ */
  const ActiveTradesTable = ({ trades }) => (
    <div className="section" style={{ overflow: "hidden", padding: 0 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Active Trades</span>
        <span className="pill active">{trades.length} open</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="tbl" style={{ minWidth: 620 }}>
          <thead><tr><th>Token</th><th>Side</th><th>Amount</th><th>Entry</th><th>Current</th><th>P&amp;L</th><th>P&amp;L%</th></tr></thead>
          <tbody>
            {trades.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#4b5563", fontSize: "0.875rem" }}>No active trades</td></tr>
              : trades.map((trade, i) => {
                const type = trade.side?.toUpperCase?.() || trade.type || "BUY";
                const token = trade.token || trade.market || trade.symbol || "—";
                const amount = trade.amount || trade.quantity || "—";
                const entry = trade.entryPrice || trade.price || trade.entry || "—";
                const cur = trade.currentPrice || trade.current || "—";
                const pnl = trade.pnl || trade.profit || "0";
                const pnlPct = trade.pnlPercent || trade.returnPercent || "0%";
                const isPos = !String(pnl).startsWith("-") && pnl !== "0" && pnl !== "—";
                return (
                  <tr key={trade.id || `${token}-${i}`}>
                    <td style={{ color: "#F1F5F9", fontWeight: 500 }}>{token}</td>
                    <td><span className={type === "BUY" ? "buy-tag" : "sell-tag"}>{type}</span></td>
                    <td style={{ color: "#cbd5e1" }}>{amount}</td>
                    <td style={{ color: "#64748b" }}>{typeof entry === "number" ? `$${entry.toFixed(6)}` : entry}</td>
                    <td style={{ color: "#F1F5F9" }}>{typeof cur === "number" ? `$${cur.toFixed(6)}` : cur}</td>
                    <td style={{ color: isPos ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {typeof pnl === "number" ? (isPos ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`) : pnl}
                    </td>
                    <td style={{ color: isPos ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {typeof parseFloat(String(pnlPct).replace(/[^\d.-]/g, "")) === "number"
                        ? (parseFloat(String(pnlPct).replace(/[^\d.-]/g, "")) >= 0 ? `+${pnlPct}` : pnlPct)
                        : pnlPct}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     15 · TRADING FORM  (mobile-rendered inline, desktop shared)
     ══════════════════════════════════════════════════════════════════════ */
  const TradingControl = ({ isMobile = false }) => {
    const [tab, setTab] = useState("buy");
    return (
      <div className={`${isMobile ? "mob-card" : "trade-panel"}`} style={!isMobile ? {} : { padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {FLEET_TABS.map(({ key, label, color }) => (
            <button key={key} className="trade-tab" onClick={() => setTab(key)}
              style={{ flex: 1, padding: "11px 8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: tab === key ? color : "transparent", color: tab === key ? color : "#64748b", background: "transparent" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ padding: isMobile ? 12 : "var(--space-card)", display: "flex", flexDirection: "column", gap: isMobile ? 12 : "var(--space-card)" }}>
          <div>
            <div className="form-label">Strategy</div>
            <select className="field" defaultValue="momentum">
              <option>Momentum</option>
              <option>Sniper — Quick Flip</option>
              <option>Arbitrage</option>
              <option>TWAP</option>
              <option>Grid</option>
            </select>
          </div>
          <div>
            <div className="form-label">Token</div>
            <input className="field" placeholder="Token address or symbol…" defaultValue="HFT" />
          </div>
          <div>
            <div className="form-label">Amount (SOL)</div>
            <input className="field" type="number" placeholder="0.00" defaultValue={1.0} />
          </div>
          <div>
            <div className="form-label">Slippage — 0.5%</div>
            <input className="field" type="range" min={0.1} max={5} step={0.1} defaultValue={0.5}
              style={{ accentColor: "#8B5CF6", width: "100%", padding: 0, border: "none", background: "transparent", height: 20 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: "0.75rem", color: "#4b5563" }}>0.1%</span>
              <span style={{ fontSize: "0.75rem", color: "#4b5563" }}>5%</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button style={{ padding: 9, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#64748b", fontSize: "0.8125rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={13} /> Private
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Auto-sell</span>
              <span style={{ width: 34, height: 18, borderRadius: 9, background: "rgba(139,92,246,0.28)", position: "relative", display: "inline-block" }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#8B5CF6", position: "absolute", right: 3, top: 2, display: "inline-block" }} />
              </span>
            </div>
          </div>
          <button className="btn btn-buy" style={{ width: "100%", padding: 13, fontSize: "0.8125rem" }}>
            <Play size={15} /> &nbsp;Execute Buy
          </button>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     18 · PORTFOLIO QUICK-STRIP  (integrated from PortfolioDashboard)
     ══════════════════════════════════════════════════════════════════════ */
  const PortfolioStrip = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Portfolio</h3>
          <p className="text-[10px] text-gray-500">Asset overview</p>
        </div>
        <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: "0.75rem", color: "#94a3b8" }}>
          <Wallet size={12} /> View All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PORTFOLIO_SUMMARY.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-black/30 border border-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} style={{ color }} />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {WALLET_DATA.map((w) => <WalletRow key={w.asset} {...w} />)}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     19 · AI SIGNAL CENTER  (right-panel in Desktop, standalone in Mobile)
     ══════════════════════════════════════════════════════════════════════ */
  const SignalCenter = () => (
    <div className="feed-card">
      <SectionLabel label="AI Signal Center" right={<span className="pill purple">Conf 93%</span>} />
      {SIGNALS.map((s) => <InsightRow key={s.label} {...s} />)}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     20 · DESKTOP VIEW
     ══════════════════════════════════════════════════════════════════════ */
  const DesktopView = () => {
    return (
      <div className="dsk-view">

        {/* ── Stats Row ── */}
        <div className="dsk-stats-grid">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Chart Panel ── */}
        <div className="chart-panel">
          <div className="chart-panel-hdr">
            <div>
              <div className="monitor-label">Trading Chart</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 2 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>$HFT / SOL</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#22c55e" }}>+211%</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>0.000956 SOL</span>
              </div>
            </div>
            <div className="tf-pills">
              {TIME_FRAMES.map((tf) => (
                <button key={tf} className="tf-pill" style={{ color: "#64748b" }}>{tf}</button>
              ))}
            </div>
          </div>
          <div className="chart-canvas">
            <MainPanel />
          </div>
          <div className="chart-footer-row">
            {CC_MARKET.map((m) => (
              <div key={m.label} style={{ padding: "8px 14px", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="monitor-label">{m.label}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: m.color, marginTop: 2 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <RealtimeSummaryPanel />

        {/* ── Lower grid: TradeTabs / Trades / Right col ── */}
        <div className="dsk-low-grid">

          {/* Trading Control */}
          <TradingControl />

          {/* Active Trades */}
          <ActiveTradesTable trades={activeTrades} />

          {/* Signal Center + Portfolio Strip (right column) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SignalCenter />
            <div className="feed-card">
              <SectionLabel label="Wallet" />
              {WALLET_DATA.map((w) => <WalletRow key={w.asset} {...w} />)}
            </div>
          </div>

        </div>

        {/* ── P&L Dashboard strip ── */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>P&amp;L Overview</span>
          </div>
          <div style={{ padding: 16 }}>
            <PnLPanel />
          </div>
        </div>

        {/* ── Monitoring row ── */}
        <div className="dsk-mono-grid">
          {MONITORING.map((m) => <MonitorCard key={m.label} {...m} />)}
        </div>

        {/* ── Network congestion ── */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Network Status</span>
          </div>
          <div style={{ padding: 16 }}>
            <NetworkCongestion />
          </div>
        </div>

        {/* ── Execution Terminal ── */}
        <ExecutionTerminal />

      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     21 · MOBILE VIEW
     ══════════════════════════════════════════════════════════════════════ */
  const MobileView = () => {
    return (
      <div className="mob-view">

        {/* Stats */}
        <div className="mob-stats-grid">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Chart */}
        <div className="mob-card chart-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
            <div>
              <div className="monitor-label">Trading Chart</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>$HFT / SOL</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#22c55e" }}>+211%</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>0.000956</span>
              </div>
            </div>
            <div className="tf-pills" style={{ marginTop: 8, flexWrap: "wrap" }}>
              {TIME_FRAMES.map((tf) => (
                <button key={tf} className="tf-pill" style={{ color: "#64748b" }}>{tf}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 0, minHeight: 260 }}>
            <MainPanel />
          </div>
          <RealtimeSummaryPanel />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {CC_MARKET.map((m) => (
              <div key={m.label} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="monitor-label" style={{ marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Panel */}
        <TradingControl isMobile />

        {/* Active Trades */}
        <ActiveTradesTable trades={activeTrades} />

        {/* P&L */}
        <div className="mob-card section" style={{ padding: 14 }}>
          <PnLPanel />
        </div>

        {/* Two-col: Signals + Wallet */}
        <div className="mob-2col-grid">
          <div className="mob-card feed-card" style={{ padding: 14, minHeight: 0 }}>
            <SectionLabel label="AI Signals" right={<span className="pill purple">93%</span>} />
            {SIGNALS.map((s) => <InsightRow key={s.label} {...s} />)}
          </div>
          <div className="mob-card feed-card" style={{ padding: 14, minHeight: 0 }}>
            <SectionLabel label="Wallet" />
            {WALLET_DATA.map((w) => <WalletRow key={w.asset} {...w} />)}
          </div>
        </div>

        {/* Portfolio Strip */}
        <div className="mob-card section" style={{ padding: 14 }}>
          <PortfolioStrip />
        </div>

        {/* Monitoring row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {MONITORING.map((m) => <MonitorCard key={m.label} {...m} />)}
        </div>

        {/* Network congestion */}
        <div className="mob-card section" style={{ padding: 14 }}>
          <NetworkCongestion />
        </div>

        {/* Execution Terminal */}
        <ExecutionTerminal />

      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     22 · MOBILE LAYOUT SHELL
     ══════════════════════════════════════════════════════════════════════ */
  const MobileLayout = ({ children }) => (
    <div className="app-root-mob">
      <header className="mob-topbar" role="banner">
        <button className="mob-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <span className="mob-brand">HFT SYSTEM</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span className="mob-clock">{currentTime.toLocaleTimeString()}</span>
        </div>
      </header>
      {sidebarOpen && <div className="mob-backdrop" onClick={() => setSidebarOpen(false)} />}
      {sidebarOpen && (
        <aside className="mob-drawer" role="dialog" aria-label="Navigation">
          <div className="mob-drawer-hdr">
            <span className="mob-brand">HFT SYSTEM</span>
            <button className="mob-icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <nav className="mob-nav">
            {SIDEBAR_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`mob-nav-item${active ? " mob-nav-item--active" : ""}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      )}
      <main className="mob-content" role="main">
        {children}
      </main>
      <nav className="mob-bottomnav" role="navigation" aria-label="Main navigation">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Home" },
          { id: "trading", icon: Zap, label: "Trade" },
          { id: "wallets", icon: Wallet, label: "Wallets" },
          { id: "terminal", icon: Terminal, label: "Terminal" },
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <button key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mob-bottomnav-item${active ? " mob-bottomnav-item--active" : ""}`}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     23 · DESKTOP LAYOUT SHELL
     ══════════════════════════════════════════════════════════════════════ */
  const DesktopLayout = ({ children }) => {
    const [mouseDownNav, setMouseDownNav] = useState(null);
    return (
      <div className="app-root-dsk">
        <aside className="dsk-sidebar" role="navigation" aria-label="Navigation">
          <div className="dsk-logo">HF</div>
          <nav className="dsk-nav">
            {SIDEBAR_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button key={item.id}
                  onClick={() => {
                    if (item.id === "monitoring") { window.open("/monitoring", "_blank"); return; }
                    setActiveTab(item.id);
                  }}
                  title={item.label}
                  className={`dsk-nav-btn${active ? " dsk-nav-btn--active" : ""}`}
                  onMouseDown={() => setMouseDownNav(item.id)}
                  onMouseUp={() => setMouseDownNav(null)}
                  onMouseLeave={() => setMouseDownNav(null)}
                >
                  {active && <span className="dsk-nav-indicator" />}
                  <item.icon size={18} />
                  <span className="dsk-nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <button
            className="dsk-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <span className="dsk-footer">HFT SYS v3.0</span>
        </aside>

        <div className="dsk-main">
          <header className="dsk-topbar" role="banner">
            <div>
              <div className="dsk-pagetitle">Dashboard</div>
              <div className="dsk-pagesub">HFT Command Center</div>
            </div>
            <div className="dsk-topbar-pills">
              <span className="pill active"><span className="live-dot" /> Connected</span>
              <span className="pill" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#94a3b8" }}>
                <Wallet style={{ width: 12, height: 12 }} /> 24.8 SOL
              </span>
              <span className="pill purple">
                <Bell style={{ width: 12, height: 12 }} /> 7 Alerts
              </span>
              <span className="pill" style={{ padding: "6px 12px", color: "#06B6D4", borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.07)" }}>12ms Latency</span>
              <button className="pill" style={{ padding: "6px 10px", color: "#64748b", borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}>Theme</button>
            </div>
          </header>
          <div className="dsk-scroll-area">{children}</div>
        </div>
      </div>
    );
  };

  const RealtimeOverlay = () => {
    const hasPanels = [
      realtime.aiPredictions?.length,
      realtime.arbitrageSignals?.length,
      realtime.smartMoneySignals?.length,
      realtime.priceUpdates?.length,
      realtime.tradeRetries?.length,
    ].some((count) => (count || 0) > 0); // Ensure count is a number for comparison

    if (!hasPanels) return null;

    return (
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
        <AiPredictionsPanel />
        <ArbitrageSignalsPanel />
        <SmartMoneySignalsPanel />
        <PriceUpdatesPanel />
        <TradeRetriesPanel />
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     25 · RENDER
     ══════════════════════════════════════════════════════════════════════ */

  return (
    <>
      <CyberpunkBackground />
      {isMobile ? (
        <MobileLayout>
          <MobileView />
        </MobileLayout>
      ) : (
        <DesktopLayout>
          {/* System status bar (feature from StatusBar component) */}
          <StatusBar realtime={realtime} />

          {/* Main Dashboard view (features from DesktopView + all sub-panels) */}
          <DesktopView />
        </DesktopLayout>
      )}
      <RealtimeOverlay />
    </>
  );
};

Dashboard.displayName = "Dashboard";
export default Dashboard;