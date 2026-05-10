const { CrossChainModel, BridgeRecordModel } = require('../models/cross-chain.model');
const logger = require('../utils/logger');

class CrossChainBridgeService {
  // Initiate a cross-chain transaction
  async initiateBridge(walletId, bridgeData) {
    try {
      const tx = await CrossChainModel.create({
        wallet_id: walletId,
        ...bridgeData
      });
      
      logger.info(`Cross-chain bridge initiated: ${tx.bridge_tx_id}`);
      return tx;
    } catch (error) {
      logger.error('Error initiating cross-chain bridge:', error);
      throw error;
    }
  }

  // Update bridge status
  async updateBridgeStatus(bridgeTxId, status, targetTxSignature = null) {
    try {
      const tx = await CrossChainModel.updateStatus(bridgeTxId, status, targetTxSignature);
      logger.info(`Bridge status updated: ${bridgeTxId} -> ${status}`);
      return tx;
    } catch (error) {
      logger.error('Error updating bridge status:', error);
      throw error;
    }
  }

  // Get pending bridges
  async getPendingBridges() {
    try {
      const pending = await CrossChainModel.getPendingTransactions();
      return pending;
    } catch (error) {
      logger.error('Error fetching pending bridges:', error);
      throw error;
    }
  }

  // Get wallet bridge history
  async getWalletBridgeHistory(walletId) {
    try {
      const history = await CrossChainModel.getTransactionsByWallet(walletId);
      
      // Enrich with metrics
      const enriched = history.map(tx => ({
        ...tx,
        total_cost_usd: (tx.bridge_fee_usd || 0) + (tx.gas_fee_usd || 0),
        effective_rate: tx.target_amount > 0 ? (tx.source_amount / tx.target_amount).toFixed(4) : 0
      }));

      return enriched;
    } catch (error) {
      logger.error('Error fetching bridge history:', error);
      throw error;
    }
  }

  // Retry failed bridge
  async retryFailedBridge(bridgeTxId) {
    try {
      const tx = await CrossChainModel.retryTransaction(bridgeTxId);
      logger.info(`Bridge retry initiated: ${bridgeTxId}`);
      return tx;
    } catch (error) {
      logger.error('Error retrying bridge:', error);
      throw error;
    }
  }

  // Monitor bridge progress
  async monitorBridgeProgress(bridgeTxId) {
    try {
      const tx = await CrossChainModel.getById(bridgeTxId);
      const events = await BridgeRecordModel.getEventsByBridgeTx(bridgeTxId);
      
      return {
        transaction: tx,
        events: events,
        progress: this.calculateProgress(tx, events),
        eta: this.estimateCompletion(tx, events)
      };
    } catch (error) {
      logger.error('Error monitoring bridge:', error);
      throw error;
    }
  }

  // Calculate bridge progress
  calculateProgress(tx, events) {
    const statusWeights = {
      'initiated': 0,
      'locked': 25,
      'minted': 50,
      'confirmed': 100,
      'failed': -1
    };

    return statusWeights[tx.status] || 0;
  }

  // Estimate completion time
  estimateCompletion(tx, events) {
    const timeInProgress = (Date.now() - new Date(tx.initiated_at).getTime()) / 1000;
    
    // Based on bridge program
    const avgTimes = {
      'wormhole': 180, // seconds
      'portal': 300,
      'cross_solana': 60
    };

    const avgTime = avgTimes[tx.bridge_program] || 180;
    const estimatedCompletion = new Date(Date.now() + (avgTime * 1000));

    return {
      estimated_completion: estimatedCompletion,
      time_remaining_seconds: Math.max(avgTime - timeInProgress, 0),
      bridge_program: tx.bridge_program
    };
  }

  // Record bridge event
  async recordBridgeEvent(bridgeTxId, eventData) {
    try {
      const event = await BridgeRecordModel.recordEvent({
        bridge_tx_id: bridgeTxId,
        ...eventData
      });
      logger.info(`Bridge event recorded: ${eventData.event_type}`);
      return event;
    } catch (error) {
      logger.error('Error recording bridge event:', error);
      throw error;
    }
  }

  // Estimate bridge fee
  async estimateBridgeFee(sourceChain, targetChain, amount) {
    try {
      // Fee structure varies by bridge and chains
      const baseFee = {
        'solana_to_ethereum': 5.0,
        'ethereum_to_solana': 7.5,
        'solana_to_polygon': 2.0,
        'polygon_to_solana': 2.5,
        'cross_solana': 1.0
      };

      const direction = `${sourceChain}_to_${targetChain}`;
      const fee = baseFee[direction] || 5.0;
      const gasEstimate = amount > 1000 ? amount * 0.001 : 1.0;

      return {
        bridge_fee_usd: fee,
        estimated_gas_fee_usd: gasEstimate,
        total_estimated_cost_usd: fee + gasEstimate,
        effective_rate: 1.0 - ((fee + gasEstimate) / (amount || 1))
      };
    } catch (error) {
      logger.error('Error estimating bridge fee:', error);
      throw error;
    }
  }
}

module.exports = new CrossChainBridgeService();
