import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Zap, Target, DollarSign } from 'lucide-react';

const LiveFeedTerminal = () => {
  const [feedItems, setFeedItems] = useState([]);
  const scrollRef = useRef(null);

  // Mock live feed data
  const mockFeedData = [
    { id: 1, time: '13:01:10', type: 'NEW', message: '$KAT launched on Raydium', status: 'success', icon: Zap },
    { id: 2, time: '13:01:10', type: 'INFO', message: 'Liquidity Check: PASSED', status: 'info', icon: Activity },
    { id: 3, time: '13:01:11', type: 'SNIPER', message: 'Buying 0.5 SOL...', status: 'warning', icon: Target },
    { id: 4, time: '13:01:11', type: 'SUCCESS', message: 'Buy TX: 5Gx...9kL', status: 'success', icon: TrendingUp },
    { id: 5, time: '13:01:12', type: 'PRICE', message: 'SKAT +211%', status: 'success', icon: TrendingUp },
    { id: 6, time: '13:01:13', type: 'WHALE', message: 'Large wallet activity detected', status: 'warning', icon: DollarSign },
    { id: 7, time: '13:01:14', type: 'LIQUIDITY', message: 'Pool liquidity increased +45%', status: 'info', icon: Activity },
    { id: 8, time: '13:01:15', type: 'SMART', message: 'Smart money buy signal', status: 'success', icon: Target },
  ];

  // Simulate real-time feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomItem = mockFeedData[Math.floor(Math.random() * mockFeedData.length)];
      const newItem = {
        ...randomItem,
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
      };

      setFeedItems(prev => [newItem, ...(prev || []).slice(0, 19)]); // Keep last 20 items
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    // Initial load
    setFeedItems((mockFeedData || []).slice(0, 10));

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [feedItems]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 border-green-400/30';
      case 'warning': return 'text-yellow-400 border-yellow-400/30';
      case 'error': return 'text-red-400 border-red-400/30';
      case 'info': return 'text-cyan-400 border-cyan-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const getStatusGlow = (status) => {
    switch (status) {
      case 'success': return 'shadow-green-500/20';
      case 'warning': return 'shadow-yellow-500/20';
      case 'error': return 'shadow-red-500/20';
      case 'info': return 'shadow-cyan-500/20';
      default: return 'shadow-gray-500/20';
    }
  };

  return (
    <div className="p-4 font-mono text-sm bg-black min-h-[300px] relative">
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-400/30">
        <Activity className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">LIVE SNIPER FEED</span>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500">Real-time monitoring active</div>
      </div>

      {/* Feed Container */}
      <div
        ref={scrollRef}
        className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {feedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 bg-slate-900/50 rounded border ${getStatusColor(item.status)} ${getStatusGlow(item.status)} hover:shadow-lg transition-all duration-200`}
            >
              {/* Status Indicator */}
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                item.status === 'success' ? 'bg-green-400' :
                item.status === 'warning' ? 'bg-yellow-400' :
                item.status === 'error' ? 'bg-red-400' : 'bg-cyan-400'
              }`}></div>

              {/* Icon */}
              <item.icon className={`w-4 h-4 ${
                item.status === 'success' ? 'text-green-400' :
                item.status === 'warning' ? 'text-yellow-400' :
                item.status === 'error' ? 'text-red-400' : 'text-cyan-400'
              }`} />

              {/* Time */}
              <div className="text-xs text-gray-500 font-mono min-w-[70px]">
                [{item.time}]
              </div>

              {/* Type Badge */}
              <div className={`px-2 py-1 text-xs font-bold rounded border ${
                item.type === 'SUCCESS' ? 'bg-green-400/20 text-green-400 border-green-400/50' :
                item.type === 'ERROR' ? 'bg-red-400/20 text-red-400 border-red-400/50' :
                item.type === 'WARNING' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50' :
                item.type === 'INFO' ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50' :
                'bg-purple-400/20 text-purple-400 border-purple-400/50'
              }`}>
                [{item.type}]
              </div>

              {/* Message */}
              <div className="flex-1 text-green-400 font-mono">
                {item.message}
              </div>

              {/* Animated indicator for new items */}
              {index === 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-2 h-2 bg-green-400 rounded-full animate-ping"
                ></motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-2 border-t border-green-400/30 flex justify-between text-xs text-gray-500">
        <div>Updates: {feedItems.length}</div>
        <div>Latency: 23ms</div>
        <div>Status: <span className="text-green-400">● ACTIVE</span></div>
      </div>
    </div>
  );
};

export default LiveFeedTerminal;