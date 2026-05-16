/**
 * Status Badge Component
 * Display various status indicators
 */

import React from 'react';
import { motion } from 'framer-motion';

export const StatusBadge = ({ status, label = '', size = 'md' }) => {
  const getStatusStyles = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return styles[status] || styles.inactive;
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const getDot = () => {
    const colors = {
      active: 'bg-green-400',
      inactive: 'bg-gray-400',
      pending: 'bg-yellow-400',
      error: 'bg-red-400',
      success: 'bg-green-400',
      warning: 'bg-yellow-400',
    };
    return colors[status] || colors.inactive;
  };

  return (
    <motion.span
      className={`inline-flex items-center gap-2 border rounded-full font-medium ${getStatusStyles(
        status
      )} ${sizeClasses[size]}`}
      whileHover={{ scale: 1.05 }}
    >
      <motion.span
        className={`w-2 h-2 rounded-full ${getDot()}`}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {label}
    </motion.span>
  );
};

/**
 * Price Change Badge
 */
export const PriceChangeBadge = ({ change, size = 'md' }) => {
  const isPositive = change >= 0;
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <motion.span
      className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'} ${
        sizeClasses[size]
      }`}
      whileHover={{ scale: 1.1 }}
    >
      {isPositive ? '+' : ''}{change.toFixed(2)}%
    </motion.span>
  );
};
