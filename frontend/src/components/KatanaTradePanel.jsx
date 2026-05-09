import { useState } from 'react';
import { ArrowDown, ArrowUp, Zap } from 'lucide-react';

function KatanaTradePanel() {
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [strategy, setStrategy] = useState('market');
  const [slippage, setSlippage] = useState('0.5');
  const [priority, setPriority] = useState('medium');

  const strategies = [
    { id: 'market', name: 'Market Order', icon: '⚡' },
    { id: 'limit', name: 'Limit Order', icon: '📌' },
    { id: 'dca', name: 'DCA Strategy', icon: '📊' },
    { id: 'sniper', name: 'Sniper Mode', icon: '🎯' },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-purple-500/20">
        {['buy', 'sell'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-medium text-sm transition flex items-center justify-center space-x-2 ${
              activeTab === tab
                ? tab === 'buy'
                  ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
                  : 'bg-red-500/20 text-red-400 border-b-2 border-red-400'
                : 'bg-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'buy' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            <span>{tab.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Strategy Selector */}
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-2">STRATEGY</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-2">AMOUNT (SOL)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-3 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition placeholder-gray-600"
          />
        </div>

        {/* Slippage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">SLIPPAGE %</label>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              step="0.1"
              className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">PRIORITY</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition"
            >
              <option value="low">Low (100K)</option>
              <option value="medium">Medium (500K)</option>
              <option value="high">High (1M+)</option>
              <option value="turbo">Turbo (5M+)</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-purple-500" defaultChecked />
            <span>Jito Bundle</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-purple-500" />
            <span>MEV Protection</span>
          </label>
        </div>

        {/* Execute Button */}
        <button
          disabled={!amount}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
            activeTab === 'buy'
              ? amount
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/50 hover:shadow-green-500/70'
                : 'bg-green-600/40 text-green-400/60 cursor-not-allowed'
              : amount
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70'
                : 'bg-red-600/40 text-red-400/60 cursor-not-allowed'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>
            {activeTab === 'buy' ? 'BUY NOW' : 'SELL NOW'}
          </span>
        </button>

        {/* Info */}
        <div className="pt-2 border-t border-purple-500/20 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Est. Output:</span>
            <span className="text-purple-400">{amount ? (amount * 168.35).toFixed(2) : '0'} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Fee (0.25%):</span>
            <span className="text-purple-400">${(amount * 168.35 * 0.0025).toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KatanaTradePanel;