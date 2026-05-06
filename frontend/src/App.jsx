import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Sniper from './pages/Sniper';
import Portfolio from './pages/Portfolio';
import Logs from './pages/Logs';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState({
    sniperActive: false,
    autoTradeEnabled: false,
    connectedClients: 0,
  });

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', component: Dashboard },
    { id: 'sniper', name: 'Sniper', component: Sniper },
    { id: 'portfolio', name: 'Portfolio', component: Portfolio },
    { id: 'logs', name: 'Logs', component: Logs },
  ];

  useEffect(() => {
    // Fetch initial system status
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-400">Solana Trading System</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-2 py-1 rounded ${systemStatus.sniperActive ? 'bg-green-600' : 'bg-red-600'}`}>
              Sniper: {systemStatus.sniperActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`px-2 py-1 rounded ${systemStatus.autoTradeEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}>
              Auto Trade: {systemStatus.autoTradeEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className="px-2 py-1 rounded bg-purple-600">
              Clients: {systemStatus.connectedClients}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 border-r border-gray-700 hover:bg-gray-700 transition-colors ${
                activeTab === tab.id ? 'bg-gray-700 text-green-400 border-b-2 border-green-400' : 'text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <ActiveComponent systemStatus={systemStatus} onStatusUpdate={fetchSystemStatus} />
      </main>
    </div>
  );
}

export default App;