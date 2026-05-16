import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, CheckCircle, Layers } from "lucide-react";

const NEON = {
  green: "#00FF9D",
  red: "#FF3B3B",
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FBBF24",
};

export default function MempoolTransactionViewer() {
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
}
