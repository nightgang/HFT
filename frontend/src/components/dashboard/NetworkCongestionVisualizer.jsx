import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gauge, CheckCircle, AlertCircle } from "lucide-react";

export default function NetworkCongestionVisualizer() {
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
  const congestionColor = congestion.current < 40
    ? "from-green-400"
    : congestion.current < 70
      ? "from-amber-400"
      : "from-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-3xl bg-black/20 backdrop-blur-3xl overflow-hidden"
      style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px 14px` }}
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 bg-black/60">
        <h3 className="text-cyan-400 font-mono font-bold flex items-center gap-2">
          <Gauge size={14} className="text-cyan-500" />
          NETWORK CONGESTION
        </h3>
        <p className="text-xs text-gray-500 mt-1">Real-time Solana network metrics</p>
      </div>

      <div className="p-6 space-y-4">
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
}
