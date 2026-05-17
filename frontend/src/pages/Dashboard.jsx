import React, { useState, useEffect, useRef, useMemo } from "react";
import { createChart } from "lightweight-charts";
import {
  LayoutDashboard, Zap, Wallet, Target, Briefcase, FileText, History,
  BarChart3, Brain, Activity, Settings, TrendingUp, TrendingDown, Bell,
  Menu, X, ChevronRight, ChevronLeft, RefreshCw, ChevronDown, AlertCircle,
  Server, Globe, LineChart, Play, Pause, Flame, Lock, Square, Crosshair,
  Copy, Gauge, Layers, Eye, EyeOff, CheckCircle, Radar, DollarSign,
} from "lucide-react";
import { useRealtimeDashboardData } from "../hooks/useRealtimeDashboardData";

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
];

const STATS = [
  { label: "Total PnL", value: "$18,742.60", change: "+7.8%", up: true, icon: TrendingUp },
  { label: "Win Rate", value: "86.3%", change: "+4.2%", up: true, icon: TrendingUp },
  { label: "Total Volume", value: "$127.4K", change: "+12.5%", up: true, icon: TrendingUp },
  { label: "Network Latency", value: "12 ms", change: "Optimal", up: null, icon: Globe },
  { label: "RPC Health", value: "99.2%", change: "All green", up: true, icon: CheckCircle },
  { label: "Active Signals", value: "7", change: "Live", up: null, icon: Radar },
];

const WALLET_DATA = [
  { asset: "SOL", bal: "12.45", chg: "+3.2%", icon: "◈" },
  { asset: "USDC", bal: "$4,281", chg: "—", color: "#06B6D4" },
  { asset: "HFT", bal: "84.2K", chg: "+12.1%", color: "#8B5CF6" },
  { asset: "RAY", bal: "142", chg: "-2.4%", color: "#F59E0B" },
];

const SIGNALS = [
  { label: "Whale signal", detail: "2.3 k SOL moved", color: "#86efac" },
  { label: "Momentum shift", detail: "Strong bullish", color: "#a5f3fc" },
  { label: "Mempool activity", detail: "12 tx / sec", color: "#fde047" },
  { label: "Slippage risk", detail: "0.2% avg", color: "#94a3b8" },
];

const MONITORING_DATA = [
  { label: "RPC Latency", value: "12", unit: "ms", status: "Optimal", color: "#06B6D4" },
  { label: "Network Congestion", value: "32%", status: "Moderate", color: "#F59E0B" },
  { label: "Order Book Depth", value: "$4.2M", status: "Deep", color: "#8B5CF6" },
  { label: "Pending Alerts", value: "3", status: "High", color: "#EF4444" },
];

const CC_MARKET = [
  { label: "24h Change", value: "+211%", color: "#22C55E" },
  { label: "24h High", value: "0.00115", color: "#06B6D4" },
  { label: "24h Low", value: "0.00042", color: "#F59E0B" },
  { label: "Volume", value: "12.8M", color: "#8B5CF6" },
];

const TIME_FRAMES = ["1s", "5s", "15s", "1m", "5m", "15m", "1h", "4h"];

const buildCandles = (count = 90, base = 0.00091, seed = 42) => {
  let r = seed;
  const rng = () => {
    r = (r * 1664525 + 1013904223) >>> 0;
    return r / 0xffffffff;
  };
  const data = [];
  const now = Date.now();
  let price = base;
  for (let i = count; i >= 0; i--) {
    const drift = (rng() - 0.5) * 0.00008;
    const open = price;
    const close = Math.max(open + drift, 0.00025);
    const hi = Math.max(open, close) + rng() * 0.00004;
    const lo = Math.min(open, close) - rng() * 0.00004;
    data.push({
      time: Math.floor((now - i * 60000) / 1000),
      open: +open.toFixed(8),
      high: +hi.toFixed(8),
      low: +lo.toFixed(8),
      close: +close.toFixed(8),
    });
    price = close;
  }
  return data;
};

