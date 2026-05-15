import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Square,
  Pause,
  AlertTriangle,
  Wifi,
  Zap,
  TrendingUp,
  TrendingDown,
  Settings,
  Volume2,
  Eye,
  EyeOff,
  RefreshCw,
  Bell,
  Lock,
  Unlock,
  ChevronDown,
  Activity,
  Radar,
  BarChart3,
  Flame,
} from "lucide-react";
import { createChart } from "lightweight-charts";

// ============================================================================
// ANIMATED GRID BACKGROUND
// ============================================================================
const AnimatedGridBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 255, 157, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-gradient opacity-10" />
      {/* Animated scan lines */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
        animate={{
          y: ["0%", "100%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};

// ============================================================================
// STATUS BAR COMPONENT
// ============================================================================
const StatusBar = ({ botStatus, latency, rpcHealth, walletBalance, tps, strategiesActive }) => {
  const statusColors = {
    ONLINE: "text-green-400",
    SCANNING: "text-cyan-400",
    EXECUTING: "text-purple-400",
    IDLE: "text-amber-400",
  };

  const rpcStatusColors = {
    healthy: "text-green-400",
    degraded: "text-amber-400",
    down: "text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 border-b border-cyan-500/20 bg-black/60 backdrop-blur-xl"
    >
      <div className="px-6 py-3 grid grid-cols-7 gap-6 text-xs font-mono">
        {/* Bot Status */}
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${
              botStatus === "ONLINE"
                ? "bg-green-400"
                : botStatus === "EXECUTING"
                  ? "bg-purple-400"
                  : botStatus === "SCANNING"
                    ? "bg-cyan-400"
                    : "bg-amber-400"
            }`}
            animate={
              botStatus === "ONLINE" || botStatus === "EXECUTING"
                ? { opacity: [1, 0.5, 1] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className={statusColors[botStatus]}>
            BOT {botStatus}
          </span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-cyan-300">
            {latency}
            <span className="text-cyan-500">ms</span>
          </span>
        </div>

        {/* RPC Health */}
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${
              rpcHealth === "healthy"
                ? "bg-green-400"
                : rpcHealth === "degraded"
                  ? "bg-amber-400"
                  : "bg-red-400"
            }`}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className={rpcStatusColors[rpcHealth]}>
            RPC {rpcHealth.toUpperCase()}
          </span>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center gap-2">
          <span className="text-green-400">◆</span>
          <motion.span
            className="text-green-300"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {walletBalance}
          </motion.span>
        </div>

        {/* Network TPS */}
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-purple-400" />
          <span className="text-purple-300">
            {tps}
            <span className="text-purple-500">tps</span>
          </span>
        </div>

        {/* Active Strategies */}
        <div className="flex items-center gap-2">
          <Radar className="w-3 h-3 text-amber-400" />
          <span className="text-amber-300">
            {strategiesActive}
            <span className="text-amber-500">active</span>
          </span>
        </div>

        {/* Time */}
        <div className="text-right text-gray-400">
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            {new Date().toLocaleTimeString()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// LEFT CONTROL PANEL
// ============================================================================
const LeftControlPanel = () => {
  const [strategy, setStrategy] = useState("sniper");
  const [maxDrawdown, setMaxDrawdown] = useState(5);
  const [positionSize, setPositionSize] = useState(50);
  const [slippage, setSlippage] = useState(0.5);
  const [gasPriority, setGasPriority] = useState("turbo");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="relative z-10 w-72 border-r border-purple-500/20 bg-black/60 backdrop-blur-xl flex flex-col overflow-y-auto max-h-[calc(100vh-80px)]"
      style={{
        backgroundImage:
          "radial-gradient(circle at top right, rgba(168, 85, 247, 0.1), transparent 80%)",
      }}
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="border-b border-purple-500/20 pb-4">
          <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
            ⚙️ CONTROL CENTER
          </h2>
          <p className="text-xs text-gray-500 mt-1">Institutional Parameters</p>
        </div>

        {/* START / STOP / PAUSE Buttons */}
        <div className="space-y-3">
          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              isRunning
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70"
                : "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50 hover:shadow-green-500/70"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4" />
                STOP BOT
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                START BOT
              </>
            )}
          </motion.button>

          {isRunning && (
            <motion.button
              onClick={() => setIsPaused(!isPaused)}
              className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                isPaused
                  ? "bg-cyan-600/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-600/30"
                  : "bg-amber-600/20 border border-amber-400/50 text-amber-300 hover:bg-amber-600/30"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Pause className="w-4 h-4" />
              {isPaused ? "RESUME" : "PAUSE"}
            </motion.button>
          )}
        </div>

        {/* EMERGENCY KILL SWITCH */}
        <motion.button
          className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm rounded-lg border-2 border-red-400/50 shadow-lg shadow-red-500/50 uppercase tracking-wider flex items-center justify-center gap-2"
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 30px rgba(255, 59, 59, 0.8)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Flame className="w-4 h-4 animate-pulse" />
          KILL SWITCH
        </motion.button>

        {/* Divider */}
        <div className="border-t border-purple-500/20" />

        {/* Strategy Selector */}
        <div>
          <label className="text-xs font-semibold text-purple-300 block mb-2 uppercase">
            📊 Strategy Mode
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm text-purple-200 font-mono focus:border-purple-400/60 focus:outline-none transition"
          >
            <option value="sniper">🎯 Sniper Mode</option>
            <option value="arbitrage">⚖️ Arbitrage</option>
            <option value="momentum">🚀 Momentum</option>
            <option value="mev">🛡️ MEV Protection</option>
            <option value="grid">📈 Grid Trading</option>
          </select>
        </div>

        {/* Risk Controls */}
        <div className="space-y-4 bg-black/40 border border-purple-500/10 rounded-lg p-3">
          <p className="text-xs font-semibold text-purple-300 uppercase">🎚️ Risk Controls</p>

          {/* Max Drawdown */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Max Drawdown</label>
              <span className="text-xs font-bold text-red-400">{maxDrawdown}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>

          {/* Position Size */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Position Size</label>
              <span className="text-xs font-bold text-green-400">${positionSize}k</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={positionSize}
              onChange={(e) => setPositionSize(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>

          {/* Slippage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Max Slippage</label>
              <span className="text-xs font-bold text-cyan-400">{slippage}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Gas Priority */}
          <div>
            <label className="text-xs font-semibold text-purple-300 block mb-2 uppercase">
              ⛽ Gas Priority
            </label>
            <select
              value={gasPriority}
              onChange={(e) => setGasPriority(e.target.value)}
              className="w-full bg-black/60 border border-purple-500/30 rounded px-2 py-1 text-xs text-purple-200 focus:border-purple-400/60 focus:outline-none transition"
            >
              <option value="low">🟢 Low (100K)</option>
              <option value="medium">🟡 Medium (500K)</option>
              <option value="high">🔴 High (1M)</option>
              <option value="turbo">⚡ Turbo (5M)</option>
            </select>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between bg-black/40 border border-purple-500/10 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-300">Sound Alerts</span>
          </div>
          <motion.button
            className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/50 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <Volume2 className="w-3 h-3 text-green-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CENTER MAIN PANEL WITH CHART
// ============================================================================
const CenterMainPanel = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#00FF9D",
        },
        grid: {
          vertLines: { color: "rgba(0, 255, 157, 0.1)" },
          horzLines: { color: "rgba(0, 255, 157, 0.1)" },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "#00FF9D",
            style: 1,
            width: 1,
          },
          horzLine: {
            color: "#00FF9D",
            style: 1,
            width: 1,
          },
        },
        rightPriceScale: {
          borderColor: "rgba(0, 255, 157, 0.3)",
          textColor: "#00FF9D",
        },
        timeScale: {
          borderColor: "rgba(0, 255, 157, 0.3)",
          timeVisible: true,
          secondsVisible: true,
        },
      });

      const candleData = chart.addCandlestickSeries({
        upColor: "#00FF9D",
        downColor: "#FF3B3B",
        borderVisible: true,
        wickUpColor: "#00FF9D",
        wickDownColor: "#FF3B3B",
      });

      // Mock data
      const data = [
        { time: "2024-01-01", open: 0.0008, high: 0.0009, low: 0.0007, close: 0.00085 },
        { time: "2024-01-02", open: 0.00085, high: 0.00095, low: 0.0008, close: 0.0009 },
        { time: "2024-01-03", open: 0.0009, high: 0.0010, low: 0.00085, close: 0.00095 },
        { time: "2024-01-04", open: 0.00095, high: 0.0011, low: 0.0009, close: 0.00098 },
        { time: "2024-01-05", open: 0.00098, high: 0.0012, low: 0.00095, close: 0.0011 },
      ];

      candleData.setData(data);
      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="relative z-10 flex-1 border border-cyan-500/20 bg-black/60 backdrop-blur-xl rounded-lg overflow-hidden flex flex-col"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 60%)",
      }}
    >
      {/* Chart Header */}
      <div className="border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-cyan-300 uppercase">📊 Real-time Market</h2>
          <p className="text-xs text-gray-500">$KAT • PUMP.FUN</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-400">$0.000956</div>
          <div className="text-xs text-green-500">+211.5% 24h</div>
        </div>
      </div>

      {/* Timeframe Buttons */}
      <div className="border-b border-cyan-500/10 px-4 py-2 flex gap-1 overflow-x-auto">
        {["1s", "5s", "15s", "1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
          <motion.button
            key={tf}
            className={`px-2 py-1 text-xs rounded border transition-all ${
              tf === "5s"
                ? "bg-cyan-500/30 border-cyan-400/50 text-cyan-300"
                : "bg-transparent border-cyan-500/20 text-gray-400 hover:border-cyan-400/50"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {tf}
          </motion.button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div ref={chartContainerRef} className="absolute inset-0" />

        {/* Overlay indicators */}
        <div className="absolute top-4 right-4 z-20 space-y-2 bg-black/80 border border-cyan-500/20 rounded p-3 text-xs">
          <div className="flex items-center gap-2 text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            BUY SIGNAL
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            AI MONITORING
          </div>
        </div>
      </div>

      {/* Order Flow Heatmap */}
      <div className="border-t border-cyan-500/10 bg-black/40 px-4 py-3">
        <div className="grid grid-cols-12 gap-1 h-12">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-sm bg-gradient-to-t from-cyan-500 to-green-500 opacity-30"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Order Flow Heatmap (Last 60s)</p>
      </div>
    </motion.div>
  );
};

// ============================================================================
// RIGHT LIVE DATA STREAM
// ============================================================================
const RightLiveDataStream = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: "WHALE",
      message: "Whale moved 10M SOL to exchange",
      time: "2s ago",
      color: "text-purple-400",
      icon: "🐋",
    },
    {
      id: 2,
      type: "LAUNCH",
      message: "New token $NEON listed on Raydium",
      time: "5s ago",
      color: "text-green-400",
      icon: "🚀",
    },
    {
      id: 3,
      type: "MEV",
      message: "Sandwich attack detected on DEX",
      time: "8s ago",
      color: "text-red-400",
      icon: "⚠️",
    },
    {
      id: 4,
      type: "SWAP",
      message: "Large swap: 500K USDC → SOL",
      time: "12s ago",
      color: "text-cyan-400",
      icon: "⬌",
    },
    {
      id: 5,
      type: "SIGNAL",
      message: "AI confidence: 89% BUY opportunity",
      time: "15s ago",
      color: "text-amber-400",
      icon: "🤖",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => [
        {
          id: Date.now(),
          type: ["WHALE", "LAUNCH", "MEV", "SWAP", "SIGNAL"][
            Math.floor(Math.random() * 5)
          ],
          message: "Sample alert message",
          time: "0s ago",
          color: ["text-purple-400", "text-green-400", "text-red-400", "text-cyan-400", "text-amber-400"][
            Math.floor(Math.random() * 5)
          ],
          icon: ["🐋", "🚀", "⚠️", "⬌", "🤖"][Math.floor(Math.random() * 5)],
        },
        ...prev.slice(0, 4),
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="relative z-10 w-80 border-l border-amber-500/20 bg-black/60 backdrop-blur-xl flex flex-col overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at bottom left, rgba(251, 191, 36, 0.1), transparent 80%)",
      }}
    >
      {/* Header */}
      <div className="border-b border-amber-500/20 px-4 py-3">
        <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
          📡 Live Data Stream
        </h2>
        <p className="text-xs text-gray-500 mt-1">Institutional Market Alerts</p>
      </div>

      {/* Scrolling Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 bg-black/40 border border-amber-500/10 rounded hover:border-amber-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">{alert.type}</span>
                  <span className="text-xs text-gray-600">{alert.time}</span>
                </div>
                <p className={`text-xs font-mono ${alert.color} group-hover:font-bold transition`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Scrolling terminal prompt */}
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-xs text-cyan-400 font-mono mt-4"
        >
          ▌ awaiting signals...
        </motion.div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-amber-500/20 px-4 py-3 bg-black/40 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">24h Alerts</span>
          <span className="text-amber-400 font-bold">248</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Win Rate</span>
          <span className="text-green-400 font-bold">78.3%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Missed Trades</span>
          <span className="text-red-400 font-bold">12</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// BOTTOM EXECUTION TERMINAL
// ============================================================================
const BottomExecutionTerminal = () => {
  const [trades, setTrades] = useState([
    { id: 1, action: "BUY", token: "KAT", amount: "1000", price: "0.000842", pnl: "+$114", time: "14:32:45" },
    { id: 2, action: "SELL", token: "SOL", amount: "50", price: "142.50", pnl: "+$215", time: "14:31:22" },
    { id: 3, action: "BUY", token: "RAY", amount: "200", price: "2.145", pnl: "+$334", time: "14:29:18" },
    {
      id: 4,
      action: "FAILED",
      token: "NEON",
      amount: "500",
      price: "0.0015",
      pnl: "-$45",
      time: "14:28:05",
    },
    { id: 5, action: "BUY", token: "JUP", amount: "150", price: "0.89", pnl: "+$67", time: "14:25:33" },
  ]);

  const winRate = 80.5;
  const totalPnL = "+$685.50";
  const sessionPnL = "+$285.30";
  const dailyPnL = "+$1,245.80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative z-10 border-t border-green-500/20 bg-black/60 backdrop-blur-xl"
    >
      {/* Header & Stats */}
      <div className="px-6 py-3 border-b border-green-500/10 grid grid-cols-5 gap-6 text-xs font-mono">
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="text-green-400 font-bold text-lg">{winRate}%</p>
        </div>
        <div>
          <p className="text-gray-500">Session PnL</p>
          <p className="text-green-400 font-bold text-lg">{sessionPnL}</p>
        </div>
        <div>
          <p className="text-gray-500">Daily PnL</p>
          <p className="text-green-400 font-bold text-lg">{dailyPnL}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Trades</p>
          <p className="text-cyan-400 font-bold text-lg">{trades.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Latency</p>
          <p className="text-purple-400 font-bold text-lg">12.5ms</p>
        </div>
      </div>

      {/* Trade Logs */}
      <div className="px-6 py-3 overflow-x-auto max-h-32">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-green-500/10 text-gray-500">
              <th className="text-left py-2">TIME</th>
              <th className="text-left">ACTION</th>
              <th className="text-left">TOKEN</th>
              <th className="text-right">AMOUNT</th>
              <th className="text-right">PRICE</th>
              <th className="text-right">PnL</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <motion.tr
                key={trade.id}
                className={`border-b border-green-500/5 hover:bg-green-500/5 transition ${
                  trade.action === "FAILED" ? "opacity-50" : ""
                }`}
                whileHover={{ backgroundColor: "rgba(0, 255, 157, 0.05)" }}
              >
                <td className="py-2 text-gray-400">{trade.time}</td>
                <td className={`font-bold ${
                  trade.action === "BUY"
                    ? "text-green-400"
                    : trade.action === "SELL"
                      ? "text-red-400"
                      : "text-amber-400"
                }`}>
                  {trade.action}
                </td>
                <td className="text-cyan-400">${trade.token}</td>
                <td className="text-right text-gray-300">{trade.amount}</td>
                <td className="text-right text-gray-300">${trade.price}</td>
                <td className={`text-right font-bold ${
                  trade.pnl.startsWith("+") ? "text-green-400" : "text-red-400"
                }`}>
                  {trade.pnl}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN HFT TERMINAL SYSTEM COMPONENT
// ============================================================================
export default function HFTTerminalSystem() {
  const [botStatus, setBotStatus] = useState("SCANNING");
  const [latency, setLatency] = useState(4.2);
  const [rpcHealth, setRpcHealth] = useState("healthy");
  const [walletBalance, setWalletBalance] = useState("24.5 SOL / 1,245 USDC");
  const [tps, setTps] = useState(1450);
  const [strategiesActive, setStrategiesActive] = useState(3);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => prev + (Math.random() - 0.5) * 2);
      setTps((prev) => Math.max(100, prev + (Math.random() - 0.5) * 200));
      setBotStatus(["ONLINE", "SCANNING", "EXECUTING", "IDLE"][Math.floor(Math.random() * 4)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070A12] via-[#0B0F1A] to-[#070A12] text-white overflow-hidden font-mono">
      {/* Animated Grid Background */}
      <AnimatedGridBackground />

      {/* Main Content */}
      <div className="relative z-5 flex flex-col h-screen">
        {/* Status Bar */}
        <StatusBar
          botStatus={botStatus}
          latency={latency.toFixed(1)}
          rpcHealth={rpcHealth}
          walletBalance={walletBalance}
          tps={tps.toFixed(0)}
          strategiesActive={strategiesActive}
        />

        {/* Main Layout: Left Panel | Center Chart | Right Stream */}
        <div className="flex-1 flex gap-0 overflow-hidden">
          <LeftControlPanel />

          <div className="flex-1 flex flex-col gap-4 p-4 min-w-0">
            <CenterMainPanel />
          </div>

          <RightLiveDataStream />
        </div>

        {/* Bottom Execution Terminal */}
        <BottomExecutionTerminal />
      </div>

      {/* Global Noise Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 seed=%222%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23noise)%22/></svg>')",
        }}
      />
    </div>
  );
}
