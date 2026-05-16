import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, CheckCircle, AlertCircle } from "lucide-react";

const NEON = {
  cyan: "#22D3EE",
  green: "#00FF9D",
  purple: "#8B5CF6",
  amber: "#FBBF24",
  red: "#FF3B3B",
};

export default function LiveDataStream() {
  const [events, setEvents] = useState([
    { id: 1, type: "whale", text: "Whale moved 500 SOL -> FEX9wD", time: "00:12:45", color: "purple" },
    { id: 2, type: "token", text: "New Token: MEME (Ca: 7hX...) 18 SOL liquidity", time: "00:11:30", color: "amber" },
    { id: 3, type: "swap", text: "Large Swap: 1000 BONK -> 12.5 SOL", time: "00:10:15", color: "cyan" },
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
          "Whale moved 250 SOL -> New Wallet",
          "New Token launched: 10M supply",
          "Arbitrage opportunity detected",
          "MEV opportunity in mempool",
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
}
