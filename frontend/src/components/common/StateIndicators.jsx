/**
 * Loading Spinner Component
 * Reusable loading state indicator
 */

import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={`${sizeClasses[size]} border-4 border-purple-500/20 border-t-purple-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {message && <p className="mt-4 text-gray-400">{message}</p>}
    </motion.div>
  );
};

/**
 * Error State Component
 */
export const ErrorState = ({ error, onRetry }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/30 rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-red-400 text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
      <p className="text-sm text-red-200 text-center mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
};

/**
 * Empty State Component
 */
export const EmptyState = ({ message = 'No data available', icon = '📭' }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-gray-400 text-center">{message}</p>
    </motion.div>
  );
};
