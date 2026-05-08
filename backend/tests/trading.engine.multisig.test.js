jest.mock('../models/wallet.model');

const WalletModel = require('../models/wallet.model');
const tradingEngine = require('../services/engines/trading.engine');

describe('TradingEngine multisig wallet support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a multisig wallet and persist it', async () => {
    WalletModel.createMultisigWallet.mockResolvedValue({
      wallet_id: 'mock-id',
      wallet_address: 'multisig-demo-1',
      wallet_name: 'Team Vault',
      wallet_type: 'multisig',
      multisig_signers: ['A', 'B', 'C'],
      multisig_threshold: 2,
      multisig_address: 'multisig-address-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      notes: 'Multisig wallet for team trading'
    });

    const result = await tradingEngine.createMultisigWallet(
      'Team Vault',
      ['A', 'B', 'C'],
      2,
      'multisig-address-123',
      'Multisig wallet for team trading'
    );

    expect(WalletModel.createMultisigWallet).toHaveBeenCalledWith(expect.objectContaining({
      wallet_address: expect.any(String),
      wallet_name: 'Team Vault',
      multisig_signers: ['A', 'B', 'C'],
      multisig_threshold: 2,
      multisig_address: 'multisig-address-123',
      notes: 'Multisig wallet for team trading'
    }));

    expect(result).toMatchObject({
      walletName: 'Team Vault',
      multisig: true,
      signers: ['A', 'B', 'C'],
      threshold: 2,
      multisigAddress: 'multisig-address-123'
    });
  });

  it('should reject invalid multisig configuration', async () => {
    await expect(tradingEngine.createMultisigWallet('Bad', ['A'], 2)).rejects.toThrow('Multisig wallet requires at least 2 signers');
  });
});