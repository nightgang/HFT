import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart } from "lightweight-charts";
import TerminalConsole from "../components/TerminalConsole";
import HFTLiveFeed from "../components/HFTLiveFeed";
import HFTWalletTracker from "../components/HFTWalletTracker";
import HFTTradePanel from "../components/HFTTradePanel";
import {
  useGetActiveTrades,
  useGetSystemStatus,
} from "../hooks";
import {
  LayoutDashboard,
  Terminal,
  Zap,
  Wallet,
  Target,
  Briefcase,
  FileText,
  History,
  BarChart3,
  Brain,
  Settings,
  Puzzle,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Play,
  Pause,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Square,
  RefreshCw,
  Lock,
  ChevronDown,
  Radar,
  Flame,
  Terminal as TerminalIcon,
  Crosshair,
  Zap as ZapIcon,
  Layers,
  TrendingUpIcon,
  Copy,
  CheckCircle,
  AlertCircle,
  Gauge,
  Zap as ZapSmall,
} from "lucide-react";

const NEON = {
  green: "#00FF9D",
  red: "#FF3B3B",
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FBBF24",
  bg1: "#070A12",
  bg2: "#0B0F1A",
};

const MempoolTransactionViewer = () => {
  const [mempool, setMempool] = useState([
    { id: 1, hash: "3hX9d...8Zq2", from: "Auth...Q7nK", to: "Prog...5L9Z", amount: "2.5 SOL", fee: 0.00005, priority: "critical", status: "pending", timestamp: "14:23:45" },
    { id: 2, hash: "7mK2w...5Ry4", from: "User...A3kP", to: "Auth...Q7nK", amount: "12.0 USDC", fee: 0.00003, priority: "high", status: "confirmed", timestamp: "14:23:40" },
    { id: 3, hash: "9pL4x...2Xy1", from: "Bot...Z8Qr", to: "Prog...5L9Z", amount: "50 BONK", fee: 0.00001, priority: "low", status: "pending", timestamp: "14:23:35" },
    { id: 4, hash: "2qJ6v...7Wn3", from: "Auth...Q7nK", to: "User...A3kP", amount: "5.25 SOL", fee: 0.00002, priority: "high", status: "pending", timestamp: "14:23:30" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
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
      setMempool((prev) => [newTx, ...(prev || []).slice(0, 7)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const priorityColors = {
    low: "border-l-gray-500 text-gray-300 bg-gray-500/5",
    medium: "border-l-amber-500 text-amber-300 bg-amber-500/5",
    high: "border-l-purple-500 text-purple-300 bg-purple-500/5",
    critical: "border-l-red-500 text-red-300 bg-red-500/5",
  };

  const statusIcons = {
    pending: <Radar size={14} className="animate-spin text-amber-400" />,
    confirmed: <CheckCircle size={14} className="text-green-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
      style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.cyan}14` }}
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Layers size={14} className="text-cyan-500" />
          MEMPOOL VIEWER
        </h3>
        <p className="text-xs text-gray-500 mt-1">Real-time transaction monitoring</p>
      </div>

      <div className="max-h-64 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
        <AnimatePresence>
          {mempool.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-2 border-l-4 rounded-r bg-black/40 hover:bg-black/60 transition-all cursor-pointer ${priorityColors[tx.priority]}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-cyan-300 font-bold">{tx.hash}</span>
                <div className="flex items-center gap-2">
                  {statusIcons[tx.status]}
                  <span className="text-gray-500">{tx.timestamp}</span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2 text-[10px] text-gray-400">
                <span>{tx.from} → {tx.to}</span>
                <span className="text-green-400">{tx.amount}</span>
                <span className="text-purple-300">Fee: {tx.fee}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CopyTradingSignalFeed = () => {
  const [signals, setSignals] = useState([
    { id: 1, trader: "🐋 WhaleMaster", action: "BUY", token: "BONK", amount: "500K", confidence: 94, pnl: "+$2,450", followers: 1284, timestamp: "14:23:45" },
    { id: 2, trader: "⚡ MomentumKing", action: "BUY", token: "JTO", amount: "2000", confidence: 87, pnl: "+$1,120", followers: 892, timestamp: "14:23:30" },
    { id: 3, trader: "🔥 AlphaBot", action: "SELL", token: "ORCA", amount: "500", confidence: 92, pnl: "+$890", followers: 2145, timestamp: "14:23:15" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal = {
        id: Date.now(),
        trader: ["🐋 WhaleMaster", "⚡ MomentumKing", "🔥 AlphaBot", "🤖 GridBot"][Math.floor(Math.random() * 4)],
        action: Math.random() > 0.5 ? "BUY" : "SELL",
        token: ["BONK", "JTO", "ORCA", "COPE"][Math.floor(Math.random() * 4)],
        amount: `${Math.floor(Math.random() * 10000)}${Math.random() > 0.5 ? "K" : ""}`,
        confidence: Math.floor(Math.random() * 15) + 80,
        pnl: `+$${Math.floor(Math.random() * 5000)}`,
        followers: Math.floor(Math.random() * 2000) + 500,
        timestamp: new Date().toLocaleTimeString(),
      };
      setSignals((prev) => [newSignal, ...(prev || []).slice(0, 5)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (conf) => {
    if (conf >= 92) return "text-green-400 bg-green-500/10";
    if (conf >= 85) return "text-cyan-400 bg-cyan-500/10";
    return "text-amber-400 bg-amber-500/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
      style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.purple}14` }}
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Copy size={14} className="text-purple-500" />
          COPY TRADING SIGNALS
        </h3>
        <p className="text-xs text-gray-500 mt-1">Top traders' latest moves</p>
      </div>

      <div className="max-h-64 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        <AnimatePresence>
          {signals.map((signal) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-3 border border-purple-500/20 bg-black/40 rounded-lg hover:bg-black/60 transition-all cursor-pointer hover:border-purple-400/40"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-purple-300 font-bold">{signal.trader}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${signal.action === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
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
                <span className={`px-2 py-1 rounded font-bold ${getConfidenceColor(signal.confidence)}`}>
                  Confidence: {signal.confidence}%
                </span>
                <span className="text-gray-500">{signal.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const NetworkCongestionVisualizer = () => {
  const [congestion, setCongestion] = useState({
    current: 32,
    tps: 1200,
    avgLatency: 2.3,
    maxLatency: 8.5,
    failureRate: 0.12,
    networkHealth: "healthy",
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

  const healthColor = congestion.networkHealth === "healthy" ? "text-green-400" : "text-amber-400";
  const congestionColor = congestion.current < 40 ? "from-green-400" : congestion.current < 70 ? "from-amber-400" : "from-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
      style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.cyan}14` }}
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Gauge size={14} className="text-cyan-500" />
          NETWORK CONGESTION
        </h3>
        <p className="text-xs text-gray-500 mt-1">Real-time Solana network metrics</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Congestion meter */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Network Congestion</span>
            <motion.span className={`text-sm font-bold ${congestion.current < 40 ? "text-green-400" : congestion.current < 70 ? "text-amber-400" : "text-red-400"}`}>
              {congestion.current.toFixed(0)}%
            </motion.span>
          </div>
          <div className="h-3 rounded-full bg-black/40 border border-cyan-500/20 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${congestionColor} to-cyan-400`}
              animate={{ width: `${congestion.current}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Status indicators grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
            <div className="text-[10px] text-gray-400 mb-1">TPS</div>
            <motion.div className="text-lg font-bold text-cyan-400" key={Math.floor(congestion.tps)}>
              {Math.floor(congestion.tps)}
            </motion.div>
          </div>
          <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
            <div className="text-[10px] text-gray-400 mb-1">AVG LATENCY</div>
            <motion.div className="text-lg font-bold text-purple-400" key={Math.floor(congestion.avgLatency * 10)}>
              {congestion.avgLatency.toFixed(1)}ms
            </motion.div>
          </div>
          <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
            <div className="text-[10px] text-gray-400 mb-1">MAX LATENCY</div>
            <motion.div className="text-lg font-bold text-amber-400" key={Math.floor(congestion.maxLatency * 10)}>
              {congestion.maxLatency.toFixed(1)}ms
            </motion.div>
          </div>
          <div className="bg-black/40 border border-cyan-500/10 rounded-lg p-3">
            <div className="text-[10px] text-gray-400 mb-1">FAILURE RATE</div>
            <motion.div className="text-lg font-bold text-red-400" key={Math.floor(congestion.failureRate * 100)}>
              {congestion.failureRate.toFixed(2)}%
            </motion.div>
          </div>
        </div>

        {/* Health status */}
        <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-500/10 rounded-lg">
          <span className="text-xs text-gray-400">Network Health</span>
          <div className={`flex items-center gap-2 ${healthColor}`}>
            {congestion.networkHealth === "healthy" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            <span className="text-sm font-bold uppercase">{congestion.networkHealth}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CyberpunkGridBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* subtle matrix grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          mixBlendMode: "overlay",
        }}
      />

      {/* animated scanning band */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${NEON.cyan}11 40%, transparent 80%)` }}
        animate={{ y: ["-10%", "110%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {/* radial vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />

      {/* noise texture */}
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
};

const StatusBar = () => {
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
  }, []);

  const statusColors = {
    ONLINE: "text-[#00FF9D]",
    SCANNING: "text-[#22D3EE]",
    EXECUTING: "text-[#8B5CF6]",
    IDLE: "text-[#FBBF24]",
  };

  const rpcStatusColors = {
    healthy: "text-green-400 bg-green-400/10",
    degraded: "text-amber-400 bg-amber-400/10",
    down: "text-red-400 bg-red-400/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full bg-gradient-to-br from-black/40 via-black/25 to-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(34,211,238,0.1)]"
      style={{ boxShadow: `0 20px 60px ${NEON.cyan}14, inset 0 1px 0 rgba(255,255,255,0.05)`, borderLeft: `2px solid rgba(139,92,246,0.12)` }}
    >
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-[11px] font-mono">
        <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${
              metrics.botStatus === "ONLINE"
                ? "bg-green-400"
                : metrics.botStatus === "EXECUTING"
                ? "bg-purple-400"
                : metrics.botStatus === "SCANNING"
                ? "bg-cyan-400"
                : "bg-amber-400"
            } shadow-lg`}
            animate={
              metrics.botStatus !== "IDLE"
                ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div>
            <div className="text-gray-400 text-[10px] uppercase tracking-wider">BOT</div>
            <div className={`${statusColors[metrics.botStatus]} font-bold`}>{metrics.botStatus}</div>
          </div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">LATENCY</div>
          <motion.div className="text-[#22D3EE] text-sm font-bold" key={Math.floor(metrics.latency)}>
            {metrics.latency.toFixed(1)}ms
          </motion.div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">RPC HEALTH</div>
          <div className={`px-2 py-1 rounded text-center text-xs font-semibold ${rpcStatusColors[metrics.rpcHealth]}`}>
            {metrics.rpcHealth === "healthy" ? "✓" : "!"} {metrics.rpcHealth.toUpperCase()}
          </div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">WALLET</div>
          <div className="text-[#00FF9D] font-semibold">{metrics.walletBalance.sol.toFixed(2)} SOL</div>
          <div className="text-[10px] text-[#8B5CF6] font-semibold">${metrics.walletBalance.usdc.toFixed(0)}</div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg md:col-span-1 sm:col-span-2 md:col-span-1">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">NETWORK TPS</div>
          <motion.div className="text-[#FBBF24] text-sm font-bold" key={metrics.tps}>
            {Math.floor(metrics.tps)}
          </motion.div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">STRATEGIES</div>
          <div className="text-purple-400 text-sm font-bold">{metrics.strategiesActive}</div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">TIME</div>
          <motion.div className="text-[#22D3EE] text-sm font-bold" key={metrics.timestamp.getSeconds()}>
            {metrics.timestamp.toLocaleTimeString()}
          </motion.div>
        </div>
      </div>
      <motion.div
        className="h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

const ControlPanel = () => {
  const [botRunning, setBotRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("sniper");
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 5,
    positionSize: 50,
    slippage: 0.5,
    gasPriority: "high",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const strategies = [
    { id: "sniper", label: "SNIPER", icon: Crosshair },
    { id: "arbitrage", label: "ARBITRAGE", icon: ZapIcon },
    { id: "momentum", label: "MOMENTUM", icon: TrendingUp },
    { id: "mev", label: "MEV SHIELD", icon: Lock },
  ];

  const emergencyStop = () => {
    setBotRunning(false);
    setPaused(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full border border-white/10 bg-gradient-to-br from-black/40 via-black/20 to-black/40 backdrop-blur-xl rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-400/20 hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)]"
      style={{ boxShadow: `0 20px 60px ${NEON.purple}14, inset 0 1px 0 rgba(255,255,255,0.05)` }}
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center border-b border-cyan-500/20 pb-4">
          <h2 className="text-cyan-400 font-mono font-bold text-base md:text-lg">⚙️ CONTROL CENTER</h2>
          <p className="text-xs text-gray-500 mt-1">Command & Strategy</p>
        </div>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setBotRunning(!botRunning)}
            className={`w-full py-3 px-4 rounded-lg font-mono text-sm font-bold transition-all duration-200`}
            style={{
              background: botRunning
                ? `linear-gradient(135deg, ${NEON.red}, rgba(255,59,59,0.8))`
                : `linear-gradient(135deg, ${NEON.green}, rgba(0,255,157,0.8))`,
              color: "#041018",
              boxShadow: botRunning ? `0 12px 30px ${NEON.red}55, inset 0 1px 0 rgba(255,255,255,0.2)` : `0 12px 30px ${NEON.green}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
              border: `1px solid rgba(255,255,255,0.1)`,
            }}
          >
            <div className="flex items-center justify-center gap-2">
              {botRunning ? <Square size={16} /> : <Play size={16} />}
              {botRunning ? "STOP BOT" : "START BOT"}
            </div>
          </motion.button>

          {botRunning && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setPaused(!paused)}
              className={`w-full py-3 px-4 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
                paused
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-600/30"
                  : "bg-amber-600/20 text-amber-300 border border-amber-400/50 hover:bg-amber-600/30"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {paused ? <Play size={16} /> : <Pause size={16} />}
                {paused ? "RESUME" : "PAUSE"}
              </div>
            </motion.button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={emergencyStop}
          className="w-full py-4 px-4 rounded-lg font-mono text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: `radial-gradient(circle at 25% 25%, rgba(255,59,59,0.95), ${NEON.red})`,
            boxShadow: `0 16px 48px ${NEON.red}66, inset 0 1px 0 rgba(255,255,255,0.1)`,
            border: `1px solid rgba(255,59,59,0.2)`,
          }}
        >
          <Flame size={18} />
          ⚡ KILL SWITCH ⚡
        </motion.button>

        <div className="border-t border-cyan-500/20 pt-6">
          <h3 className="text-cyan-400 text-xs font-bold uppercase mb-3">📊 Select Strategy</h3>
          <div className="grid grid-cols-2 gap-2">
            {strategies.map((strategy) => {
              const Icon = strategy.icon;
              return (
                <motion.button
                  key={strategy.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 text-xs font-mono ${
                    selectedStrategy === strategy.id
                      ? "bg-purple-500/30 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20"
                      : "bg-black/40 border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline text-[10px]">{strategy.label}</span>
                  <span className="sm:hidden text-[10px]">{strategy.label.substring(0, 3)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-cyan-500/20 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-cyan-400 text-xs font-bold uppercase">🎚️ Risk Settings</h3>
            <motion.button
              whileHover={{ rotate: 180 }}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-400 hover:text-purple-300"
            >
              <ChevronDown size={16} style={{ rotate: showAdvanced ? "180deg" : "0deg", transition: "rotate 0.3s" }} />
            </motion.button>
          </div>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-400">Max Drawdown</label>
                  <span className="text-amber-400 text-xs font-bold">{riskSettings.maxDrawdown}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={riskSettings.maxDrawdown}
                  onChange={(e) =>
                    setRiskSettings({ ...riskSettings, maxDrawdown: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-400">Position Size</label>
                  <span className="text-green-400 text-xs font-bold">{riskSettings.positionSize}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={riskSettings.positionSize}
                  onChange={(e) =>
                    setRiskSettings({ ...riskSettings, positionSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-green-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-400">Max Slippage</label>
                  <span className="text-cyan-400 text-xs font-bold">{riskSettings.slippage}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={riskSettings.slippage}
                  onChange={(e) =>
                    setRiskSettings({ ...riskSettings, slippage: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">⛽ Gas Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <motion.button
                      key={priority}
                      onClick={() => setRiskSettings({ ...riskSettings, gasPriority: priority })}
                      className={`py-1 rounded text-xs font-mono transition-all ${
                        riskSettings.gasPriority === priority
                          ? "bg-purple-500/40 text-purple-300 border border-purple-400"
                          : "bg-black/40 text-gray-400 border border-gray-600 hover:border-purple-400"
                      }`}
                    >
                      {priority.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MainPanel = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [selectedPair, setSelectedPair] = useState("SOL/USDC");
  const [timeframe, setTimeframe] = useState("1m");

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "#070a12" },
          textColor: "#d1d5db",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
        },
        grid: {
          horzLines: { color: "#1a1a2e" },
          vertLines: { color: "#1a1a2e" },
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#00FF9D",
        downColor: "#FF3B3B",
        borderUpColor: "#00FF9D",
        borderDownColor: "#FF3B3B",
        wickUpColor: "#00FF9D",
        wickDownColor: "#FF3B3B",
      });

      const generateCandles = () => {
        const data = [];
        let price = 140;
        const now = Math.floor(Date.now() / 1000);
        for (let i = 100; i >= 0; i--) {
          const change = (Math.random() - 0.5) * 2;
          price += change;
          data.push({
            time: now - i * 60,
            open: price,
            high: price + Math.random() * 1,
            low: price - Math.random() * 1,
            close: price + (Math.random() - 0.5) * 0.5,
          });
        }
        return data;
      };

      const initialData = generateCandles();
      candlestickSeries.setData(initialData);
      chart.timeScale().fitContent();
      chartRef.current = { chart, candlestickSeries };
      setChartData(initialData);

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        if (!chartRef.current || !chartRef.current.candlestickSeries || prev.length === 0) {
          return prev;
        }
        const lastCandle = prev[prev.length - 1];
        const newPrice = lastCandle.close + (Math.random() - 0.5) * 0.5;
        const newCandle = {
          time: lastCandle.time + 60,
          open: lastCandle.close,
          high: newPrice + Math.random() * 0.5,
          low: newPrice - Math.random() * 0.5,
          close: newPrice,
        };
        chartRef.current.candlestickSeries.update(newCandle);
        return [...(prev || []).slice(1), newCandle];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const tradingPairs = ["SOL/USDC", "BONK/USDC", "JTO/USDC", "ORCA/USDC"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col border-r border-cyan-500/10 bg-black/20 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,255,157,0.06)]"
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-black/40">
        <div className="flex flex-wrap gap-2">
          {tradingPairs.map((pair) => (
            <motion.button
              key={pair}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                selectedPair === pair
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400"
                  : "bg-black/50 text-gray-400 border border-gray-700 hover:border-cyan-400"
              }`}
            >
              {pair}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 items-center">
          {timeframes.map((tf) => (
            <motion.button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                timeframe === tf
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-black/50 text-gray-400 hover:text-purple-300"
              }`}
            >
              {tf}
            </motion.button>
          ))}
          <motion.button whileHover={{ rotate: 180 }} className="text-cyan-400 hover:text-cyan-300">
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 p-4 relative">
        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300 shadow-[0_18px_60px_rgba(34,211,238,0.08)]">
            <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Order Flow</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#00FF9D]">BUY 68%</span>
              <span className="text-sm font-semibold text-[#FF3B3B]">SELL 32%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#00FF9D] via-[#22D3EE] to-[#FF3B3B]" style={{ width: '68%' }} />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300 shadow-[0_18px_60px_rgba(139,92,246,0.08)]">
            <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Liquidity Zones</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-cyan-300">High</span>
              <span className="text-sm text-gray-400">3 zones</span>
            </div>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="rounded-full bg-white/5 px-2 py-1">Bid wall at 0.0009</div>
              <div className="rounded-full bg-white/5 px-2 py-1">Ask wall at 0.0011</div>
            </div>
          </div>
        </div>
        <div
          ref={chartContainerRef}
          className="w-full h-full rounded-lg border bg-black/60 backdrop-blur-sm overflow-hidden relative"
          style={{ borderColor: "rgba(34,211,238,0.06)", boxShadow: `0 12px 40px ${NEON.cyan}10` }}
        >
          {/* order-flow heatmap overlay (visual placeholder, pointer-events-none) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-20" />
            <motion.div
              className="absolute left-1/2 top-10 w-96 h-48 rounded-lg mix-blend-overlay opacity-20"
              style={{ background: `radial-gradient(circle at 30% 30%, ${NEON.green}33, transparent 30%), linear-gradient(90deg, ${NEON.red}12, ${NEON.cyan}12)` }}
              animate={{ x: [0, 8, -8, 0], opacity: [0.12, 0.24, 0.12] }}
              transition={{ duration: 6, repeat: Infinity }}
            />

            {/* buy/sell arrows */}
            <div className="absolute right-8 bottom-16 text-xs text-[#00FF9D] font-bold animate-pulse">▲ BUY</div>
            <div className="absolute left-8 bottom-24 text-xs text-[#FF3B3B] font-bold animate-pulse">▼ SELL</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-cyan-500/20 bg-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400">24H HIGH</span>
          <div className="text-green-400 font-bold">$142.50</div>
        </div>
        <div>
          <span className="text-gray-400">24H LOW</span>
          <div className="text-red-400 font-bold">$138.20</div>
        </div>
        <div>
          <span className="text-gray-400">VOLUME</span>
          <div className="text-cyan-400 font-bold">$234.5M</div>
        </div>
        <div>
          <span className="text-gray-400">24H CHANGE</span>
          <div className="text-green-400 font-bold">+2.34%</div>
        </div>
      </div>
    </motion.div>
  );
};

const LiveDataStream = () => {
  const [events, setEvents] = useState([
    { id: 1, type: "whale", text: "🐋 Whale moved 500 SOL → FEX9wD", time: "00:12:45", color: "purple" },
    { id: 2, type: "token", text: "🆕 New Token: MEME (Ca: 7hX...) 18 SOL liquidity", time: "00:11:30", color: "amber" },
    { id: 3, type: "swap", text: "📊 Large Swap: 1000 BONK → 12.5 SOL", time: "00:10:15", color: "cyan" },
  ]);
  const [blinkingCursor, setBlinkingCursor] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => setBlinkingCursor((prev) => !prev), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const eventInterval = setInterval(() => {
      const newEvent = {
        id: Date.now(),
        type: ["whale", "token", "swap", "mev"][Math.floor(Math.random() * 4)],
        text: [
          "🐋 Whale moved 250 SOL → New Wallet",
          "🆕 New Token launched: 10M supply",
          "📊 Arbitrage opportunity detected",
          "⚡ MEV opportunity in mempool",
        ][Math.floor(Math.random() * 4)],
        time: new Date().toLocaleTimeString(),
        color: ["purple", "amber", "cyan", "green"][Math.floor(Math.random() * 4)],
      };
      setEvents((prev) => [newEvent, ...(prev || []).slice(0, 14)]);
    }, 2000);
    return () => clearInterval(eventInterval);
  }, []);

  const colorMap = {
    purple: "border-l-purple-500 text-purple-300",
    amber: "border-l-amber-500 text-amber-300",
    cyan: "border-l-cyan-500 text-cyan-300",
    green: "border-l-green-500 text-green-300",
    red: "border-l-red-500 text-red-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full border-l bg-black/20 backdrop-blur-3xl flex flex-col overflow-hidden rounded-3xl"
      style={{ borderLeft: "1px solid rgba(34,211,238,0.15)", boxShadow: `0 20px 60px ${NEON.cyan}14` }}
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Radar size={14} className="text-cyan-500 animate-pulse" />
          LIVE DATA STREAM
        </h3>
        <p className="text-xs text-gray-500 mt-1">Real-time market intelligence</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs" style={{ color: NEON.cyan }}>
        <AnimatePresence>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-3 border-l-4 bg-black/40 rounded-r-lg ${colorMap[event.color]} hover:bg-black/60 transition-all cursor-pointer`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">{event.text}</div>
                <span className="text-gray-500 flex-shrink-0">{event.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="mt-4 text-cyan-400">{"> "} <span style={{ opacity: blinkingCursor ? 1 : 0 }}>_</span></div>
      </div>

      <div className="border-t border-cyan-500/20 px-4 py-3 bg-black/60 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Connected • Live</span>
          <motion.div className="w-2 h-2 bg-green-400 rounded-full" animate={{ opacity: [0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        </div>
      </div>
    </motion.div>
  );
};

const ExecutionTerminal = () => {
  const [trades, setTrades] = useState([
    { id: 1, type: "BUY", token: "BONK", amount: "50K", price: "0.00024", time: "14:23:45", pnl: null, confidence: 92 },
    { id: 2, type: "SELL", token: "JTO", amount: "500", price: "2.15", time: "14:20:12", pnl: "+$45.20", confidence: 87 },
    { id: 3, type: "BUY", token: "ORCA", amount: "100", price: "1.23", time: "14:18:30", pnl: null, confidence: 78 },
  ]);
  const [stats, setStats] = useState({
    winRate: 68.5,
    totalPnL: 1245.5,
    sessionPnL: 340.25,
    avgLatency: 2.1,
    tradesExecuted: 23,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const newTrade = {
        id: Date.now(),
        type: Math.random() > 0.5 ? "BUY" : "SELL",
        token: ["BONK", "JTO", "ORCA", "COPE"][Math.floor(Math.random() * 4)],
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t bg-black/20 backdrop-blur-3xl rounded-3xl overflow-hidden"
      style={{ borderTop: `1px solid rgba(34,211,238,0.1)`, boxShadow: `0 -20px 80px ${NEON.purple}22` }}
    >
      <div className="px-8 py-4 border-b border-cyan-500/20 flex items-center gap-3 bg-black/60">
        <TerminalIcon size={16} className="text-green-400 animate-pulse" />
        <h3 className="font-mono font-bold text-cyan-400">EXECUTION TERMINAL</h3>
        <div className="flex-1" />
        <div className="text-xs text-gray-500">Live trading log</div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-8">
        <div className="col-span-12 xl:col-span-8">
          <div className="border rounded-lg bg-black/40 overflow-hidden" style={{ borderColor: "rgba(34,211,238,0.06)" }}>
            <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-black/60 border-b border-cyan-500/20 text-xs font-mono text-gray-400 font-bold">
              <div>TYPE</div>
              <div>TOKEN</div>
              <div>AMOUNT</div>
              <div>PRICE</div>
              <div>CONFIDENCE</div>
              <div>TIME</div>
              <div>P&L</div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-7 gap-4 px-6 py-3 text-xs font-mono border-b border-cyan-500/10 hover:bg-black/60 transition-colors"
                >
                  <div className={trade.type === "BUY" ? "text-[#00FF9D] font-bold" : "text-[#FF3B3B] font-bold"}>
                    {trade.type}
                  </div>
                  <div className="text-cyan-300">{trade.token}</div>
                  <div className="text-gray-300">{trade.amount}</div>
                  <div className="text-amber-300">${trade.price}</div>
                  <div className={`font-bold px-2 py-1 rounded ${
                    trade.confidence >= 90 ? "bg-green-500/20 text-green-400" : 
                    trade.confidence >= 80 ? "bg-cyan-500/20 text-cyan-400" : 
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {trade.confidence}%
                  </div>
                  <div className="text-gray-400">{trade.time}</div>
                  <div className={trade.pnl ? "text-[#00FF9D] font-bold" : "text-gray-500"}>{trade.pnl || "-"}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-3">
          <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-mono">WIN RATE</div>
            <motion.div className="text-2xl font-bold text-green-400" key={Math.floor(stats.winRate)}>
              {stats.winRate.toFixed(1)}%
            </motion.div>
          </div>
          <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-mono">SESSION P&L</div>
            <motion.div className="text-2xl font-bold text-green-400" key={Math.floor(stats.sessionPnL)}>
              +${stats.sessionPnL.toFixed(2)}
            </motion.div>
          </div>
          <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-mono">TOTAL TRADES</div>
            <motion.div className="text-2xl font-bold text-cyan-400" key={stats.tradesExecuted}>
              {stats.tradesExecuted}
            </motion.div>
          </div>
          <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-mono">AVG LATENCY</div>
            <motion.div className="text-2xl font-bold text-purple-400" key={Math.floor(stats.avgLatency * 10)}>
              {stats.avgLatency.toFixed(1)}ms
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        className="h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/40 to-cyan-500/20"
        animate={{ backgroundPosition: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

const HFTDashboard = ({ dashboardConfig: dashboardConfigProp }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardConfig, setDashboardConfig] = useState({
    showStatsCards: true,
    showTradePanel: true,
    showLiveFeed: true,
    showWalletTracker: true,
    showActiveTrades: true,
  });
  const { data: activeTrades = [], isLoading: tradesLoading, error: tradesError } = useGetActiveTrades();
  const { data: systemStatus } = useGetSystemStatus();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const storedUiConfig = window.localStorage.getItem("uiPreferences");
    if (storedUiConfig) {
      try {
        const parsed = JSON.parse(storedUiConfig);
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
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#a855f7",
        },
        grid: {
          vertLines: { color: "#1a1a2e" },
          horzLines: { color: "#1a1a2e" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "#a855f7",
        },
        timeScale: {
          borderColor: "#a855f7",
          timeVisible: true,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#00ff88",
        downColor: "#a855f7",
        borderVisible: false,
        wickUpColor: "#00ff88",
        wickDownColor: "#a855f7",
      });

      const data = [
        { time: "2024-01-01", open: 0.0008, high: 0.0009, low: 0.0007, close: 0.00085 },
        { time: "2024-01-02", open: 0.00085, high: 0.00095, low: 0.0008, close: 0.0009 },
        { time: "2024-01-03", open: 0.0009, high: 0.0010, low: 0.00085, close: 0.00095 },
        { time: "2024-01-04", open: 0.00095, high: 0.0011, low: 0.0009, close: 0.00098 },
        { time: "2024-01-05", open: 0.00098, high: 0.0012, low: 0.00095, close: 0.0011 },
      ];
      candlestickSeries.setData(data);
      chartRef.current = chart;

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
    return undefined;
  }, [sidebarCollapsed]);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "trade", label: "Trade", icon: Zap },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "sniper", label: "Sniper", icon: Target },
    { id: "positions", label: "Positions", icon: Briefcase },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "history", label: "History", icon: History },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "strategies", label: "Strategies", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "plugins", label: "Plugins", icon: Puzzle },
  ];

  const rpcHealthLabel = systemStatus?.rpcHealth ? systemStatus.rpcHealth.toUpperCase() : "HEALTHY";

  const statsCards = [
    { label: "Total PNL", value: "$18,742.60", change: "+7.8%", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Win Rate", value: "86.3%", change: "+4.2%", icon: Activity, color: "text-emerald-400" },
    { label: "Total Volume", value: "$127.4K", change: "+12.5%", icon: DollarSign, color: "text-cyan-400" },
    { label: "Active Trades", value: tradesLoading ? "…" : `${activeTrades.length}`, change: "Realtime", icon: ZapIcon, color: "text-purple-400" },
    { label: "RPC Health", value: rpcHealthLabel, change: systemStatus?.latency ? `${systemStatus.latency.toFixed(1)}ms` : "—", icon: Wifi, color: rpcHealthLabel === "HEALTHY" ? "text-green-400" : "text-amber-400" },
    { label: "Priority Fee", value: "0.000005", change: "Optimal", icon: Shield, color: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050510] via-[#0a0a1a] to-[#050510] text-white overflow-hidden relative">
      <CyberpunkGridBackground />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,136,0.03),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: sidebarCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-70 bg-black/80 backdrop-blur-xl border-r border-purple-500/20 z-50"
      >
        <div className="p-6 border-b border-purple-500/20">
          <motion.h1
            className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            HFT-SYSTEM
          </motion.h1>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.id === "monitoring") {
                  window.open("/monitoring", "_blank");
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-purple-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/20"
                  : "hover:bg-purple-500/10 border border-transparent"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-purple-400" : "text-gray-400"}`} />
              <span className={`text-sm ${activeTab === item.id ? "text-white" : "text-gray-300"}`}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <motion.button
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-500/30 border border-purple-400/30"
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-mono">HFT-SYSTEM</span>
            </div>
          </motion.button>
        </div>

        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-purple-400" /> : <ChevronLeft className="w-4 h-4 text-purple-400" />}
        </motion.button>
      </motion.div>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-0" : "ml-70"}`}>
        <header className="bg-black/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-[0_30px_90px_rgba(34,211,238,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                HFT-SYSTEM
              </h1>
              <p className="text-gray-400 text-sm mt-1">Ultra-fast Solana trading command center for Solana HFT.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/10 bg-white/5 px-3 py-1 text-cyan-200 tracking-[0.12em]">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  HFT-SYSTEM AI ONLINE
                </span>
                <span className="rounded-full border border-purple-500/10 bg-purple-500/10 px-3 py-1 text-purple-200">HFT-SYSTEM Strategy Suite</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-gray-300">RPC</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm text-gray-300">WS</span>
              </div>
              <div className="text-sm text-gray-400 font-mono">{currentTime.toLocaleTimeString()}</div>
              <div className="inline-flex items-center gap-2 rounded-3xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Congestion 32%
              </div>
              <motion.a
                href="/monitoring"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Monitoring</span>
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            </div>
          </div>

          {dashboardConfig.showStatsCards && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {statsCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="group relative bg-gradient-to-br from-black/50 via-black/30 to-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_20px_60px_rgba(34,211,238,0.15)]"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <card.icon className={`w-5 h-5 ${card.color} transition-transform group-hover:scale-110`} />
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.change.startsWith("+") ? "bg-green-500/20 text-green-300" : card.change.startsWith("-") ? "bg-red-500/20 text-red-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                        {card.change}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white mb-1 transition-colors group-hover:text-cyan-300">{card.value}</div>
                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{card.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </header>

        <StatusBar />

        <div className="p-6 grid grid-cols-12 gap-6 min-h-[calc(100vh-340px)]">
          <motion.div
            className={`col-span-12 ${!dashboardConfig.showTradePanel && !dashboardConfig.showLiveFeed && !dashboardConfig.showWalletTracker ? "lg:col-span-12" : !dashboardConfig.showTradePanel && (dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) ? "lg:col-span-9" : dashboardConfig.showTradePanel && !(dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) ? "lg:col-span-10" : "lg:col-span-7"} bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-purple-500/20 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">$HFT – HFT Token</h2>
                <div className="text-sm text-gray-400">Current: $0.000956 <span className="text-green-400">+211%</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h'].map((tf) => (
                  <button
                    key={tf}
                    className="px-3 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded transition-colors"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div ref={chartContainerRef} className="h-96 w-full" />
          </motion.div>

          {dashboardConfig.showTradePanel && (
            <motion.div className="col-span-12 lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <HFTTradePanel />
            </motion.div>
          )}

          {(dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) && (
            <motion.div className="col-span-12 lg:col-span-3 space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              {dashboardConfig.showLiveFeed && <HFTLiveFeed />}
              {dashboardConfig.showWalletTracker && <HFTWalletTracker />}
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-xs text-gray-300 shadow-[0_18px_60px_rgba(34,211,238,0.08)]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">HFT-SYSTEM AI</div>
                    <div className="text-sm font-bold text-white">Signal Feed</div>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200 text-[10px]">93% Confidence</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-5">High-conviction MEV signal detected. Monitor mempool latency and prepare execution lane.</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                  <span className="rounded-full bg-white/5 px-2 py-1">AI +3.2</span>
                  <span className="rounded-full bg-white/5 px-2 py-1">Mempool</span>
                  <span className="rounded-full bg-white/5 px-2 py-1">Signal Live</span>
                </div>
              </div>
            </motion.div>
          )}

          {dashboardConfig.showActiveTrades && (
            <motion.div className="col-span-12 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-lg font-bold text-white">ACTIVE TRADES</h3>
              </div>
              <div className="overflow-x-auto">
                {tradesLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">Loading active trades...</div>
                ) : tradesError ? (
                  <div className="p-6 text-center text-sm text-red-400">{tradesError}</div>
                ) : activeTrades.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">No active trades available right now.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Current</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">PNL</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">PNL %</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrades.map((trade, index) => {
                        const type = trade.side?.toUpperCase?.() || trade.type || "BUY";
                        const token = trade.token || trade.market || trade.symbol || "UNKNOWN";
                        const amount = trade.amount || trade.quantity || "-";
                        const entry = trade.entryPrice || trade.price || trade.entry || "-";
                        const current = trade.currentPrice || trade.current || "-";
                        const pnl = trade.pnl || trade.profit || "-";
                        const pnlPercent = trade.pnlPercent || trade.returnPercent || "-";
                        return (
                          <motion.tr
                            key={trade.id || `${token}-${index}`}
                            className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors"
                            whileHover={{ backgroundColor: "rgba(168, 85, 247, 0.05)" }}
                          >
                            <td className="px-4 py-3 text-sm text-white font-medium">{token}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">${entry}</td>
                            <td className="px-4 py-3 text-sm text-white">${current}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnl}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnlPercent}</td>
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

        <div className="px-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-3">
              <ControlPanel />
            </div>
            <div className="col-span-12 xl:col-span-6">
              <MainPanel />
            </div>
            <div className="col-span-12 xl:col-span-3">
              <LiveDataStream />
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <MempoolTransactionViewer />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <CopyTradingSignalFeed />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <NetworkCongestionVisualizer />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <ExecutionTerminal />
        </div>

        <div className="px-6 pb-10">
          <TerminalConsole />
        </div>
      </div>
    </div>
  );
};

export default HFTDashboard;
