import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart } from "lightweight-charts";
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
  Terminal as TerminalIcon,
  Bot,
  Cpu,
  Gauge,
  Crosshair,
  Layers,
  Zap as ZapIcon,
} from "lucide-react";

// ============================================================================
// CYBERPUNK GRID BACKGROUND WITH VIGNETTE & NOISE
// ============================================================================
const CyberpunkGridBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Main grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial gradient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />

      {/* Animated scan lines */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2' /%3E%3C/filter%3E%3Crect width='400' height='400' fill='%23fff' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

// ============================================================================
// REAL-TIME STATUS BAR WITH LIVE METRICS
// ============================================================================
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

  // Simulate real-time metric updates
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
    ONLINE: "text-green-400",
    SCANNING: "text-cyan-400",
    EXECUTING: "text-purple-400",
    IDLE: "text-amber-400",
  };

  const rpcStatusColors = {
    healthy: "text-green-400 bg-green-400/10",
    degraded: "text-amber-400 bg-amber-400/10",
    down: "text-red-400 bg-red-400/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20 border-b border-cyan-500/20 bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-xl"
    >
      <div className="px-8 py-4 grid grid-cols-7 gap-8 text-xs font-mono">
        {/* Bot Status */}
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-2 h-2 rounded-full ${
              metrics.botStatus === "ONLINE"
                ? "bg-green-400"
                : metrics.botStatus === "EXECUTING"
                  ? "bg-purple-400"
                  : metrics.botStatus === "SCANNING"
                    ? "bg-cyan-400"
                    : "bg-amber-400"
            }`}
            animate={
              metrics.botStatus !== "IDLE"
                ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div>
            <div className="text-gray-400">BOT</div>
            <div className={statusColors[metrics.botStatus]}>{metrics.botStatus}</div>
          </div>
        </div>

        {/* Latency */}
        <div>
          <div className="text-gray-400">LATENCY</div>
          <motion.div className="text-cyan-400 text-sm font-bold" key={Math.floor(metrics.latency)}>
            {metrics.latency.toFixed(1)}ms
          </motion.div>
        </div>

        {/* RPC Health */}
        <div>
          <div className="text-gray-400">RPC HEALTH</div>
          <div className={`px-2 py-1 rounded text-center text-xs ${rpcStatusColors[metrics.rpcHealth]}`}>
            {metrics.rpcHealth.toUpperCase()}
          </div>
        </div>

        {/* Wallet Balance */}
        <div>
          <div className="text-gray-400">WALLET</div>
          <div className="text-green-400">
            {metrics.walletBalance.sol.toFixed(2)} SOL
          </div>
          <div className="text-xs text-purple-400">
            ${metrics.walletBalance.usdc.toFixed(0)}
          </div>
        </div>

        {/* Network TPS */}
        <div>
          <div className="text-gray-400">NETWORK TPS</div>
          <motion.div className="text-amber-400 text-sm font-bold" key={metrics.tps}>
            {Math.floor(metrics.tps)}
          </motion.div>
        </div>

        {/* Active Strategies */}
        <div>
          <div className="text-gray-400">STRATEGIES</div>
          <div className="text-purple-400 text-sm font-bold">{metrics.strategiesActive}</div>
        </div>

        {/* Timestamp */}
        <div>
          <div className="text-gray-400">TIME</div>
          <motion.div
            className="text-cyan-400 text-sm font-bold"
            key={metrics.timestamp.getSeconds()}
          >
            {metrics.timestamp.toLocaleTimeString()}
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50"
        animate={{ width: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

// ============================================================================
// LEFT CONTROL PANEL - TRADING CONTROLS & RISK MANAGEMENT
// ============================================================================
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
      className="w-80 border-r border-cyan-500/20 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-xl overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center border-b border-cyan-500/20 pb-4">
          <h2 className="text-cyan-400 font-mono font-bold text-lg">⚙️ CONTROL CENTER</h2>
          <p className="text-xs text-gray-500 mt-1">Command & Strategy</p>
        </div>

        {/* Main Controls */}
        <div className="space-y-3">
          {/* Start Bot */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setBotRunning(!botRunning)}
            className={`w-full py-3 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
              botRunning
                ? "bg-red-600 text-white border border-red-400/50 shadow-lg shadow-red-500/30"
                : "bg-green-600 text-white border border-green-400/50 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {botRunning ? <Square size={16} /> : <Play size={16} />}
              {botRunning ? "STOP BOT" : "START BOT"}
            </div>
          </motion.button>

          {/* Pause/Resume */}
          {botRunning && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setPaused(!paused)}
              className={`w-full py-3 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
                paused
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-400/50"
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

        {/* Emergency Kill Switch */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={emergencyStop}
          className="w-full py-4 rounded-lg font-mono text-sm font-bold bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-400 shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Flame size={18} />
          ⚡ KILL SWITCH ⚡
        </motion.button>

        {/* Strategy Selector */}
        <div className="border-t border-cyan-500/20 pt-6">
          <h3 className="text-cyan-400 text-xs font-bold mb-3 uppercase">📊 Select Strategy</h3>
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
                  {strategy.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Risk Controls */}
        <div className="border-t border-cyan-500/20 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-cyan-400 text-xs font-bold uppercase">🎚️ Risk Settings</h3>
            <motion.button
              whileHover={{ rotate: 180 }}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-400 hover:text-purple-300"
            >
              <ChevronDown size={16} style={{ rotate: showAdvanced ? "180deg" : "0deg" }} />
            </motion.button>
          </div>

          <div className="space-y-3">
            {/* Max Drawdown */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400">Max Drawdown</label>
                <span className="text-amber-400 text-xs font-bold">{riskSettings.maxDrawdown}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={riskSettings.maxDrawdown}
                onChange={(e) =>
                  setRiskSettings({ ...riskSettings, maxDrawdown: parseInt(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Position Size */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400">Position Size</label>
                <span className="text-green-400 text-xs font-bold">{riskSettings.positionSize}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={riskSettings.positionSize}
                onChange={(e) =>
                  setRiskSettings({ ...riskSettings, positionSize: parseInt(e.target.value) })
                }
                className="w-full accent-green-400 cursor-pointer"
              />
            </div>

            {/* Slippage */}
            <div>
              <div className="flex justify-between items-center mb-1">
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

            {/* Gas Priority */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">⛽ Gas Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {["low", "medium", "high"].map((priority) => (
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CENTER MAIN PANEL - CANDLESTICK CHART & MARKET DATA
// ============================================================================
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

      // Generate sample candlestick data
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
    }

    // Simulate new candles
    const interval = setInterval(() => {
      if (chartRef.current && chartRef.current.candlestickSeries) {
        const lastCandle = chartData[chartData.length - 1];
        if (lastCandle) {
          const newPrice = lastCandle.close + (Math.random() - 0.5) * 0.5;
          const newCandle = {
            time: lastCandle.time + 60,
            open: lastCandle.close,
            high: newPrice + Math.random() * 0.5,
            low: newPrice - Math.random() * 0.5,
            close: newPrice,
          };
          chartRef.current.candlestickSeries.update(newCandle);
          setChartData((prev) => [...prev.slice(1), newCandle]);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chartData]);

  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const tradingPairs = ["SOL/USDC", "BONK/USDC", "JTO/USDC", "ORCA/USDC"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col border-r border-cyan-500/20 bg-gradient-to-b from-black/40 to-black/20"
    >
      {/* Header Controls */}
      <div className="border-b border-cyan-500/20 px-6 py-4 flex justify-between items-center bg-black/40">
        {/* Trading Pair Selector */}
        <div className="flex gap-2">
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

        {/* Timeframe Selector */}
        <div className="flex gap-1">
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
        </div>

        {/* Refresh */}
        <motion.button
          whileHover={{ rotate: 180 }}
          className="text-cyan-400 hover:text-cyan-300"
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <div
          ref={chartContainerRef}
          className="w-full h-full rounded-lg border border-cyan-500/20 bg-black/60 backdrop-blur-sm overflow-hidden"
        />
      </div>

      {/* Chart Indicators */}
      <div className="px-6 py-3 border-t border-cyan-500/20 bg-black/40 grid grid-cols-4 gap-4 text-xs">
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

// ============================================================================
// RIGHT LIVE DATA STREAM - REAL-TIME ALERTS & EVENTS
// ============================================================================
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
        text:
          [
            "🐋 Whale moved 250 SOL → New Wallet",
            "🆕 New Token launched: 10M supply",
            "📊 Arbitrage opportunity detected",
            "⚡ MEV opportunity in mempool",
          ][Math.floor(Math.random() * 4)],
        time: new Date().toLocaleTimeString(),
        color: ["purple", "amber", "cyan", "green"][Math.floor(Math.random() * 4)],
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 14)]);
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
      className="w-96 border-l border-cyan-500/20 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Radar size={14} className="text-cyan-500 animate-pulse" />
          LIVE DATA STREAM
        </h3>
        <p className="text-xs text-gray-500 mt-1">Real-time market intelligence</p>
      </div>

      {/* Events Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        <AnimatePresence>
          {events.map((event, index) => (
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

        {/* Blinking cursor */}
        <div className="mt-4 text-cyan-400">
          {"> "} <span style={{ opacity: blinkingCursor ? 1 : 0 }}>_</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-cyan-500/20 px-4 py-3 bg-black/60 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Connected • Live</span>
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// BOTTOM EXECUTION TERMINAL - TRADE LOG & PERFORMANCE METRICS
// ============================================================================
const ExecutionTerminal = () => {
  const [trades, setTrades] = useState([
    { id: 1, type: "BUY", token: "BONK", amount: "50K", price: "0.00024", time: "14:23:45", pnl: null },
    { id: 2, type: "SELL", token: "JTO", amount: "500", price: "2.15", time: "14:20:12", pnl: "+$45.20" },
    { id: 3, type: "BUY", token: "ORCA", amount: "100", price: "1.23", time: "14:18:30", pnl: null },
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
        pnl: Math.random() > 0.6 ? `+$${Math.random() * 100}` : null,
      };

      setTrades((prev) => [newTrade, ...prev.slice(0, 11)]);

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
      className="border-t border-cyan-500/20 bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-xl"
    >
      {/* Terminal Header */}
      <div className="px-8 py-4 border-b border-cyan-500/20 flex items-center gap-3 bg-black/60">
        <TerminalIcon size={16} className="text-green-400 animate-pulse" />
        <h3 className="font-mono font-bold text-cyan-400">EXECUTION TERMINAL</h3>
        <div className="flex-1" />
        <div className="text-xs text-gray-500">Live trading log</div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-8">
        {/* Trade History */}
        <div className="col-span-8">
          <div className="border border-cyan-500/20 rounded-lg bg-black/40 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-black/60 border-b border-cyan-500/20 text-xs font-mono text-gray-400 font-bold">
              <div>TYPE</div>
              <div>TOKEN</div>
              <div>AMOUNT</div>
              <div>PRICE</div>
              <div>TIME</div>
              <div>P&L</div>
            </div>

            {/* Trades */}
            <div className="max-h-48 overflow-y-auto">
              {trades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-mono border-b border-cyan-500/10 hover:bg-black/60 transition-colors"
                >
                  <div className={trade.type === "BUY" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {trade.type}
                  </div>
                  <div className="text-cyan-300">{trade.token}</div>
                  <div className="text-gray-300">{trade.amount}</div>
                  <div className="text-amber-300">${trade.price}</div>
                  <div className="text-gray-400">{trade.time}</div>
                  <div className={trade.pnl ? "text-green-400 font-bold" : "text-gray-500"}>
                    {trade.pnl || "-"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="col-span-4 space-y-3">
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

      {/* Bottom Status Line */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/40 to-cyan-500/20"
        animate={{ backgroundPosition: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT - HFT TERMINAL SYSTEM
// ============================================================================
export default function HFTTerminalSystem() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#070A12] to-[#0B0F1A] overflow-hidden text-gray-100 font-mono">
      {/* Cyberpunk Background */}
      <CyberpunkGridBackground />

      {/* Main Layout */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Status Bar */}
        <StatusBar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <ControlPanel />

          {/* Center Panel */}
          <MainPanel />

          {/* Right Panel */}
          <LiveDataStream />
        </div>

        {/* Bottom Terminal */}
        <ExecutionTerminal />
      </div>
    </div>
  );
}
