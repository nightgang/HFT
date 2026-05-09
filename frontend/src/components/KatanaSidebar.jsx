import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

function KatanaSidebar({ menuItems, activeTab, onTabChange }) {
  const [expandedItem, setExpandedItem] = useState(null);

  const emojis = {
    dashboard: '📊',
    terminal: '⌨️',
    trade: '💰',
    wallets: '🔑',
    sniper: '🎯',
    positions: '📈',
    orders: '📋',
    history: '📜',
    analytics: '📊',
    strategies: '🧠',
    settings: '⚙️',
  };

  return (
    <div className="h-full w-full bg-gradient-to-b from-black/60 to-purple-950/40 backdrop-blur-xl border-r border-purple-500/20 flex flex-col overflow-hidden">
      {/* Logo Section */}
      <div className="px-6 py-8 border-b border-purple-500/20 space-y-2">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ⚔️ HFT
        </div>
        <p className="text-xs text-gray-500">KATANA MODE v1.0</p>
        <div className="pt-2 px-2 py-1 bg-purple-500/20 rounded border border-purple-400/30 text-xs text-purple-300 font-mono">
          Ultra Fast Trading
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                onTabChange(item.id);
                setExpandedItem(expandedItem === item.id ? null : item.id);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-purple-500/40 to-pink-500/20 border border-purple-400/60 text-white shadow-lg shadow-purple-500/20'
                  : 'hover:bg-purple-500/10 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                expandedItem === item.id ? 'rotate-90' : ''
              }`} />
            </button>

            {/* Sub-menu indicator */}
            {expandedItem === item.id && (
              <div className="mt-1 ml-8 space-y-1 border-l border-purple-500/30 pl-3">
                <div className="text-xs text-gray-600 py-1">Sub-menu active</div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Status */}
      <div className="px-4 py-4 border-t border-purple-500/20 space-y-3">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs">
          <div className="text-green-400 font-bold mb-1">✓ System Ready</div>
          <div className="text-gray-500 text-xs">All services connected</div>
        </div>
        <div className="text-xs text-gray-600 text-center">
          v1.0 | © 2026 HFT
        </div>
      </div>
    </div>
  );
}

export default KatanaSidebar;