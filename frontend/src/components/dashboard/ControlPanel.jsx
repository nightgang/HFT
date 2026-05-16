import React, { useState } from "react";
import { motion } from "framer-motion";
import { Square, Play, Pause, Flame, ChevronDown, Crosshair, Zap, TrendingUp, Lock } from "lucide-react";

const NEON = {
  green: "#00FF9D",
  red: "#FF3B3B",
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FBBF24",
};

export default function ControlPanel() {
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
    { id: "arbitrage", label: "ARBITRAGE", icon: Zap },
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
          <h2 className="text-cyan-400 font-mono font-bold text-base md:text-lg">Control Center</h2>
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
          Kill Switch
        </motion.button>

        <div className="border-t border-cyan-500/20 pt-6">
          <h3 className="text-cyan-400 text-xs font-bold uppercase mb-3">Select Strategy</h3>
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
            <h3 className="text-cyan-400 text-xs font-bold uppercase">Risk Settings</h3>
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
                <label className="text-xs text-gray-400 block mb-2">Gas Priority</label>
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
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
