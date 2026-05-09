import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Sniper from './pages/Sniper';
import Portfolio from './pages/Portfolio';
import Logs from './pages/Logs';
import Status from './pages/Status';
import KatanaDashboard from './pages/KatanaDashboard';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [systemStatus, setSystemStatus] = useState({
    sniperActive: false,
    autoTradeEnabled: false,
    connectedClients: 0,
  });

  const tabs = [
    { id: 'dashboard', name: '▶ Dashboard', component: Dashboard },
    { id: 'katana', name: '⚔️ Katana', component: KatanaDashboard },
    { id: 'sniper', name: '🎯 Sniper', component: Sniper },
    { id: 'portfolio', name: '💼 Portfolio', component: Portfolio },
    { id: 'status', name: '📡 Status', component: Status },
    { id: 'logs', name: '📋 Logs', component: Logs },
  ];

  useEffect(() => {
    // Fetch initial system status
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const fetchSystemStatus = async () => {
    try {
      const [statusRes, wsRes] = await Promise.all([
        fetch('http://localhost:3001/sniper/status'),
        fetch('http://localhost:3001/ws/info'),
      ]);

      const status = await statusRes.json();
      const wsInfo = await wsRes.json();

      setSystemStatus({
        sniperActive: status.isActive,
        autoTradeEnabled: status.autoTradeEnabled,
        connectedClients: wsInfo.clients,
      });
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  return (
    <div className={`${theme === 'dark' ? 'min-h-screen bg-gray-950 text-white' : 'min-h-screen bg-slate-100 text-slate-900'} font-mono`}>
      {/* Terminal Header */}
      <header className="bg-black/60 border-b-2 border-green-500/40 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-green-400 glow-text">
              ▶ HFT TERMINAL
            </div>
            <div className="h-6 w-px bg-green-500/30" />
            <div className="text-xs text-green-400/60">
              Solana Trading System | Real-time Analysis
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center space-x-4 text-xs">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded border ${
              systemStatus.sniperActive 
                ? 'border-green-500 bg-green-500/10 text-green-400' 
                : 'border-red-500 bg-red-500/10 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${systemStatus.sniperActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span>SNIPER: {systemStatus.sniperActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-1 rounded border ${
              systemStatus.autoTradeEnabled 
                ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                : 'border-gray-600 bg-gray-600/10 text-gray-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${systemStatus.autoTradeEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} />
              <span>AUTO-TRADE: {systemStatus.autoTradeEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1 rounded border border-purple-500 bg-purple-500/10 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>CLIENTS: {systemStatus.connectedClients}</span>
            </div>
          </div>
          <div className="mt-4 lg:mt-0">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          </div>
        </div>
      </header>

      {/* Terminal Navigation */}
      <nav className="bg-black/40 border-b border-green-500/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center px-4 py-3">
            <span className="text-xs text-green-400/60 mr-6">nightgang@hft:~$</span>
            <div className="flex space-x-2">
              {tabs.map((tab, index) => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-mono transition-all ${
                      activeTab === tab.id
                        ? 'bg-green-500/20 text-green-400 border-l-2 border-r-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                        : 'text-gray-400 hover:text-green-400/80 hover:bg-green-500/10 border-l border-r border-gray-700/50'
                    }`}
                  >
                    {tab.name}
                  </button>
                  {index < tabs.length - 1 && <div className="w-px h-4 bg-gray-700/30 mx-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-gradient-to-b from-gray-950 to-black/80 min-h-[calc(100vh-200px)]">
        <div className="max-w-7xl mx-auto">
          <ActiveComponent systemStatus={systemStatus} onStatusUpdate={fetchSystemStatus} />
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="bg-black/60 border-t border-green-500/20 backdrop-blur-sm p-4 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 font-mono">
            <div>
              <span className="text-green-400">●</span> Solana RPC Connected | Latency: 45ms
            </div>
            <div className="text-center">
              {new Date().toLocaleString()} | v1.0.0
            </div>
            <div className="text-right">
              <span className="text-green-400">●</span> All Systems Operational
            </div>
          </div>
        </div>
      </footer>

      {/* Terminal Cursor Effect */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 10px #4ade80, 0 0 20px #22c55e;
          }
          50% {
            text-shadow: 0 0 20px #4ade80, 0 0 40px #22c55e;
          }
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }

        .glow-text {
          animation: glow 2s ease-in-out infinite;
        }

        /* Terminal scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.6);
        }
      `}</style>
    </div>
  );
}

export default App;
