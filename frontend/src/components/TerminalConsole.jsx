import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, Wifi, WifiOff, Activity, Cpu, Zap } from 'lucide-react';
import LiveFeedTerminal from './LiveFeedTerminal';
import ActiveTradesTerminal from './ActiveTradesTerminal';
import SystemLogsTerminal from './SystemLogsTerminal';
import WalletSummaryTerminal from './WalletSummaryTerminal';
import TerminalStatusBar from './TerminalStatusBar';

const TerminalConsole = ({ isCollapsed = false }) => {
  const [activeSection, setActiveSection] = useState('live-feed');
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock WebSocket connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.05); // 95% uptime
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    { id: 'live-feed', label: 'LIVE FEED', component: LiveFeedTerminal },
    { id: 'active-trades', label: 'ACTIVE TRADES', component: ActiveTradesTerminal },
    { id: 'system-logs', label: 'SYSTEM LOGS', component: SystemLogsTerminal },
    { id: 'wallet-summary', label: 'WALLET SUMMARY', component: WalletSummaryTerminal },
  ];

  const ActiveComponent = sections.find(section => section.id === activeSection)?.component;

  return (
    <motion.div
      className={`mx-6 mb-6 bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl shadow-purple-500/10 ${
        isCollapsed ? 'h-12' : 'min-h-[400px]'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal Header */}
      <div className="p-4 border-b border-purple-500/20 bg-gradient-to-r from-slate-900/80 to-black/80 relative overflow-hidden">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-green-400 font-mono tracking-wider">
              HFT-SYSTEM TERMINAL
            </h3>
            <div className="text-xs text-purple-400 font-mono">v2.1.7</div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wifi className="w-4 h-4 text-green-400" />
                </motion.div>
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300 font-mono">RPC</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs text-gray-300 font-mono">WS</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        {!isCollapsed && (
          <div className="flex gap-1 mt-4">
            {sections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-xs font-mono border-b-2 transition-all duration-200 ${
                  activeSection === section.id
                    ? 'border-green-400 text-green-400 bg-green-400/10'
                    : 'border-transparent text-gray-400 hover:text-green-400 hover:border-green-400/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {section.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Terminal Content */}
      {!isCollapsed && (
        <div className="relative">
          {/* Matrix Rain Background Effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="matrix-rain"></div>
          </div>

          {/* Active Section Content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <TerminalStatusBar isCollapsed={isCollapsed} />
    </motion.div>
  );
};

export default TerminalConsole;