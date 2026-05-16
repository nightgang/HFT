import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart } from "lightweight-charts";
import {
  LayoutDashboard, Terminal, Zap, Wallet, Target, Briefcase,
  FileText, History, BarChart3, Brain, Settings, Puzzle, Activity,
  TrendingUp, TrendingDown, DollarSign, Shield,
  Play, Pause, Wifi, WifiOff, ChevronRight, ChevronLeft,
  ExternalLink, Square, RefreshCw, Lock, ChevronDown,
  Radar, Flame, Crosshair, Menu, X,
} from "lucide-react";
import {
  useGetActiveTrades,
  useGetSystemStatus,
} from "../hooks";
import TerminalConsole from "../components/TerminalConsole";
import HFTLiveFeed from "../components/HFTLiveFeed";
import HFTWalletTracker from "../components/HFTWalletTracker";
import HFTTradePanel from "../components/HFTTradePanel";
import CyberpunkGridBackground from "../components/dashboard/CyberpunkGridBackground";
import StatusBar from "../components/dashboard/StatusBar";
import ControlPanel from "../components/dashboard/ControlPanel";
import MainPanel from "../components/dashboard/MainPanel";
import LiveDataStream from "../components/dashboard/LiveDataStream";
import MempoolTransactionViewer from "../components/dashboard/MempoolTransactionViewer";
import CopyTradingSignalFeed from "../components/dashboard/CopyTradingSignalFeed";
import NetworkCongestionVisualizer from "../components/dashboard/NetworkCongestionVisualizer";
import ExecutionTerminal from "../components/dashboard/ExecutionTerminal";

// ─── responsive column builder ───────────────────────────────────────────────

function panelCol(mainWide, trade, feed, wallet) {
  // total available slots = current breakpoint span for main
  // mobile: main=12  tablet: main=8  xl: main=7/9/10/12
  if (mainWide === 12) return trade ? 12 : 0;                                // mobile
  if (mainWide === 8)  return trade ? 4 : (feed || wallet) ? 4 : 0;          // md
  return trade ? 2 : (feed || wallet) ? 3 : 0;                               // lg/xl
}

// ─── breakpoint-aware style helpers ─────────────────────────────────────────

// never-flicker animation for the stats-card row
const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

// ─── HFTDashboard ────────────────────────────────────────────────────────────

