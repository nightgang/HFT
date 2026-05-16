import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, Cpu, Zap, Clock, BarChart3 } from 'lucide-react';

const TerminalStatusBar = ({ isCollapsed = false }) => {
  const [metrics, setMetrics] = useState({
    latency: 28,
    tps: 4823,
    blockHeight: 275642311,
    networkStatus: 'Mainnet',
    rpcStatus: 'Connected',
    wsStatus: 'Active',
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        latency: Math.floor(20 + Math.random() * 20), // 20-40ms
        tps: Math.floor(4000 + Math.random() * 1000), // 4000-5000 TPS
        blockHeight: prev.blockHeight + Math.floor(Math.random() * 3), // Increment by 0-2
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isCollapsed) {
    return (
      <div className="px-4 py-2 bg-slate-900/80 border-t border-green-400/30 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-3 h-3" />
          </motion.div>
            <span>HFT-SYSTEM TERMINAL</span>
          <span className="text-gray-500">●</span>
          <span>ACTIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-slate-900/80 border-t border-green-400/30 relative overflow-hidden">
      {/* Subtle scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent animate-pulse pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs font-mono">
        {/* Latency */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Activity className="w-3 h-3 text-cyan-400" />
          </motion.div>
          <span className="text-gray-400">Latency:</span>
          <span className={`font-bold ${
            metrics.latency < 30 ? 'text-green-400' :
            metrics.latency < 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.latency}ms
          </span>
        </div>

        {/* TPS */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3 text-purple-400" />
          <span className="text-gray-400">TPS:</span>
          <span className="text-purple-400 font-bold">
            {metrics.tps.toLocaleString()}
          </span>
        </div>

        {/* Block Height */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Cpu className="w-3 h-3 text-green-400" />
          </motion.div>
          <span className="text-gray-400">Block:</span>
          <span className="text-green-400 font-bold">
            {metrics.blockHeight.toLocaleString()}
          </span>
        </div>

        {/* Network Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            metrics.networkStatus === 'Mainnet' ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          <span className="text-gray-400">Network:</span>
          <span className="text-green-400 font-bold">
            {metrics.networkStatus}
          </span>
        </div>

        {/* RPC Status */}
        <div className="flex items-center gap-2">
          {metrics.rpcStatus === 'Connected' ? (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-3 h-3 text-green-400" />
            </motion.div>
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className="text-gray-400">RPC:</span>
          <span className={`font-bold ${
            metrics.rpcStatus === 'Connected' ? 'text-green-400' : 'text-red-400'
          }`}>
            {metrics.rpcStatus}
          </span>
        </div>

        {/* WebSocket Status */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
          </motion.div>
          <span className="text-gray-400">WS:</span>
          <span className={`font-bold ${
            metrics.wsStatus === 'Active' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {metrics.wsStatus}
          </span>
        </div>

        {/* Current Time */}
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-400">Time:</span>
          <span className="text-green-400 font-bold">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-600 font-mono text-center">
        Press <span className="text-cyan-400">[CTRL+T]</span> for terminal | <span className="text-purple-400">[F11]</span> fullscreen | <span className="text-green-400">[ESC]</span> exit
      </div>
    </div>
  );
};

export default TerminalStatusBar;