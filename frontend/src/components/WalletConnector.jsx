import { useState, useEffect } from 'react';

function WalletConnector({ onWalletsUpdate }) {
  const [publicKey, setPublicKey] = useState('');
  const [name, setName] = useState('external');
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('http://localhost:3001/wallets');
      const data = await response.json();
      setWallets(data.wallets || []);
      setActiveWallet(data.activeWallet || null);
      onWalletsUpdate?.();
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  const handleConnect = async () => {
    if (!publicKey.trim()) {
      alert('Public key is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: publicKey.trim(), name: name.trim() || 'external' }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Connected wallet: ${result.wallet.publicKey}`);
        setPublicKey('');
        setName('external');
        fetchWallets();
      } else {
        alert(`Failed to connect wallet: ${result.error}`);
      }
    } catch (error) {
      alert(`Error connecting wallet: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleSetActive = async (walletPublicKey) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/wallet/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: walletPublicKey }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Active wallet updated');
        fetchWallets();
        onWalletsUpdate?.();
      } else {
        alert(`Failed to set active wallet: ${result.error}`);
      }
    } catch (error) {
      alert(`Error setting active wallet: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Wallet Connector</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Wallet Public Key</label>
          <input
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            placeholder="Enter external wallet public key"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Label</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            placeholder="Wallet label"
          />
        </div>

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Connecting...' : 'Connect External Wallet'}
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm text-gray-300">Connected Wallets</h4>
          <button
            onClick={fetchWallets}
            className="text-xs text-blue-300 hover:text-white"
          >
            Refresh
          </button>
        </div>
        {wallets.length === 0 ? (
          <div className="text-sm text-gray-500">No connected wallets yet.</div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => {
              const isActive = activeWallet?.publicKey === wallet.publicKey;
              return (
                <div
                  key={wallet.publicKey}
                  className={`bg-gray-700 rounded-lg p-3 flex items-center justify-between border ${isActive ? 'border-green-500' : 'border-transparent'}`}
                >
                  <div>
                    <div className="font-medium text-gray-100">{wallet.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-sm">{wallet.publicKey}</div>
                    {isActive && <div className="text-xs text-green-300 mt-1">Active wallet</div>}
                  </div>
                  <button
                    onClick={() => handleSetActive(wallet.publicKey)}
                    disabled={isLoading || isActive}
                    className={`px-3 py-1 rounded text-xs ${isActive ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isActive ? 'Active' : 'Set Active'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletConnector;
