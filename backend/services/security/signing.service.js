const axios = require('axios');
const { Transaction } = require('@solana/web3.js');
const solanaWalletService = require('../solana-wallet.service');
const secretsService = require('./secrets.service');
const logger = require('../../utils/logger');

class SigningService {
  async getSignTransaction(wallet) {
    if (!wallet) {
      throw new Error('Wallet information is required for signing');
    }

    const walletType = wallet.wallet_type || wallet.type || 'hot';
    if (walletType === 'hardware' || walletType === 'treasury') {
      return this.getHardwareSigner(wallet);
    }

    if (walletType === 'multisig') {
      throw new Error('Multisig wallets require an external signing flow');
    }

    return this.getSoftwareSigner(wallet);
  }

  getSoftwareSigner(wallet) {
    return async (transaction) => {
      const walletAddress = wallet.wallet_address || wallet.publicKey || wallet.address;
      if (!walletAddress) {
        throw new Error('Wallet address is required for software signer');
      }

      const keypair = wallet.keypair || await solanaWalletService.getKeypair(walletAddress.toString());
      transaction.sign(keypair);
      return transaction;
    };
  }

  getHardwareSigner(wallet) {
    return async (transaction) => {
      return this.signWithHardwareWallet(transaction, wallet);
    };
  }

  async signWithHardwareWallet(transaction, wallet) {
    const apiUrl = process.env.HARDWARE_WALLET_API_URL;
    const apiKey = secretsService.getSecretSync('HARDWARE_WALLET_API_KEY') || process.env.HARDWARE_WALLET_API_KEY;
    const walletAddress = wallet.wallet_address || wallet.publicKey || wallet.address;

    if (!apiUrl || !apiKey) {
      throw new Error('Hardware wallet signing is not configured. Set HARDWARE_WALLET_API_URL and HARDWARE_WALLET_API_KEY.');
    }

    if (!walletAddress) {
      throw new Error('Hardware wallet address is required for signing');
    }

    const payload = {
      walletAddress: walletAddress.toString(),
      transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64')
    };

    const response = await axios.post(
      `${apiUrl.replace(/\/$/, '')}/sign`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (!response.data || !response.data.signedTransaction) {
      throw new Error('Hardware wallet signer did not return a signed transaction');
    }

    const signedBuffer = Buffer.from(response.data.signedTransaction, 'base64');
    const signedTransaction = Transaction.from(signedBuffer);

    logger.info(`Hardware wallet transaction signed for ${walletAddress}`);
    return signedTransaction;
  }
}

module.exports = new SigningService();
