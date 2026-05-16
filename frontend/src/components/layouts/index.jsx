/**
 * Main Layout Component
 * Provides layout structure for the application
 */

import React from 'react';
import { motion } from 'framer-motion';

export const MainLayout = ({
  sidebar,
  header,
  children,
  footer = null,
  className = '',
}) => {
  return (
    <div className={`flex h-screen bg-gray-950 overflow-hidden ${className}`}>
      {/* Sidebar */}
      {sidebar && <div className="flex-shrink-0">{sidebar}</div>}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {header && <div className="flex-shrink-0">{header}</div>}

        {/* Content Area */}
        <motion.main
          className="flex-1 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">{children}</div>
        </motion.main>

        {/* Footer */}
        {footer && <div className="flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

/**
 * Page Container
 */
export const PageContainer = ({ title, description = '', children, className = '' }) => {
  return (
    <motion.div
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        {description && <p className="text-gray-400">{description}</p>}
      </div>

      {/* Content */}
      {children}
    </motion.div>
  );
};

/**
 * Card Container
 */
export const Card = ({ children, className = '', onClick = null, ...props }) => {
  return (
    <motion.div
      className={`bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/40 transition ${className}`}
      whileHover={{ y: -2 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Grid Container
 */
export const GridContainer = ({ children, columns = 3, className = '' }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${gridClass[columns]} ${className}`}>
      {children}
    </div>
  );
};
