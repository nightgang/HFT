const WalletModel = require('../models/wallet.model');

class WalletRepository {
  async getByAddress(walletAddress) {
    return WalletModel.getByAddress(walletAddress);
  }

  async getChildWallets(parentWalletId) {
    return WalletModel.getChildWallets(parentWalletId);
  }

  async update(walletId, updates) {
    return WalletModel.update(walletId, updates);
  }

  async getMultisigWallets() {
    return WalletModel.getMultisigWallets();
  }

  async createMultisigWallet(walletData) {
    return WalletModel.createMultisigWallet(walletData);
  }
}

module.exports = new WalletRepository();
