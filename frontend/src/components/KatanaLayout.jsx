import { useState, useEffect, useRef } from 'react';
import { Menu, X, Zap, TrendingUp, Volume2, Activity, Wallet, Settings } from 'lucide-react';
import KatanaHeader from './KatanaHeader';
import KatanaSidebar from './KatanaSidebar';
import KatanaChart from './KatanaChart';
import KatanaTradePanel from './KatanaTradePanel';
import KatanaLiveFeed from './KatanaLiveFeed';
import KatanaWalletTracker from './KatanaWalletTracker';
import KatanaTerminal from './KatanaTerminal';
import KatanaActiveTrades from './KatanaActiveTrades';

// EventEmitter polyfill for components that need it
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

function KatanaLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPnL: 24850.75,
    winRate: 87.5,
    totalVolume: 450200,
    activeTrades: 12,
    balance: 89450.32,
    priorityFee: 'MEDIUM'
  });

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalPnL: prev.totalPnL + (Math.random() - 0.5) * 100,
        activeTrades: Math.max(0, prev.activeTrades + Math.floor((Math.random() - 0.6) * 2))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'terminal', label: 'Terminal', icon: '⌨️' },
    { id: 'trade', label: 'Trade', icon: '💰' },
    { id: 'wallets', label: 'Wallets', icon: '🔑' },
    { id: 'sniper', label: 'Sniper', icon: '🎯' },
    { id: 'positions', label: 'Positions', icon: '📈' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'strategies', label: 'Strategies', icon: '🧠' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,40,200,0.3),rgba(10,10,40,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_80%,rgba(0,200,150,0.2),rgba(10,10,40,0))]" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
          <KatanaSidebar 
            menuItems={menuItems} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <KatanaHeader 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            stats={stats}
          />

          {/* Content Area */}
          <div className={`flex-1 flex overflow-hidden ${terminalOpen ? 'flex-col' : ''}`}>
            {/* Dashboard Section */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  <StatCard 
                    label="Total PNL" 
                    value={`$${stats.totalPnL.toFixed(2)}`}
                    change="+12.5%"
                    icon={<TrendingUp className="w-5 h-5" />}
                    trending="up"
                  />
                  <StatCard 
                    label="Win Rate" 
                    value={`${stats.winRate}%`}
                    change="+2.3%"
                    icon={<Activity className="w-5 h-5" />}
                    trending="up"
                  />
                  <StatCard 
                    label="Volume" 
                    value={`$${(stats.totalVolume/1000).toFixed(0)}K`}
                    change="+8.1%"
                    icon={<Volume2 className="w-5 h-5" />}
                    trending="up"
                  />
                  <StatCard 
                    label="Active Trades" 
                    value={stats.activeTrades}
                    change="Live"
                    icon={<Zap className="w-5 h-5" />}
                    trending="neutral"
                  />
                  <StatCard 
                    label="Balance" 
                    value={`$${stats.balance.toFixed(0)}`}
                    change="+$5,200"
                    icon={<Wallet className="w-5 h-5" />}
                    trending="up"
                  />
                  <StatCard 
                    label="Priority Fee" 
                    value={stats.priorityFee}
                    change="Optimal"
                    icon={<Settings className="w-5 h-5" />}
                    trending="neutral"
                  />
                </div>

                {/* Main Trading View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chart */}
                  <div className="lg:col-span-2">
                    <KatanaChart />
                  </div>

                  {/* Right Panels */}
                  <div className="flex flex-col gap-4">
                    <KatanaTradePanel />
                    <KatanaWalletTracker />
                  </div>
                </div>

                {/* Bottom Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <KatanaActiveTrades />
                  <KatanaLiveFeed />
                </div>
              </div>
            </div>

            {/* Terminal Section */}
            {terminalOpen && (
              <div className="h-1/3 border-t border-purple-500/20 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 bg-black/40 border-b border-purple-500/20 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-purple-400">⌨️ KATANA TERMINAL - ULTRA FAST EXECUTION</h3>
                    <button
                      onClick={() => setTerminalOpen(false)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <KatanaTerminal />
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Toggle Button */}
            {!terminalOpen && (
              <button
                onClick={() => setTerminalOpen(true)}
                className="fixed bottom-4 right-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 rounded-lg text-purple-300 text-sm font-medium transition"
              >
                Show Terminal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon, trending }) {
  const trendColor = trending === 'up' ? 'text-green-400' : trending === 'down' ? 'text-red-400' : 'text-blue-400';
  
  return (
    <div className="group relative p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 rounded-lg hover:border-purple-400/60 transition-all duration-300 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">{label}</span>
          <span className={trendColor}>{icon}</span>
        </div>
        <div className="text-xl font-bold text-white mb-1">{value}</div>
        <div className={`text-xs font-medium ${trendColor}`}>{change}</div>
      </div>

      {/* Animated border glow */}
      <div className="absolute inset-0 border border-purple-400/0 group-hover:border-purple-400/50 rounded-lg transition-all duration-300 animate-pulse" />
    </div>
  );
}

export default KatanaLayout;