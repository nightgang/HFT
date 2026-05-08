const logger = require('../utils/logger');
const { query } = require('../db/connection');
const WalletModel = require('../models/wallet.model');

class WalletRecoveryService {
  async prepareRecoveryPlan(walletAddress, targetWalletAddress = null) {
    const wallet = await WalletModel.getByAddress(walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const parentWallet = wallet.parent_wallet_id
      ? await query('SELECT * FROM wallets WHERE wallet_id = $1 AND is_active = true', [wallet.parent_wallet_id]).then(result => result.rows[0])
      : null;

    let targetWallet = null;
    if (targetWalletAddress) {
      targetWallet = await WalletModel.getByAddress(targetWalletAddress);
      if (!targetWallet) {
        throw new Error('Target wallet not found');
      }
    } else if (parentWallet) {
      targetWallet = parentWallet;
    }

    const childWallets = await WalletModel.getChildWallets(wallet.wallet_id);
    const canRecover = Boolean(targetWallet);
    const steps = [
      'Verify recovery target wallet is trusted and active.',
      'Confirm wallet hierarchy and spending limits before moving funds.',
      'Execute recovery transaction using secure key material.',
      'Record recovery metadata and audit the operation.'
    ];

    return {
      walletAddress: wallet.wallet_address,
      walletName: wallet.wallet_name,
      parentWallet: parentWallet ? { walletAddress: parentWallet.wallet_address, walletName: parentWallet.wallet_name } : null,
      targetWallet: targetWallet ? { walletAddress: targetWallet.wallet_address, walletName: targetWallet.wallet_name } : null,
      subWallets: childWallets.map((sub) => ({ walletAddress: sub.wallet_address, walletName: sub.wallet_name })),
      canRecover,
      recommendedTarget: targetWallet ? targetWallet.wallet_address : null,
      summary: canRecover
        ? `Recovery plan ready. ${targetWallet.wallet_address} will receive funds.`
        : 'Recovery plan cannot be completed without a valid target wallet.',
      steps,
    };
  }

  async executeRecoveryPlan(walletAddress, targetWalletAddress) {
    const recoveryPlan = await this.prepareRecoveryPlan(walletAddress, targetWalletAddress);
    if (!recoveryPlan.canRecover) {
      throw new Error('Cannot execute recovery plan without a valid target wallet');
    }

    const wallet = await WalletModel.getByAddress(walletAddress);
    const targetWallet = await WalletModel.getByAddress(recoveryPlan.targetWallet.walletAddress);

    // Record recovery metadata in the wallet record.
    const updatedWallet = await WalletModel.update(wallet.wallet_id, {
      metadata: {
        ...wallet.metadata,
        lastRecovery: {
          targetWallet: recoveryPlan.targetWallet.walletAddress,
          executedAt: new Date().toISOString(),
          reason: 'Automated fund recovery initiated'
        }
      }
    });

    logger.info(`Recovery plan executed for wallet ${walletAddress} to target ${recoveryPlan.targetWallet.walletAddress}`);

    return {
      success: true,
      message: 'Recovery metadata recorded. Execute your on-chain transfer using secure keys.',
      wallet: updatedWallet,
      targetWallet: {
        walletAddress: targetWallet.wallet_address,
        walletName: targetWallet.wallet_name
      }
    };
  }
}

module.exports = new WalletRecoveryService();
