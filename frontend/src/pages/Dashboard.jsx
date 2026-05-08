import { useState, useEffect } from 'react';
import LiveFeed from '../components/LiveFeed';

function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalPnL: 0,
    hourlyReturn: 0,
    successRate: 0,
    avgTradeTime: 0,
    activePositions: 0,
    winCount: 0,
    lossCount: 0,
    totalTrades: 0,
  });

  const [systemHealth, setSystemHealth] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    connectionStatus: 'connected',
  });

  const [recentTrades, setRecentTrades] = useState([
    { id: 1, symbol: 'SOL/USDC', entry: 145.2, exit: 146.8, pnl: 1.6, time: '14:32:18' },
    { id: 2, symbol: 'JTO/USDC', entry: 2.34, exit: 2.31, pnl: -0.03, time: '14:31:45' },
    { id: 3, symbol: 'ORCA/USDC', entry: 0.89, exit: 0.92, pnl: 0.03, time: '14:30:22' },
  ]);

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();
    fetchSystemHealth();

    // Set up polling intervals
    const metricsInterval = setInterval(fetchMetrics, 5000);
    const healthInterval = setInterval(fetchSystemHealth, 3000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('http://localhost:3001/dashboard/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Use simulated data for demo
      setMetrics(prev => ({
        ...prev,
        totalPnL: (Math.random() - 0.5) * 100,
        hourlyReturn: (Math.random() - 0.3) * 10,
        successRate: 45 + Math.random() * 35,
        activePositions: Math.floor(Math.random() * 8),
      }));
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch('http://localhost:3001/system/health');
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Use simulated data for demo
      setSystemHealth(prev => ({
        ...prev,
        cpuUsage: 20 + Math.random() * 40,
        memoryUsage: 40 + Math.random() * 30,
        latency: 10 + Math.random() * 20,
      }));
    }
  };

  const getStatusColor = (value, thresholds = { good: 30, warning: 60 }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPnLColor = (value) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      {/* Terminal Header */}
      <div className="border-b border-green-500/30 bg-black/40 backdrop-blur-sm p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-400 glow-text">
              ▶ HFT TERMINAL SYSTEM
            </h1>
            <p className="text-xs text-green-400/60 mt-1">
              {new Date().toLocaleString()} | Real-time Market Analysis
            </p>
          </div>
          <div className={`text-sm px-3 py-1 rounded border ${
            systemHealth.connectionStatus === 'connected' 
              ? 'border-green-500 bg-green-500/10 text-green-400' 
              : 'border-red-500 bg-red-500/10 text-red-400'
          }`}>
            ● {systemHealth.connectionStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="px-6 pb-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total PnL */}
          <div className="border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm p-4 rounded-lg hover:border-cyan-400/50 transition-colors">
            <div className="text-xs text-cyan-400/70 uppercase tracking-wider mb-2">Total P&L</div>
            <div className={`text-3xl font-bold ${getPnLColor(metrics.totalPnL)}`}>
              ${metrics.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-2">24h Performance</div>
          </div>

          {/* Hourly Return */}
          <div className="border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm p-4 rounded-lg hover:border-purple-400/50 transition-colors">
            <div className="text-xs text-purple-400/70 uppercase tracking-wider mb-2">Hourly Return</div>
            <div className={`text-3xl font-bold ${getPnLColor(metrics.hourlyReturn)}`}>
              {metrics.hourlyReturn.toFixed(3)}%
            </div>
            <div className="text-xs text-gray-400 mt-2">Last 60 Minutes</div>
          </div>

          {/* Success Rate */}
          <div className="border border-green-500/30 bg-green-500/5 backdrop-blur-sm p-4 rounded-lg hover:border-green-400/50 transition-colors">
            <div className="text-xs text-green-400/70 uppercase tracking-wider mb-2">Win Rate</div>
            <div className="text-3xl font-bold text-green-400">
              {metrics.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {metrics.winCount}W / {metrics.lossCount}L
            </div>
          </div>

          {/* Active Positions */}
          <div className="border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm p-4 rounded-lg hover:border-orange-400/50 transition-colors">
            <div className="text-xs text-orange-400/70 uppercase tracking-wider mb-2">Active</div>
            <div className="text-3xl font-bold text-orange-400">
              {metrics.activePositions}
            </div>
            <div className="text-xs text-gray-400 mt-2">Open Positions</div>
          </div>
        </div>

        {/* System Health & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <div className="border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-sm text-red-400 uppercase tracking-wider mb-4 font-bold">
              ⚠ System Health
            </div>
            
            <div className="space-y-3">
              {/* CPU Usage */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">CPU Usage</span>
                  <span className={`text-xs font-bold ${getStatusColor(systemHealth.cpuUsage)}`}>
                    {systemHealth.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-red-500/30">
                  <div 
                    className={`h-full transition-all ${
                      systemHealth.cpuUsage > 60 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(systemHealth.cpuUsage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Memory</span>
                  <span className={`text-xs font-bold ${getStatusColor(systemHealth.memoryUsage)}`}>
                    {systemHealth.memoryUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-red-500/30">
                  <div 
                    className={`h-full transition-all ${
                      systemHealth.memoryUsage > 60 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(systemHealth.memoryUsage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Latency */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Network Latency</span>
                  <span className={`text-xs font-bold ${getStatusColor(systemHealth.latency, { good: 20, warning: 50 })}`}>
                    {systemHealth.latency.toFixed(0)}ms
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-red-500/30">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min(systemHealth.latency / 100 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-300">Systems Operational</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-300">Price Feed Active</span>
              </div>
            </div>
          </div>

          {/* Live Feed - spans 2 columns */}
          <div className="lg:col-span-2">
            <LiveFeed recentTrades={recentTrades} />
          </div>
        </div>

        {/* Recent Trades Table */}
        <div className="border border-green-500/30 bg-green-500/5 backdrop-blur-sm p-4 rounded-lg">
          <div className="text-sm text-green-400 uppercase tracking-wider mb-4 font-bold">
            └─ Recent Trades
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-green-500/20 text-green-400/60">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">PAIR</th>
                  <th className="text-right py-2 px-2">ENTRY</th>
                  <th className="text-right py-2 px-2">EXIT</th>
                  <th className="text-right py-2 px-2">P&L</th>
                  <th className="text-right py-2 px-2">TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-green-500/10 hover:bg-green-500/10 transition-colors">
                    <td className="py-2 px-2 text-gray-400">{trade.id}</td>
                    <td className="py-2 px-2 text-cyan-400">{trade.symbol}</td>
                    <td className="py-2 px-2 text-right text-gray-300">${trade.entry.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-300">${trade.exit.toFixed(2)}</td>
                    <td className={`py-2 px-2 text-right font-bold ${getPnLColor(trade.pnl)}`}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-400">{trade.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Terminal Info */}
        <div className="border border-gray-700/30 bg-gray-900/30 backdrop-blur-sm p-3 rounded-lg text-xs text-gray-500 font-mono">
          <div className="flex justify-between">
            <span>nightgang@hft:~$ system-status --dashboard</span>
            <span>[{new Date().toLocaleTimeString()}]</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 10px #4ade80, 0 0 20px #22c55e;
          }
          50% {
            text-shadow: 0 0 20px #4ade80, 0 0 40px #22c55e;
          }
        }
        
        .glow-text {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
