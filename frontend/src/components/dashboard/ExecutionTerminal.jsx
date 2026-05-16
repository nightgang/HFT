import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Play, Pause, Square, Flame } from "lucide-react";

const NEON = {
  green: "#00FF9D",
  red: "#FF3B3B",
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FBBF24",
};

export default function ExecutionTerminal() {
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
        <Radar size={16} className="text-green-400 animate-pulse" />
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
}