const buildVolume = (candles) => {
  return candles.map((c) => ({
    time: c.time,
    value: +(Math.random() * 2e6 + 2e5).toFixed(0),
    color: c.close >= c.open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
  }));
};

const Dashboard = ({ dashboardConfig = {} }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const {
    isConnected,
    lastMessageType,
    lastMessageAt,
    wsError,
    autoTradeStatus,
    aiPredictions,
    arbitrageSignals,
    smartMoneySignals,
    priceUpdates,
    tradeRetries,
    wallets: liveWallets,
    activeTrades,
    systemStatus,
  } = useRealtimeDashboardData();

  const statsData = [
    {
      label: "Total PnL",
      value: systemStatus?.totalPnl ?? "$18,742.60",
      change: systemStatus?.pnlChange ?? "+7.8%",
      up: systemStatus?.pnlChange?.startsWith("+") ?? true,
      icon: TrendingUp,
    },
    {
      label: "Win Rate",
      value: systemStatus?.winRate ?? "86.3%",
      change: systemStatus?.winRateChange ?? "+4.2%",
      up: true,
      icon: TrendingUp,
    },
    {
      label: "Total Volume",
      value: systemStatus?.totalVolume ?? "$127.4K",
      change: systemStatus?.volumeChange ?? "+12.5%",
      up: true,
      icon: TrendingUp,
    },
    {
      label: "Network Latency",
      value: systemStatus?.rpcLatency ? `${systemStatus.rpcLatency} ms` : "12 ms",
      change: systemStatus?.rpcStatus ?? "Optimal",
      up: systemStatus?.rpcStatus === "Optimal" ? null : false,
      icon: Globe,
    },
    {
      label: "RPC Health",
      value: systemStatus?.rpcHealth ?? "99.2%",
      change: systemStatus?.rpcStatus ?? "All green",
      up: true,
      icon: CheckCircle,
    },
    {
      label: "Active Signals",
      value: `${aiPredictions.length + arbitrageSignals.length + smartMoneySignals.length}`,
      change: "Live",
      up: null,
      icon: Radar,
    },
  ];

  const walletItems = liveWallets?.length
    ? liveWallets.map((w) => ({
        asset: w.asset || w.symbol || "UNKNOWN",
        bal: w.balance || w.amount || "0",
        chg: w.change || "—",
        color: w.color || "#06B6D4",
      }))
    : WALLET_DATA;

  const signalFeed = [
    ...aiPredictions.map((prediction) => ({
      label: "AI Prediction",
      detail: prediction.recommendation || prediction.score || "Signal generated",
      color: "#22c55e",
      time: prediction.timestamp,
    })),
    ...arbitrageSignals.map((signal) => ({
      label: "Arbitrage Signal",
      detail: signal.summary || signal.price || "Arbitrage opportunity",
      color: "#facc15",
      time: signal.timestamp,
    })),
    ...smartMoneySignals.map((signal) => ({
      label: "Smart Money",
      detail: signal.summary || signal.price || "Smart money flow detected",
      color: "#8b5cf6",
      time: signal.timestamp,
    })),
  ].slice(0, 6);

  const currentPrice = priceUpdates?.[0]?.price ?? "0.0009112";
  const currentChange = priceUpdates?.[0]?.change ?? "+2.45%";
  const currentMarket = priceUpdates?.[0]?.market ?? {
    high: "0.00115",
    low: "0.00042",
    volume: "12.8M",
  };

  const formatTime = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ── Viewport detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const up = () => setIsMobile(window.innerWidth < 768);
    up();
    window.addEventListener("resize", up);
    return () => window.removeEventListener("resize", up);
  }, []);

  // ── Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#64748b" },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
    });

    const candles = buildCandles();
    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    series.setData(candles);
    chart.addHistogramSeries({ color: "#8B5CF6" }).setData(buildVolume(candles));
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current)
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    });
    ro.observe(chartContainerRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      {!isMobile && (
        <div className="flex relative z-10 min-h-screen">
          {/* Sidebar */}
          <aside
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-xl border-r border-white/10 transition-all"
            style={{
              transform: sidebarCollapsed ? "translateX(0)" : "translateX(0)",
              width: sidebarCollapsed ? "80px" : "280px",
            }}
          >
            <div className="p-4 border-b border-white/10">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {sidebarCollapsed ? "HFT" : "HFT DASHBOARD"}
              </h1>
            </div>

            <nav className="p-3 space-y-2">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "bg-purple-500/30 text-purple-300 border border-purple-400/50"
                        : "text-gray-300 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="absolute bottom-4 left-4 right-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                System Online
              </div>
              <div className="text-gray-500">v2.1.0</div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 ml-64 overflow-auto" style={{ marginLeft: sidebarCollapsed ? "80px" : "280px" }}>
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Dashboard</h2>
                <p className="text-xs text-gray-500">HFT Command Center</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search pairs, wallets, signals..."
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-600 w-64"
                />
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Bell size={20} className="text-gray-400 cursor-pointer" />
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
                    <span>{isConnected ? "Realtime connected" : "Realtime disconnected"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard content */}
            <div className="p-6 space-y-6">
              {/* Stats row */}
              {dashboardConfig.showStatsCards !== false && (
                <div className="grid grid-cols-6 gap-4">
                  {statsData.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-xl hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">{stat.label}</span>
                          <Icon size={16} className="text-cyan-400" />
                        </div>
                        <div className="text-lg font-bold text-white mb-2">{stat.value}</div>
                        <div className={`text-xs font-semibold ${
                          stat.up === true
                            ? "text-green-400"
                            : stat.up === false
                            ? "text-red-400"
                            : "text-cyan-400"
                        }`}>
                          {stat.change}
                        </div>
                        {/* Mini sparkline chart */}
                        <div className="mt-2 h-8 flex items-end gap-1">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-green-500/20 to-green-500/50 rounded-t"
                              style={{
                                height: `${Math.sin(i / 5) * 30 + 50}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main panel with chart */}
              {dashboardConfig.showTradePanel !== false && (
                <div className="grid grid-cols-3 gap-6">
                  {/* Chart and trading section */}
                  <div className="col-span-2 space-y-4">
                  {/* Trading pair header */}
                  <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          BONK/USDC <span className="text-lg text-gray-500">☆</span>
                        </h3>
                        <div className="flex items-baseline gap-4 mt-2">
                          <span className="text-2xl font-bold text-cyan-400">{currentPrice}</span>
                          <span className={`text-sm font-semibold ${currentChange.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                            {currentChange}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">24h Change</span><div className="text-white font-bold">{currentMarket.change ?? "+211%"}</div></div>
                        <div><span className="text-gray-500">24h High</span><div className="text-cyan-400 font-bold">{currentMarket.high}</div></div>
                        <div><span className="text-gray-500">24h Low</span><div className="text-amber-400 font-bold">{currentMarket.low}</div></div>
                        <div><span className="text-gray-500">Volume</span><div className="text-purple-400 font-bold">{currentMarket.volume}</div></div>
                      </div>
                    </div>

                    {/* Timeframe buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {TIME_FRAMES.map((tf) => (
                        <button
                          key={tf}
                          className="px-2 py-1 rounded text-xs font-mono bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-all"
                        >
                          {tf}
                        </button>
                      ))}
                      <button className="ml-auto text-cyan-400 hover:text-cyan-300">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Chart */}
                  <div
                    className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl"
                    style={{ height: "400px" }}
                  >
                    <div ref={chartContainerRef} className="w-full h-full" />
                  </div>

                  {/* Market info */}
                  <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-xl grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">24H CHANGE</span>
                      <div className="text-green-400 font-bold mt-1">+211%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">24H HIGH</span>
                      <div className="text-green-400 font-bold mt-1">0.00115</div>
                    </div>
                    <div>
                      <span className="text-gray-500">24H LOW</span>
                      <div className="text-amber-400 font-bold mt-1">0.00042</div>
                    </div>
                    <div>
                      <span className="text-gray-500">VOLUME</span>
                      <div className="text-purple-400 font-bold mt-1">12.8M</div>
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                  {/* Fleet control */}
                  <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Fleet Control</h4>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button className="bg-green-500/20 border border-green-500/50 text-green-400 py-2 rounded-lg font-semibold hover:bg-green-500/30 transition-all">
                        Buy Fleet
                      </button>
                      <button className="bg-red-500/20 border border-red-500/50 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-all">
                        Sell Fleet
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Amount (USDC)</label>
                        <input
                          type="text"
                          value="1,000"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Amount (%)</label>
                        <input
                          type="text"
                          value="100"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1 my-3">
                        {["25%", "50%", "75%", "100%"].map((pct) => (
                          <button
                            key={pct}
                            className="bg-white/5 border border-white/10 rounded py-1 text-xs text-gray-300 hover:border-cyan-400/50 transition-all"
                          >
                            {pct}
                          </button>
                        ))}
                      </div>

                      <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition-all">
                        <Play size={14} /> Start Buy Fleet
                      </button>
                      <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/30 transition-all">
                        <Play size={14} /> Start Sell Fleet
                      </button>
                    </div>
                  </div>

                  {/* Wallet overview */}
                  {dashboardConfig.showWalletTracker !== false && (
                    <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                      <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Wallet Overview</h4>
                      <div className="text-center mb-4">
                        <div className="text-xs text-gray-500">Total Value</div>
                        <div className="text-3xl font-bold text-white">{systemStatus?.walletTotalValue ?? "$124,582.40"}</div>
                        <div className="text-sm text-green-400 font-semibold">{systemStatus?.walletChange ?? "+$3,241.20 (+2.67%)"}</div>
                      </div>

                      {/* Pie chart placeholder */}
                      <div className="flex items-center justify-center mb-4">
                        <div
                          className="w-24 h-24 rounded-full relative"
                          style={{
                            background:
                              "conic-gradient(from 0deg, #22c55e 0deg 90deg, #06B6D4 90deg 180deg, #8B5CF6 180deg 270deg, #F59E0B 270deg)",
                          }}
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        {walletItems.map((w) => (
                          <div key={w.asset} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-semibold">{w.asset}</span>
                              <span className="text-gray-500">{w.bal}</span>
                            </div>
                            <span className={w.chg === "—" ? "text-gray-500" : w.chg.startsWith("+") ? "text-green-400" : "text-red-400"}>
                              {w.chg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>              )}
              {/* Monitoring + Signals + Market Overview */}
              {dashboardConfig.showLiveFeed !== false && (
                <div className="grid grid-cols-3 gap-4">
                  {/* Monitoring */}
                  <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Monitoring</h4>
                    <div className="space-y-3">
                      {MONITORING_DATA.map((m) => (
                        <div key={m.label} className="border-b border-white/5 pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{m.label}</span>
                            <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300">{m.status}</span>
                          </div>
                          <div className="text-lg font-bold" style={{ color: m.color }}>
                            {m.value} {m.unit}
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-4 mt-4 text-xs text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>WS state</span>
                          <span>{isConnected ? "Connected" : "Disconnected"}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span>Last event</span>
                          <span>{lastMessageType || "none"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signals feed */}
                  <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Signals Feed</h4>
                    <div className="space-y-3">
                      {(signalFeed.length ? signalFeed : SIGNALS).map((s, index) => (
                        <div key={`${s.label}-${index}`} className="border-b border-white/5 pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{s.label}</span>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />
                          </div>
                          <div className="text-sm" style={{ color: s.color }}>
                            {s.detail}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">{formatTime(s.time)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PnL Analytics + CC Market */}
                  <div className="space-y-4">
                    {/* PnL */}
                    <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">PnL Analytics</h4>
                        <div className="flex gap-1">
                          {["Day", "Week", "Month", "Year"].map((p) => (
                            <button
                              key={p}
                              className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 border border-white/10"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{systemStatus?.pnlValue ?? "$18,742.60"}</div>
                      <div className="text-xs text-gray-500 mt-1">{systemStatus?.pnlChange ?? "+7.8%"}</div>
                    </div>

                    {/* CC Market */}
                    <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                      <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">CC Market Overview</h4>
                      <div className="space-y-2">
                        {CC_MARKET.map((m) => (
                          <div key={m.label} className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{m.label}</span>
                            <span className="font-semibold" style={{ color: m.color }}>
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio summary */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Value", value: systemStatus?.portfolioValue ?? "$124,582.40", icon: "💼", border: "#06B6D4" },
                  { label: "24h Change", value: systemStatus?.portfolioChange ?? "+$3,241.20", icon: "📈", border: "#22C55E" },
                  { label: "Win Rate", value: systemStatus?.winRate ?? "86.3%", icon: "📊", border: "#8B5CF6" },
                  { label: "Open Positions", value: activeTrades?.length ?? 7, icon: "🎯", border: "#F59E0B" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gradient-to-br from-black/40 to-black/20 border-2 rounded-xl p-4 backdrop-blur-xl flex items-center gap-3"
                    style={{ borderColor: `${item.border}33` }}
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className="text-xl font-bold text-white">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {dashboardConfig.showActiveTrades !== false && (
                <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Trades</h4>
                    <span className="text-xs text-gray-400">{activeTrades?.length ?? 0} open</span>
                  </div>
                  {activeTrades?.length ? (
                    <div className="grid grid-cols-1 gap-3">
                      {activeTrades.map((trade, index) => (
                        <div key={trade.id ?? index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm text-gray-400">{trade.market || trade.pair || "UNKNOWN"}</div>
                              <div className="text-base font-bold text-white">{trade.side || trade.status || "Pending"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Size</div>
                              <div className="text-base text-white">{trade.size || trade.amount || "—"}</div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-400">
                            <div>
                              <div>Status</div>
                              <div className="text-white">{trade.status || "ACTIVE"}</div>
                            </div>
                            <div>
                              <div>Entry</div>
                              <div className="text-white">{trade.entryPrice || trade.price || "—"}</div>
                            </div>
                            <div>
                              <div>PL</div>
                              <div className={`font-semibold ${trade.pnl?.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                                {trade.pnl ?? "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No active trades streaming yet. Live updates appear here once the engine begins publishing.</div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-gray-600 py-4 border-t border-white/5">
                <p>HFT Dashboard Pro v2.1.0 • High Frequency Trading • Built for Speed • Powered by Solana</p>
                <p className="mt-2">✓ All Systems Operational</p>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ── MOBILE LAYOUT ── */}
      {isMobile && (
        <div className="flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              HFT
            </h1>
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-gray-400" />
              <div className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
          </header>

          {/* Mobile sidebar */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)} />
              <aside className="fixed left-0 top-16 bottom-0 w-48 bg-black border-r border-white/10 z-20 overflow-auto">
                <nav className="p-3 space-y-2">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-all"
                      >
                        <Icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </>
          )}

          {/* Mobile content */}
          <main className="flex-1 overflow-auto p-4 space-y-4 pb-20">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.slice(0, 2).map((stat) => (
                <div key={stat.label} className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-green-400 mt-1">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-3 overflow-hidden" style={{ height: "200px" }}>
              <div ref={chartContainerRef} className="w-full h-full" />
            </div>

            {/* Fleet control */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold mb-3">Fleet Control</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-semibold">Buy</button>
                <button className="bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-semibold">Sell</button>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold mb-3">Portfolio</h4>
              {WALLET_DATA.map((w) => (
                <div key={w.asset} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                  <span className="text-gray-400">{w.asset}</span>
                  <span className="text-white font-semibold">{w.bal}</span>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
