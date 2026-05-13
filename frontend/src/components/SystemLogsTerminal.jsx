import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Wifi, Shield, Zap, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const SystemLogsTerminal = () => {
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  // Mock system logs data
  const mockSystemLogs = [
    { id: 1, time: '13:01:10', level: 'INFO', component: 'RPC', message: 'Connected to Helius RPC', status: 'success', icon: Wifi },
    { id: 2, time: '13:01:10', level: 'INFO', component: 'API', message: 'Connected to Jupiter API', status: 'success', icon: CheckCircle },
    { id: 3, time: '13:01:10', level: 'INFO', component: 'RELAY', message: 'Jito Relay Active', status: 'success', icon: Zap },
    { id: 4, time: '13:01:10', level: 'INFO', component: 'WS', message: 'WebSocket Connected', status: 'success', icon: Wifi },
    { id: 5, time: '13:01:11', level: 'INFO', component: 'MEV', message: 'MEV Protection: ON', status: 'success', icon: Shield },
    { id: 6, time: '13:01:11', level: 'INFO', component: 'AUTO', message: 'Auto Buy Enabled', status: 'success', icon: CheckCircle },
    { id: 7, time: '13:01:12', level: 'INFO', component: 'AUTO', message: 'Auto Sell Enabled', status: 'success', icon: CheckCircle },
    { id: 8, time: '13:01:12', level: 'INFO', component: 'RISK', message: 'Risk Protection Active', status: 'success', icon: Shield },
    { id: 9, time: '13:01:13', level: 'WARNING', component: 'NETWORK', message: 'High network congestion detected', status: 'warning', icon: AlertTriangle },
    { id: 10, time: '13:01:14', level: 'INFO', component: 'FEE', message: 'Priority fee auto-adjusted: 0.000005 SOL', status: 'info', icon: Cpu },
  ];

  // Simulate real-time system log updates
  useEffect(() => {
    const interval = setInterval(() => {
      const systemEvents = [
        { level: 'INFO', component: 'RPC', message: 'RPC health check passed', status: 'success', icon: Wifi },
        { level: 'INFO', component: 'WS', message: 'WebSocket heartbeat received', status: 'success', icon: Wifi },
        { level: 'INFO', component: 'MEV', message: 'MEV protection scan completed', status: 'success', icon: Shield },
        { level: 'INFO', component: 'FEE', message: 'Fee optimization updated', status: 'info', icon: Cpu },
        { level: 'WARNING', component: 'NETWORK', message: 'Network latency spike detected', status: 'warning', icon: AlertTriangle },
        { level: 'ERROR', component: 'API', message: 'Temporary API rate limit', status: 'error', icon: XCircle },
      ];

      const randomEvent = systemEvents[Math.floor(Math.random() * systemEvents.length)];
      const newLog = {
        ...randomEvent,
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, 4000 + Math.random() * 6000); // Random interval between 4-10 seconds

    // Initial load
    setLogs(mockSystemLogs);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'WARNING': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'INFO': return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
      case 'SUCCESS': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getComponentColor = (component) => {
    switch (component) {
      case 'RPC': return 'text-blue-400';
      case 'API': return 'text-purple-400';
      case 'WS': return 'text-cyan-400';
      case 'MEV': return 'text-green-400';
      case 'AUTO': return 'text-yellow-400';
      case 'RISK': return 'text-red-400';
      case 'NETWORK': return 'text-orange-400';
      case 'FEE': return 'text-pink-400';
      case 'RELAY': return 'text-indigo-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      case 'info': return Cpu;
      default: return Clock;
    }
  };

  return (
    <div className="p-4 font-mono text-sm bg-black min-h-[300px] relative">
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-400/30">
        <Cpu className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">SYSTEM INFRASTRUCTURE</span>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500">Real-time monitoring</div>
      </div>

      {/* Logs Container */}
      <div
        ref={scrollRef}
        className="space-y-1 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {logs.map((log, index) => {
            const StatusIcon = getStatusIcon(log.status);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`flex items-center gap-2 p-2 rounded border ${getLevelColor(log.level)} hover:shadow-md transition-all duration-200`}
              >
                {/* Status Icon */}
                <StatusIcon className={`w-3 h-3 flex-shrink-0 ${
                  log.status === 'success' ? 'text-green-400' :
                  log.status === 'warning' ? 'text-yellow-400' :
                  log.status === 'error' ? 'text-red-400' : 'text-cyan-400'
                }`} />

                {/* Timestamp */}
                <div className="text-xs text-gray-500 font-mono min-w-[70px]">
                  [{log.time}]
                </div>

                {/* Level Badge */}
                <div className={`px-2 py-0.5 text-xs font-bold rounded border min-w-[60px] text-center ${
                  log.level === 'ERROR' ? 'bg-red-400/20 text-red-400 border-red-400/50' :
                  log.level === 'WARNING' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50' :
                  log.level === 'INFO' ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50' :
                  'bg-green-400/20 text-green-400 border-green-400/50'
                }`}>
                  {log.level}
                </div>

                {/* Component */}
                <div className={`text-xs font-bold min-w-[60px] ${getComponentColor(log.component)}`}>
                  [{log.component}]
                </div>

                {/* Message */}
                <div className="flex-1 text-green-400 font-mono text-sm">
                  {log.message}
                </div>

                {/* Animated indicator for new logs */}
                {index === 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-400' :
                      log.status === 'warning' ? 'bg-yellow-400' :
                      log.status === 'error' ? 'bg-red-400' : 'bg-cyan-400'
                    } animate-ping`}
                  ></motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* System Status Summary */}
      <div className="mt-4 pt-2 border-t border-green-400/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="text-center">
          <div className="text-gray-500">RPC</div>
          <div className="text-green-400 font-bold">● ONLINE</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">WebSocket</div>
          <div className="text-green-400 font-bold">● CONNECTED</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">MEV Protection</div>
          <div className="text-green-400 font-bold">● ACTIVE</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Auto Trading</div>
          <div className="text-yellow-400 font-bold">● ENABLED</div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsTerminal;