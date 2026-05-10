import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/**
 * AutoTradeToggle Component
 * Neon-style toggle button for AUTO TRADE ON/OFF
 * Features:
 * - Real-time status updates via WebSocket
 * - Animated glow effects
 * - Modern HFT UI design
 * - Socket.io sync with backend
 * - Instant toggle updates
 */
export default function AutoTradeToggle({ ws, onStatusChange }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Initialize with current status from backend
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('/api/system/autotrade', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsEnabled(response.data.AUTO_TRADE);
        setLastUpdated(new Date(response.data.timestamp));
      } catch (err) {
        console.error('Failed to fetch auto-trade status:', err);
        setError('Failed to load status');
      }
    };

    fetchStatus();
  }, []);

  // Subscribe to WebSocket auto-trade status updates
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'autotrade-status') {
          setIsEnabled(message.AUTO_TRADE);
          setLastUpdated(new Date(message.timestamp));
          if (onStatusChange) {
            onStatusChange(message.AUTO_TRADE);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, onStatusChange]);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        '/api/system/autotrade',
        { 
          action: 'toggle'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Status update will come via WebSocket, but also update immediately for UX
      setIsEnabled(response.data.AUTO_TRADE);
      setLastUpdated(new Date(response.data.timestamp));
      if (onStatusChange) {
        onStatusChange(response.data.AUTO_TRADE);
      }
    } catch (err) {
      console.error('Failed to toggle auto-trade:', err);
      setError('Failed to toggle - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = isEnabled === null || isEnabled === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="relative"
    >
      {/* Auto Trade Toggle Button */}
      <motion.button
        onClick={handleToggle}
        disabled={isLoading || isEmpty}
        className={`relative px-6 py-3 font-bold text-sm rounded-lg overflow-hidden transition-all duration-300 ${
          isEnabled
            ? 'bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30'
            : 'bg-red-500/20 border border-red-400 text-red-300 hover:bg-red-500/30'
        } ${isEmpty || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        whileHover={!isLoading && !isEmpty ? { scale: 1.05 } : {}}
        whileTap={!isLoading && !isEmpty ? { scale: 0.95 } : {}}
      >
        {/* Animated glow background */}
        <motion.div
          className={`absolute inset-0 rounded-lg blur-xl ${
            isEnabled ? 'bg-green-500/40' : 'bg-red-500/40'
          }`}
          animate={{
            opacity: isLoading ? [0.5, 0.8, 0.5] : [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Button inner glow */}
        <motion.div
          className={`absolute inset-0 rounded-lg ${
            isEnabled ? 'bg-green-400/10' : 'bg-red-400/10'
          }`}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Content */}
        <div className="relative flex items-center justify-center space-x-2 z-10">
          {isLoading ? (
            <>
              <motion.div
                className="w-2 h-2 rounded-full bg-current"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <motion.span
                animate={{ rotate: isEnabled ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isEnabled ? '🟢' : '🔴'}
              </motion.span>
              <span>AUTO TRADE {isEnabled ? 'ON' : 'OFF'}</span>
            </>
          )}
        </div>
      </motion.button>

      {/* Status indicator line */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
          isEnabled ? 'bg-green-400' : 'bg-red-400'
        }`}
        animate={{
          boxShadow: isEnabled
            ? ['0 0 5px rgba(74, 222, 128, 0.5)', '0 0 15px rgba(74, 222, 128, 0.8)', '0 0 5px rgba(74, 222, 128, 0.5)']
            : ['0 0 5px rgba(248, 113, 113, 0.5)', '0 0 15px rgba(248, 113, 113, 0.8)', '0 0 5px rgba(248, 113, 113, 0.5)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 text-xs text-red-400 px-2 py-1 bg-red-500/10 border border-red-400/50 rounded whitespace-nowrap"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status info */}
      <motion.div
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-full mb-2 right-0 text-xs text-gray-400"
      >
        {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
      </motion.div>
    </motion.div>
  );
}
