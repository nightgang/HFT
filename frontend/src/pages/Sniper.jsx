import { useState, useEffect } from 'react';
import WalletConnector from '../components/WalletConnector';

function Sniper({ systemStatus, onStatusUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeWallet, setActiveWallet] = useState(null);

  useEffect(() => {
    fetchActiveWallet();
  }, []);

  const fetchActiveWallet = async () => {
    try {
      const response = await fetch('http://localhost:3001/wallet/active');
      const data = await response.json();
      setActiveWallet(data.activeWallet || null);
    } catch (error) {
      console.error('Failed to fetch active wallet:', error);
    }
  };

  const handleStartSniper = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/sniper/start', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        onStatusUpdate();
      } else {
        alert('Failed to start sniper: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleStopSniper = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/sniper/stop', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        onStatusUpdate();
      } else {
        alert('Failed to stop sniper: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleToggleAutoTrade = async (enable) => {
    setIsLoading(true);
    try {
      const endpoint = enable ? '/sniper/enable-auto-trade' : '/sniper/disable-auto-trade';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        onStatusUpdate();
        fetchActiveWallet();
      } else {
        alert('Failed to toggle auto trade: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `internal-${Date.now()}`, deterministic: false }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Created wallet: ${result.wallet.publicKey}`);
        fetchActiveWallet();
      } else {
        alert('Failed to create wallet: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-green-400">Sniper Control Panel</h2>

        {/* Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className={`text-2xl mb-2 ${systemStatus.sniperActive ? 'text-green-400' : 'text-red-400'}`}>
              {systemStatus.sniperActive ? '🟢' : '🔴'}
            </div>
            <div className="text-sm text-gray-300">Sniper Status</div>
            <div className="font-semibold">{systemStatus.sniperActive ? 'Active' : 'Inactive'}</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className={`text-2xl mb-2 ${systemStatus.autoTradeEnabled ? 'text-blue-400' : 'text-gray-400'}`}>
              {systemStatus.autoTradeEnabled ? '🤖' : '⏸️'}
            </div>
            <div className="text-sm text-gray-300">Auto Trade</div>
            <div className="font-semibold">{systemStatus.autoTradeEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2 text-purple-400">📡</div>
            <div className="text-sm text-gray-300">Connected Clients</div>
            <div className="font-semibold">{systemStatus.connectedClients}</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2 text-yellow-400">👤</div>
            <div className="text-sm text-gray-300">Active Wallet</div>
            <div className="font-semibold text-sm break-all">
              {activeWallet ? activeWallet.name : 'None'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Sniper Controls</h3>
            <button
              onClick={handleStartSniper}
              disabled={isLoading || systemStatus.sniperActive}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Sniper'}
            </button>
            <button
              onClick={handleStopSniper}
              disabled={isLoading || !systemStatus.sniperActive}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Stopping...' : 'Stop Sniper'}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Trading Controls</h3>
            <button
              onClick={() => handleToggleAutoTrade(true)}
              disabled={isLoading || systemStatus.autoTradeEnabled}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Enabling...' : 'Enable Auto Trade'}
            </button>
            <button
              onClick={() => handleToggleAutoTrade(false)}
              disabled={isLoading || !systemStatus.autoTradeEnabled}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Disabling...' : 'Disable Auto Trade'}
            </button>
          </div>
        </div>

        {/* Wallet Provisioning */}
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100">Internal Wallet</h3>
              <p className="text-sm text-gray-400">Create a default internal wallet for auto trading and manual execution.</p>
            </div>
            <button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="mt-8 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Risk Warning</h3>
          <ul className="text-sm text-yellow-200 space-y-1">
            <li>• Auto trading can result in significant losses</li>
            <li>• Always test with small amounts first</li>
            <li>• Risk management is mandatory and cannot be disabled</li>
            <li>• Monitor your positions regularly</li>
            <li>• This system does not guarantee profits</li>
          </ul>
        </div>

        <WalletConnector onWalletsUpdate={() => {
          onStatusUpdate();
          fetchActiveWallet();
        }} />
      </div>
    </div>
  );
}

export default Sniper;