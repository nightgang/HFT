import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

const NEON = {
  cyan: "#22D3EE",
  purple: "#8B5CF6",
  green: "#00FF9D",
  red: "#FF3B3B",
  amber: "#FBBF24",
};

export default function StatusBar() {
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
}
