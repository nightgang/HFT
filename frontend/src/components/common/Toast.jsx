/**
 * Notification Toast Component
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const NotificationToast = ({ notifications = [], onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg border ${getToastStyles(notification.type)}`}
          >
            <div className="flex items-center gap-3">
              {getToastIcon(notification.type)}
              <div className="flex-1">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <button
                onClick={() => onClose?.(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

const getToastStyles = (type) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };
  return styles[type] || styles.info;
};

const getToastIcon = (type) => {
  const iconClasses = 'w-5 h-5 flex-shrink-0';
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconClasses} text-green-400`} />;
    case 'error':
      return <AlertCircle className={`${iconClasses} text-red-400`} />;
    case 'warning':
      return <AlertCircle className={`${iconClasses} text-yellow-400`} />;
    case 'info':
    default:
      return <Info className={`${iconClasses} text-blue-400`} />;
  }
};