const HFTDashboard = ({ dashboardConfig: dashboardConfigProp }) => {
  // ── layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);      // mobile drawer
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── configurable panels
  const [dashboardConfig, setDashboardConfig] = useState({
    showStatsCards: true,
    showTradePanel: true,
    showLiveFeed: true,
    showWalletTracker: true,
    showActiveTrades: true,
  });

  // ── data
  const { data: activeTrades = [], isLoading: tradesLoading, error: tradesError } = useGetActiveTrades();
  const { data: systemStatus } = useGetSystemSystemStatus();

  // ── chart refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // ── localStorage persist
  useEffect(() => {
    const stored = window.localStorage.getItem("uiPreferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.dashboardConfig) {
          setDashboardConfig((prev) => ({ ...prev, ...parsed.dashboardConfig }));
        }
      } catch (error) {
        console.warn("Unable to load dashboard configuration", error);
      }
    }
  }, []);

  useEffect(() => {
    if (dashboardConfigProp) {
      setDashboardConfig((prev) => ({ ...prev, ...dashboardConfigProp }));
    }
  }, [dashboardConfigProp]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile drawer on ESC / route change away from dashboard
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── HFT mini candlestick chart
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: { background: { color: "transparent" }, textColor: "#a855f7" },
        grid: { vertLines: { color: "#1a1a2e" }, horzLines: { color: "#1a1a2e" } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "#a855f7" },
        timeScale: { borderColor: "#a855f7", timeVisible: true },
      });
      const series = chart.addCandlestickSeries({
        upColor: "#00ff88", downColor: "#a855f7",
        borderVisible: false, wickUpColor: "#00ff88", wickDownColor: "#a855f7",
      });
      const sample = [
        { time: "2024-01-01", open: 0.0008, high: 0.0009, low: 0.0007, close: 0.00085 },
        { time: "2024-01-02", open: 0.00085, high: 0.00095, low: 0.0008, close: 0.0009 },
        { time: "2024-01-03", open: 0.0009, high: 0.0010, low: 0.00085, close: 0.00095 },
        { time: "2024-01-04", open: 0.00095, high: 0.0011, low: 0.0009, close: 0.00098 },
        { time: "2024-01-05", open: 0.00098, high: 0.0012, low: 0.00095, close: 0.0011 },
      ];
      series.setData(sample);
      chartRef.current = chart;
      const onResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      window.addEventListener("resize", onResize);
      return () => { window.removeEventListener("resize", onResize); chart.remove(); };
    }
    return undefined;
  }, [sidebarCollapsed]);

  // ── sidebar items
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "terminal",  label: "Terminal",  icon: Terminal },
    { id: "trade",     label: "Trade",     icon: Zap },
    { id: "wallets",   label: "Wallets",   icon: Wallet },
    { id: "sniper",    label: "Sniper",    icon: Target },
    { id: "positions", label: "Positions", icon: Briefcase },
    { id: "orders",    label: "Orders",    icon: FileText },
    { id: "history",   label: "History",   icon: History },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "monitoring",label: "Monitor",   icon: Activity },
    { id: "strategies",label: "Strategies",icon: Brain },
    { id: "settings",  label: "Settings",  icon: Settings },
    { id: "plugins",   label: "Plugins",   icon: Puzzle },
  ];

  // ── stats cards
  const rpcHealthLabel = systemStatus?.rpcHealth ? systemStatus.rpcHealth.toUpperCase() : "HEALTHY";
  const statsCards = [
    { label: "Total PNL",    value: "$18,742.60", change: "+7.8%",   icon: TrendingUp, color: "text-emerald-400" },
    { label: "Win Rate",    value: "86.3%",       change: "+4.2%",   icon: Activity,   color: "text-emerald-400" },
    { label: "Total Volume",value: "$127.4K",     change: "+12.5%",  icon: DollarSign, color: "text-cyan-400" },
    { label: "Active Trades",value:tradesLoading?"…":`${activeTrades.length}`,change:"Realtime",icon:Zap,  color:"text-purple-400" },
    { label: "RPC Health",  value: rpcHealthLabel,change:systemStatus?.latency?`${systemStatus.latency.toFixed(1)}ms`:"—",icon:Wifi,color:rpcHealthLabel==="HEALTHY"?"text-green-400":"text-amber-400" },
    { label: "Priority Fee",value: "0.000005",   change: "Optimal", icon: Shield,    color: "text-orange-400" },
  ];

  // ── MainPanel grid helpers
  const mainPanelCol = buildGridClass(
    dashboardConfig.showTradePanel,
    dashboardConfig.showLiveFeed,
    dashboardConfig.showWalletTracker,
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050510] via-[#0a0a1a] to-[#050510] text-white overflow-x-hidden relative">

      {/* ── fixed background ── */}
      <CyberpunkGridBackground />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.04),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,157,0.025),transparent_50%)] pointer-events-none" />

      {/* ═══════════════════════════════════════
          MOBILE TOP BAR  (< md = 768 px)
      ═══════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-sm font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          HFT-SYSTEM
        </h1>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {isOnline
            ? <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
            : <WifiOff className="w-4 h-4 text-red-400" />}
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-400">{currentTime.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </header>
      {/* Spacer so content is not hidden behind the mobile top bar */}
      <div className="md:hidden h-14" />

      {/* ═══════════════════════════════════════
          MOBILE DRAWER BACKDROP
      ═══════════════════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* drawer panel – same nav content as desktop sidebar but full height */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-black/90 backdrop-blur-xl border-r border-purple-500/20 z-[70] flex flex-col"
            >
              {/* drawer header */}
              <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  HFT-SYSTEM
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* nav items */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                      if (item.id === "monitoring") window.open("/monitoring", "_blank");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                        : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* drawer footer panel controls */}
              <div className="p-4 border-t border-purple-500/20 space-y-3">
                <button
                  onClick={() => setDashboardConfig((p) => ({ ...p, showStatsCards: !p.showStatsCards }))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
                >
                  {dashboardConfig.showStatsCards ? "Hide" : "Show"} Stats Cards
                </button>
                <button
                  onClick={() => setDashboardConfig((p) => ({ ...p, showActiveTrades: !p.showActiveTrades }))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
                >
                  {dashboardConfig.showActiveTrades ? "Hide" : "Show"} Active Trades
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          DESKTOP / TABLET SIDEBAR  (>= md)
      ═══════════════════════════════════════ */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex fixed left-0 top-0 h-full w-70 bg-black/80 backdrop-blur-xl border-r border-purple-500/20 z-50 flex-col"
      >
        {/* brand */}
        <div className="p-6 border-b border-purple-500/20">
          <motion.h1
            className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            HFT-SYSTEM
          </motion.h1>
        </div>

        {/* nav items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "monitoring") { window.open("/monitoring", "_blank"); return; }
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-purple-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/20 text-purple-300"
                  : "text-gray-400 hover:bg-purple-500/10 hover:text-gray-200"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* panel controls */}
        <div className="p-4 border-t border-purple-500/20 space-y-2">
          <button
            onClick={() => setDashboardConfig((p) => ({ ...p, showStatsCards: !p.showStatsCards }))}
            className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
          >
            {dashboardConfig.showStatsCards ? "Hide" : "Show"} Stats Cards
          </button>
          <button
            onClick={() => setDashboardConfig((p) => ({ ...p, showActiveTrades: !p.showActiveTrades }))}
            className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
          >
            {dashboardConfig.showActiveTrades ? "Hide" : "Show"} Active Trades
          </button>
        </div>

        {/* brand footer bar */}
        <div className="p-4 border-t border-purple-500/20">
          <motion.button
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-purple-500/30 border border-purple-400/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-mono">HFT-SYSTEM</span>
            </div>
          </motion.button>
        </div>

        {/* collapse toggle — desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-4 h-4 text-purple-400" />
            : <ChevronLeft className="w-4 h-4 text-purple-400" />}
        </button>
      </motion.aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT WRAPPER
          mobile: ml-0 | desktop: ml-70 when sidebar open, ml-0 when collapsed
      ═══════════════════════════════════════ */}
      <div className={`transition-[margin] duration-300 md:ml-0 ${!sidebarCollapsed ? "lg:ml-70" : ""}`}
           style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── PAGE HEADER ── */}
        <header className="bg-black/20 backdrop-blur-3xl border border-white/10 rounded-none md:rounded-3xl lg:rounded-3xl mx-0 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* title block */}
            <div className="min-w-0">
              {/* md+ desktop branding – hidden on mobile (mobile uses top bar) */}
              <h1 className="hidden md:block text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                HFT-SYSTEM
              </h1>
              <p className="hidden md:block text-gray-400 text-sm mt-1">
                Ultra-fast Solana trading command center.
              </p>
              {/* always visible status pills */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/10 bg-white/5 px-2.5 py-1 text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  HFT-SYSTEM AI ONLINE
                </span>
                <span className="rounded-full border border-purple-500/10 bg-purple-500/10 px-2.5 py-1 text-purple-200">
                  Strategy Suite
                </span>
              </div>
            </div>

            {/* right-side status / monitoring link (desktop only) */}
            <div className="hidden lg:flex flex-wrap items-center gap-4 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4 text-green-400 animate-pulse" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                <span>RPC</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>WS</span>
              </div>
              <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-1.5 text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Congestion 32%
              </div>
              <a
                href="/monitoring"
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Monitoring</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* ── stats cards card grid ── */}
          {dashboardConfig.showStatsCards && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
              {statsCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  {...FADE_UP}
                  transition={{ delay: i * 0.06 }}
                  className="group relative bg-gradient-to-br from-black/50 via-black/30 to-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 transition-colors hover:border-cyan-400/30"
                  style={{ boxShadow: "0 12px 40px rgba(34,211,238,0.08)" }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <card.icon className={`w-4 h-4 md:w-5 md:h-5 ${card.color} group-hover:scale-110 transition-transform`} />
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        card.change.startsWith("+") ? "bg-green-500/20 text-green-300"
                        : card.change.startsWith("-") ? "bg-red-500/20 text-red-300"
                        : "bg-cyan-500/20 text-cyan-300"
                      }`}>{card.change}</span>
                    </div>
                    {/* truncate values on the smallest screens to avoid overflow */}
                    <div className="text-base md:text-xl font-bold text-white truncate">{card.value}</div>
                    <div className="text-[10px] md:text-xs text-gray-400 truncate">{card.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </header>

        {/* ── STATUS BAR ── */}
        <StatusBar />

        {/* ═══════════════════════════════════════
            PRIMARY GRID
            mobile: 1-col | md(≥768px):2-col | xl(≥1280px):12-col dynamic:
                main = 12(mobile) | 8(md) | 7/9/10/12(xl)  → via buildGridClass
            RHS column: trade panel (md+), feed+wallet (md+)
        ═══════════════════════════════════════ */}
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 min-h-0">

            {/* main chart panel */}
            <motion.div
              className={`col-span-1
                ${mainPanelCol === 12 ? "" : "md:col-span-8"}
                ${mainPanelCol === 7  ? "lg:col-span-7"
                :  mainPanelCol === 9  ? "lg:col-span-9"
                :  mainPanelCol === 10 ? "lg:col-span-10"
                :  mainPanelCol === 12 ? "lg:col-span-12"
                :                          "lg:col-span-8"}
                bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <div className="p-3 md:p-4 border-b border-purple-500/20 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">$HFT – HFT Token</h2>
                  <p className="text-xs md:text-sm text-gray-400 mt-0.5">Current: $0.000956 <span className="text-green-400">+211%</span></p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["1s","5s","15s","1m","5m","15s","1h","4h"].map((tf) => (
                    <button key={tf} className="px-2 py-0.5 text-[10px] md:text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded transition-colors">{tf}</button>
                  ))}
                </div>
              </div>
              {/* aspect-video equals 16:9; on xs the chart bar collapses gracefully */}
              <div className="aspect-[16/9] md:aspect-[3/1] w-full">
                <div ref={chartContainerRef} className="h-full w-full" />
              </div>
            </motion.div>

            {/* RHS stack – trade panel + feed / wallet card */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-3 md:gap-6">

              {dashboardConfig.showTradePanel && (
                <motion.div
                  className="col-span-1 lg:col-span-2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <HFTTradePanel />
                </motion.div>
              )}

              {(dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) && (
                <motion.div
                  className="col-span-1 space-y-3 md:space-y-6"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {dashboardConfig.showLiveFeed && <HFTLiveFeed />}
                  {dashboardConfig.showWalletTracker && <HFTWalletTracker />}
                  {/* AI Signal card */}
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-xs text-gray-300">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">HFT-SYSTEM AI</div>
                        <div className="text-sm font-bold text-white">Signal Feed</div>
                      </div>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200 text-[10px]">93% Conf</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-5">
                      High-conviction MEV signal detected. Monitor mempool latency.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-gray-400">
                      <span className="rounded-full bg-white/5 px-2 py-0.5">AI +3.2</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5">Mempool</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5">Signal Live</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── ACTIVE TRADES ── */}
          {dashboardConfig.showActiveTrades && (
            <motion.div
              className="mt-4 md:mt-6 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="p-3 md:p-4 border-b border-purple-500/20">
                <h3 className="text-base md:text-lg font-bold text-white">ACTIVE TRADES</h3>
              </div>
              {/* Mobile: horizontal scroll card; md+: full table */}
              <div className="md:hidden overflow-x-auto">
                {tradesLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">Loading active trades...</div>
                ) : tradesError ? (
                  <div className="p-6 text-center text-sm text-red-400">{tradesError}</div>
                ) : activeTrades.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">No active trades available right now.</div>
                ) : (
                  <div className="flex gap-3 p-3 overflow-x-auto snap-x snap-mandatory">
                    {activeTrades.map((trade, i) => {
                      const type = trade.side?.toUpperCase?.() || trade.type || "BUY";
                      const token = trade.token || trade.market || trade.symbol || "UNKNOWN";
                      return (
                        <div
                          key={trade.id || `${token}-${i}`}
                          className="snap-center shrink-0 w-64 bg-black/50 border border-purple-500/10 rounded-xl p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{token}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>{type}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <span className="text-gray-500">Amount</span>
                            <span className="text-right text-gray-300">{trade.amount || trade.quantity || "—"}</span>
                            <span className="text-gray-500">Entry</span>
                            <span className="text-right text-gray-300">${trade.entryPrice || trade.price || trade.entry || "—"}</span>
                            <span className="text-gray-500">Current</span>
                            <span className="text-right text-white">${trade.currentPrice || trade.current || "—"}</span>
                            <span className="text-gray-500">P&L</span>
                            <span className="text-right text-green-400 font-semibold">{trade.pnl || trade.profit || "—"}</span>
                            <span className="text-gray-500">P&L %</span>
                            <span className="text-right text-green-400 font-semibold">{trade.pnlPercent || trade.returnPercent || "—"}</span>
                          </div>
                          <button className="w-full py-1.5 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors">
                            Close
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* md+ full-width scrollable table */}
              <div className="hidden md:block overflow-x-auto">
                {tradesLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">Loading active trades...</div>
                ) : tradesError ? (
                  <div className="p-6 text-center text-sm text-red-400">{tradesError}</div>
                ) : activeTrades.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">No active trades available right now.</div>
                ) : (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-purple-500/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Current</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">P&L %</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrades.map((trade, index) => {
                        const type     = trade.side?.toUpperCase?.() || trade.type || "BUY";
                        const token    = trade.token || trade.market || trade.symbol || "UNKNOWN";
                        const amount   = trade.amount || trade.quantity || "-";
                        const entry    = trade.entryPrice || trade.price || trade.entry || "-";
                        const current  = trade.currentPrice || trade.current || "-";
                        const pnl      = trade.pnl || trade.profit || "-";
                        const pnlPct   = trade.pnlPercent || trade.returnPercent || "-";
                        return (
                          <motion.tr
                            key={trade.id || `${token}-${index}`}
                            className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-white font-medium">{token}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>{type}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">${entry}</td>
                            <td className="px-4 py-3 text-sm text-white">${current}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnl}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnlPct}</td>
                            <td className="px-4 py-3">
                              <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors">
                                Close
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── MIDDLE ROW: Control / MainPanel / LiveFeed ── */}
        <div className="p-3 md:px-6 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
            <div className="col-span-1 md:col-span-4">
              <ControlPanel />
            </div>
            <div className="col-span-1 md:col-span-8">
              <MainPanel />
            </div>
          </div>
        </div>

        {/* ── BOTTOM WIDGETS: 1-col → lg:3-col ── */}
        <div className="px-3 md:px-6 py-3 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            <MempoolTransactionViewer />
            <CopyTradingSignalFeed />
            <NetworkCongestionVisualizer />
          </div>
        </div>

        {/* ── EXECUTION TERMINAL ── */}
        <div className="px-3 md:px-6 pb-6">
          <ExecutionTerminal />
        </div>

        {/* ── TERMINAL CONSOLE ── */}
        <div className="px-3 md:px-6 pb-10">
          <TerminalConsole />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE BOTTOM NAV  (< md, fixed bottom)
      ═══════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-black/85 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="grid grid-cols-4 items-center">
          {[
            { id: "dashboard",  icon: LayoutDashboard },
            { id: "trading",   icon: Zap },
            { id: "wallets",   icon: Wallet },
            { id: "terminal",  icon: Terminal },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors ${
                  isActive ? "text-cyan-300" : "text-gray-500"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {/* truncated label on very small screens */}
                <span className="text-[9px] tracking-tight leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
};

HFTDashboard.displayName = "HFTDashboard";
export default HFTDashboard;
