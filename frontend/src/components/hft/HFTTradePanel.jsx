import { useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

function HFTTradePanel() {
  const [activeTab, setActiveTab] = useState("buy");
  const [amount, setAmount] = useState("");
  const [strategy, setStrategy] = useState("market");
  const [slippage, setSlippage] = useState("0.5");
  const [priority, setPriority] = useState("medium");
  const [tokenMint, setTokenMint] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const strategies = [
    { id: "market", name: "Market Order", icon: "⚡" },
    { id: "limit", name: "Limit Order", icon: "📌" },
    { id: "dca", name: "DCA Strategy", icon: "📊" },
    { id: "sniper", name: "Sniper Mode", icon: "🎯" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Tabs */}
      <div className="flex border-b border-purple-500/20">
        {["buy", "sell"].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-medium text-sm transition flex items-center justify-center space-x-2 ${
              activeTab === tab
                ? tab === "buy"
                  ? "bg-green-500/20 text-green-400 border-b-2 border-green-400"
                  : "bg-red-500/20 text-red-400 border-b-2 border-red-400"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab === "buy" ? (
              <ArrowDown className="w-4 h-4" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
            <span>{tab.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Strategy Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-xs font-semibold text-gray-400 block mb-2">
            STRATEGY
          </label>
          <motion.select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
            whileFocus={{ scale: 1.02 }}
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </motion.select>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-xs font-semibold text-gray-400 block mb-2">
            AMOUNT (SOL)
          </label>
          <motion.input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-3 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition placeholder-gray-600"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
            }}
          />
        </motion.div>

        {/* Token Mint for Prediction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-xs font-semibold text-gray-400 block mb-2">
            TOKEN MINT
          </label>
          <motion.div className="grid grid-cols-[1fr_auto] gap-2">
            <motion.input
              type="text"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              placeholder="Paste token mint"
              className="w-full px-3 py-3 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition placeholder-gray-600"
              whileFocus={{ scale: 1.02 }}
            />
            <motion.button
              type="button"
              onClick={async () => {
                if (!tokenMint) return;
                setIsPredicting(true);
                try {
                  const response = await axios.post("/api/ai/predict", {
                    tokenMint,
                  });
                  const data = response.data.data || response.data;
                  setPrediction(data);
                } catch (error) {
                  console.error("Prediction failed:", error);
                  setPrediction({
                    score: "Error",
                    recommendation: "N/A",
                    confidence: "N/A",
                  });
                } finally {
                  setIsPredicting(false);
                }
              }}
              className="bg-purple-500/20 text-purple-200 px-4 rounded-lg hover:bg-purple-500/40 transition"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isPredicting ? "Predicting…" : "Predict"}
            </motion.button>
          </motion.div>
          {prediction && (
            <div className="mt-3 p-3 rounded-lg bg-white/5 border border-purple-500/20 text-xs text-gray-200">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-white">Signal Score</span>
                <span className="text-purple-300">{prediction.score}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Recommendation</span>
                <span className="text-green-300">
                  {prediction.recommendation}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Confidence</span>
                <span className="text-blue-300">{prediction.confidence}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Slippage */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">
              SLIPPAGE %
            </label>
            <motion.input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              step="0.1"
              className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
              whileFocus={{ scale: 1.02 }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">
              PRIORITY
            </label>
            <motion.select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
              whileFocus={{ scale: 1.02 }}
            >
              <option value="low">Low (100K)</option>
              <option value="medium">Medium (500K)</option>
              <option value="high">High (1M+)</option>
              <option value="turbo">Turbo (5M+)</option>
            </motion.select>
          </div>
        </motion.div>

        {/* Advanced Options */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.label
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-purple-500"
              defaultChecked
            />
            <span>Jito Bundle</span>
          </motion.label>
          <motion.label
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <input type="checkbox" className="w-4 h-4 accent-purple-500" />
            <span>MEV Protection</span>
          </motion.label>
        </motion.div>

        {/* Execute Button */}
        <motion.button
          disabled={!amount}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
            activeTab === "buy"
              ? amount
                ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/50 hover:shadow-green-500/70"
                : "bg-green-600/40 text-green-400/60 cursor-not-allowed"
              : amount
                ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70"
                : "bg-red-600/40 text-red-400/60 cursor-not-allowed"
          }`}
          whileHover={amount ? { scale: 1.02, y: -2 } : {}}
          whileTap={amount ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Zap className="w-4 h-4" />
          <span>{activeTab === "buy" ? "BUY NOW" : "SELL NOW"}</span>
        </motion.button>

        {/* Info */}
        <motion.div
          className="pt-2 border-t border-purple-500/20 text-xs text-gray-500 space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between">
            <span>Est. Output:</span>
            <span className="text-purple-400">
              {amount ? (amount * 168.35).toFixed(2) : "0"} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Fee (0.25%):</span>
            <span className="text-purple-400">
              ${(amount * 168.35 * 0.0025).toFixed(4)}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default HFTTradePanel;
