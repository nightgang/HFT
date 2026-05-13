import { Menu, LogOut, Zap, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import AutoTradeToggle from "./AutoTradeToggle";

function KatanaHeader({ onMenuClick, sidebarOpen, stats }) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-black/60 via-purple-900/20 to-black/60 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onMenuClick}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition text-purple-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <div>
            <motion.h1
              className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              HFT ⚔️ KATANA MODE
            </motion.h1>
            <p className="text-xs text-gray-500">Ultra Fast Solana Trading</p>
          </div>
        </div>

        {/* Center Section - Network Status */}
        <div className="hidden lg:flex items-center space-x-6 text-xs">
          <motion.div
            className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-green-400">Mainnet Connected</span>
          </motion.div>
          <motion.div
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Wifi className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">Helius RPC: Ready</span>
          </motion.div>
          <motion.div
            className="flex items-center space-x-2 px-3 py-2 bg-pink-500/10 border border-pink-500/30 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-3 h-3 text-pink-400" />
            <span className="text-pink-400">Jupiter: Connected</span>
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-500">Latency</div>
            <div className="text-sm font-bold text-green-400">42ms</div>
          </div>
          <AutoTradeToggle ws={null} onStatusChange={(status) => {}} />
          <motion.button
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 rounded-lg text-purple-300 text-sm font-medium transition relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 hover:opacity-20"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="relative">Katana Mode: ON</span>
          </motion.button>
          <motion.button
            className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

export default KatanaHeader;
