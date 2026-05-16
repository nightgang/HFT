/**
 * Modal Dialog Component
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl z-50 ${sizeClasses[size]} w-full mx-4`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Confirmation Dialog
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
            isDangerous
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
