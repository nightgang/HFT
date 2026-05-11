import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, ArrowRightLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const CrossChainBridge = () => {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBridgeForm, setShowBridgeForm] = useState(false);
  const [formData, setFormData] = useState({
    fromChain: 'solana',
    toChain: 'ethereum',
    tokenMint: '',
    amount: '',
  });

  useEffect(() => {
    fetchBridges();
    const interval = setInterval(fetchBridges, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBridges = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cross-chain-bridge');
      setBridges(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bridges:', error);
      setLoading(false);
    }
  };

  const handleBridgeTransfer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/cross-chain-bridge', formData);
      setFormData({
        fromChain: 'solana',
        toChain: 'ethereum',
        tokenMint: '',
        amount: '',
      });
      setShowBridgeForm(false);
      fetchBridges();
    } catch (error) {
      console.error('Failed to bridge tokens:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading bridge data...</div>;
  }

  const completedCount = bridges.filter(b => b.status === 'completed').length;
  const pendingCount = bridges.filter(b => b.status === 'pending').length;
  const failedCount = bridges.filter(b => b.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Cross-Chain Bridge</h1>
        <button
          onClick={() => setShowBridgeForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Bridge Tokens
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Completed</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{completedCount}</div>
          <p className="text-xs text-gray-500 mt-2">Successful bridges</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/5 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
          <p className="text-xs text-gray-500 mt-2">In progress</p>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Failed</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">{failedCount}</div>
          <p className="text-xs text-gray-500 mt-2">Failed attempts</p>
        </div>
      </div>

      {showBridgeForm && (
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Bridge Tokens</h2>
          <form onSubmit={handleBridgeTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">From Chain</label>
                <select
                  value={formData.fromChain}
                  onChange={(e) => setFormData({ ...formData, fromChain: e.target.value })}
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white"
                >
                  <option value="solana">Solana</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">To Chain</label>
                <select
                  value={formData.toChain}
                  onChange={(e) => setFormData({ ...formData, toChain: e.target.value })}
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="solana">Solana</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Token Mint</label>
                <input
                  type="text"
                  value={formData.tokenMint}
                  onChange={(e) => setFormData({ ...formData, tokenMint: e.target.value })}
                  placeholder="Enter token mint address"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount to bridge"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Bridge Tokens
              </button>
              <button
                type="button"
                onClick={() => setShowBridgeForm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Bridge History</h2>
        {bridges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No bridge transactions yet</div>
        ) : (
          bridges.map((bridge) => (
            <div key={bridge.id} className={`border rounded-lg p-4 ${getStatusColor(bridge.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-current/20 rounded">
                    {getStatusIcon(bridge.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold capitalize">
                        {bridge.fromChain} → {bridge.toChain}
                      </h3>
                    </div>
                    <p className="text-sm text-current/80">{bridge.tokenMint}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{bridge.amount} tokens</div>
                  <p className="text-xs text-current/80 mt-1">
                    {new Date(bridge.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {bridge.transactionHash && (
                <div className="mt-2 pt-2 border-t border-current/20">
                  <p className="text-xs text-current/70 break-all">Hash: {bridge.transactionHash}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CrossChainBridge;
