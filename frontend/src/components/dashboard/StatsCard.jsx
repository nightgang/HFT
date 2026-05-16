/**
 * Dashboard Stats Component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../layouts';
import { PriceChangeBadge } from '../common';

export const StatCard = ({ label, value, change, icon: Icon, color = 'purple' }) => {
  const colorClasses = {
    purple: 'text-purple-400 bg-purple-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change !== undefined && <PriceChangeBadge change={change} />}
        </div>
        {Icon && (
          <motion.div
            className={`p-3 rounded-lg ${colorClasses[color]}`}
            whileHover={{ scale: 1.1 }}
          >
            <Icon size={24} />
          </motion.div>
        )}
      </div>
    </Card>
  );
};

/**
 * Dashboard Overview
 */
export const DashboardOverview = ({ stats = [] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
};
