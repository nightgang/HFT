const JitoBundleModel = require('../models/jito-bundle.model');
const logger = require('../utils/logger');

class JitoBundleService {
  // Create a new Jito bundle
  async createBundle(walletId, bundleData) {
    try {
      const bundle = await JitoBundleModel.create({
        wallet_id: walletId,
        ...bundleData
      });
      logger.info(`Jito bundle created: ${bundle.bundle_id}`);
      return bundle;
    } catch (error) {
      logger.error('Error creating Jito bundle:', error);
      throw error;
    }
  }

  // Submit bundle to Jito (placeholder - would integrate with Jito API)
  async submitBundle(bundleId) {
    try {
      const bundle = await JitoBundleModel.getById(bundleId);
      if (!bundle) {
        throw new Error('Bundle not found');
      }

      // Submit to Jito Block Engine
      const endpoint = process.env.JITO_BLOCK_ENGINE_URL || 'https://mainnet.block-engine.jito.wtf';
      await fetch(`${endpoint}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: bundle.transactions, tip: bundle.tip_amount_lamports })
      });

      // Mark as submitted
      const updatedBundle = await JitoBundleModel.markSubmitted(bundleId);
      logger.info(`Bundle submitted to Jito: ${bundleId}`);
      return updatedBundle;
    } catch (error) {
      logger.error(`Error submitting bundle ${bundleId}:`, error);
      throw error;
    }
  }

  // Update bundle status
  async updateBundleStatus(bundleId, status, slotLanded = null, mevReward = null) {
    try {
      const updatedBundle = await JitoBundleModel.updateStatus(bundleId, status, slotLanded, mevReward);
      logger.info(`Bundle status updated: ${bundleId} -> ${status}`);
      return updatedBundle;
    } catch (error) {
      logger.error(`Error updating bundle status ${bundleId}:`, error);
      throw error;
    }
  }

  // Get bundles for wallet
  async getBundlesByWallet(walletId) {
    try {
      const bundles = await JitoBundleModel.getByWallet(walletId);
      return bundles;
    } catch (error) {
      logger.error('Error fetching bundles:', error);
      throw error;
    }
  }

  // Get pending bundles
  async getPendingBundles() {
    try {
      const bundles = await JitoBundleModel.getPendingBundles();
      return bundles;
    } catch (error) {
      logger.error('Error fetching pending bundles:', error);
      throw error;
    }
  }

  // Get bundle statistics
  async getBundleStats(walletId) {
    try {
      const stats = await JitoBundleModel.getBundleStats(walletId);
      return stats;
    } catch (error) {
      logger.error('Error fetching bundle stats:', error);
      throw error;
    }
  }

  // Cancel bundle
  async cancelBundle(bundleId, walletId) {
    try {
      const bundle = await JitoBundleModel.getById(bundleId);
      if (!bundle || bundle.wallet_id !== walletId) {
        throw new Error('Bundle not found or unauthorized');
      }

      if (bundle.status !== 'pending') {
        throw new Error('Can only cancel pending bundles');
      }

      const cancelled = await JitoBundleModel.updateStatus(bundleId, 'cancelled');
      logger.info(`Bundle cancelled: ${bundleId}`);
      return cancelled;
    } catch (error) {
      logger.error('Error cancelling bundle:', error);
      throw error;
    }
  }
}

module.exports = new JitoBundleService();