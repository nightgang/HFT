import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle } from "lucide-react";

export default function CopyTradingSignalFeed() {
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
      style={{ borderColor: "rgba(34,211,238,0.15)", boxShadow: `0 20px 60px 20px` }}
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
}
