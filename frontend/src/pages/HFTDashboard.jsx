import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createChart } from "lightweight-charts";
import TerminalConsole from "../components/TerminalConsole";
import KatanaLiveFeed from "../components/KatanaLiveFeed";
import KatanaWalletTracker from "../components/KatanaWalletTracker";
import KatanaTradePanel from "../components/KatanaTradePanel";
import {
  // Navigation Icons
  LayoutDashboard,
  Terminal,
  Zap,
  Wallet,
  Target,
  Briefcase,
  FileText,
  History,
  BarChart3,
  Brain,
  Settings,
  Puzzle,
  Activity,

  // Trading Icons
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity as ActivityIcon,
  Shield,
  Zap as ZapIcon,
  Play,
  Pause,
  RotateCcw,

  // Status Icons
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,

  // UI Icons
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react";

const HFTDashboard = ({ dashboardConfig: dashboardConfigProp }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardConfig, setDashboardConfig] = useState({
    showStatsCards: true,
    showTradePanel: true,
    showLiveFeed: true,
    showWalletTracker: true,
    showActiveTrades: true,
  });
  const [activeTrades, setActiveTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // Load dashboard config from local storage on mount
  useEffect(() => {
    const storedUiConfig = window.localStorage.getItem("uiPreferences");
    if (storedUiConfig) {
      try {
        const parsed = JSON.parse(storedUiConfig);
        if (parsed.dashboardConfig) {
          setDashboardConfig((prev) => ({
            ...prev,
            ...parsed.dashboardConfig,
          }));
        }
      } catch (error) {
        console.warn("Unable to load dashboard configuration", error);
      }
    }
  }, []);

  useEffect(() => {
    if (dashboardConfigProp) {
      setDashboardConfig((prev) => ({
        ...prev,
        ...dashboardConfigProp,
      }));
    }
  }, [dashboardConfigProp]);

  useEffect(() => {
    let mounted = true;
    const fetchActiveTrades = async () => {
      setTradesLoading(true);
      try {
        const response = await fetch("/api/trading/trades?limit=12");
        const data = await response.json();
        if (!mounted) return;
        if (!response.ok) {
          throw new Error(data.error || "Unable to load active trades");
        }
        setActiveTrades(data.trades || []);
        setTradesError(null);
      } catch (error) {
        if (!mounted) return;
        setTradesError(error.message || "Failed to load trades");
        setActiveTrades([]);
      } finally {
        if (mounted) setTradesLoading(false);
      }
    };

    fetchActiveTrades();
    const intervalId = setInterval(fetchActiveTrades, 10000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#a855f7',
        },
        grid: {
          vertLines: { color: '#1a1a2e' },
          horzLines: { color: '#1a1a2e' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#a855f7',
        },
        timeScale: {
          borderColor: '#a855f7',
          timeVisible: true,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#a855f7',
        borderVisible: false,
        wickUpColor: '#00ff88',
        wickDownColor: '#a855f7',
      });

      // Mock candlestick data
      const data = [
        { time: '2024-01-01', open: 0.0008, high: 0.0009, low: 0.0007, close: 0.00085 },
        { time: '2024-01-02', open: 0.00085, high: 0.00095, low: 0.0008, close: 0.0009 },
        { time: '2024-01-03', open: 0.0009, high: 0.0010, low: 0.00085, close: 0.00095 },
        { time: '2024-01-04', open: 0.00095, high: 0.0011, low: 0.0009, close: 0.00098 },
        { time: '2024-01-05', open: 0.00098, high: 0.0012, low: 0.00095, close: 0.0011 },
      ];

      candlestickSeries.setData(data);
      chartRef.current = chart;

      // Handle resize
      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [sidebarCollapsed]);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "trade", label: "Trade", icon: Zap },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "sniper", label: "Sniper", icon: Target },
    { id: "positions", label: "Positions", icon: Briefcase },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "history", label: "History", icon: History },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "strategies", label: "Strategies", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "plugins", label: "Plugins", icon: Puzzle },
  ];

  const statsCards = [
    { label: "Total PNL", value: "$18,742.60", change: "+7.8%", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Win Rate", value: "86.3%", change: "+4.2%", icon: Activity, color: "text-emerald-400" },
    { label: "Total Volume", value: "$127.4K", change: "+12.5%", icon: DollarSign, color: "text-cyan-400" },
    { label: "Active Trades", value: tradesLoading ? "…" : `${activeTrades.length}`, change: "Realtime", icon: ZapIcon, color: "text-purple-400" },
    { label: "Balance", value: "$45,230", change: "+2.1%", icon: Wallet, color: "text-emerald-400" },
    { label: "Priority Fee", value: "0.000005", change: "Optimal", icon: Shield, color: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050510] via-[#0a0a1a] to-[#050510] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,136,0.03),transparent_50%)] pointer-events-none" />

      {/* Sidebar */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: sidebarCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-70 bg-black/80 backdrop-blur-xl border-r border-purple-500/20 z-50"
      >
        {/* Logo */}
        <div className="p-6 border-b border-purple-500/20">
          <motion.h1
            className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            HFT-SYSTEM
          </motion.h1>
          <div className="text-xs text-purple-400 mt-1 font-mono">KATANA MODE</div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.id === 'monitoring') {
                  window.open('/monitoring', '_blank');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-purple-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/20"
                  : "hover:bg-purple-500/10 border border-transparent"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-purple-400" : "text-gray-400"}`} />
              <span className={`text-sm ${activeTab === item.id ? "text-white" : "text-gray-300"}`}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </nav>

        {/* Katana Mode Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <motion.button
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-500/30 border border-purple-400/30"
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-mono">KATANA MODE</span>
            </div>
          </motion.button>
        </div>

        {/* Collapse Button */}
        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-purple-400" /> : <ChevronLeft className="w-4 h-4 text-purple-400" />}
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-70'}`}>
        {/* Header */}
        <header className="bg-black/40 backdrop-blur-xl border-b border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                HFT-SYSTEM – KATANA MODE
              </h1>
              <p className="text-gray-400 text-sm mt-1">Ultra-fast Solana trading terminal</p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-gray-300">RPC</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm text-gray-300">WS</span>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                {currentTime.toLocaleTimeString()}
              </div>
              <motion.a
                href="/monitoring"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActivityIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Monitoring</span>
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            </div>
          </div>

          {/* Stats Cards */}
          {dashboardConfig.showStatsCards && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
              {statsCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                    <span className={`text-xs ${card.change.startsWith('+') ? 'text-green-400' : card.change.startsWith('-') ? 'text-red-400' : 'text-cyan-400'}`}>
                      {card.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                  <div className="text-xs text-gray-400">{card.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </header>

        {/* Main Grid Layout */}
        <div className="p-6 grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Main Chart */}
          <motion.div
            className={`col-span-12 ${!dashboardConfig.showTradePanel && !dashboardConfig.showLiveFeed && !dashboardConfig.showWalletTracker ? 'lg:col-span-12' : !dashboardConfig.showTradePanel && (dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) ? 'lg:col-span-9' : dashboardConfig.showTradePanel && !(dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) ? 'lg:col-span-10' : 'lg:col-span-7'} bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">$KAT – Katana Token</h2>
                  <div className="text-sm text-gray-400">Current: $0.000956 <span className="text-green-400">+211%</span></div>
                </div>
                <div className="flex gap-2">
                  {['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h'].map((tf) => (
                    <button
                      key={tf}
                      className="px-3 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded transition-colors"
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div ref={chartContainerRef} className="h-96 w-full" />
          </motion.div>

          {/* Trade Panel - 20% width */}
          {dashboardConfig.showTradePanel && (
            <motion.div
              className="col-span-12 lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <KatanaTradePanel />
            </motion.div>
          )}

          {(dashboardConfig.showLiveFeed || dashboardConfig.showWalletTracker) && (
            <motion.div
              className="col-span-12 lg:col-span-3 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {dashboardConfig.showLiveFeed && <KatanaLiveFeed />}
              {dashboardConfig.showWalletTracker && <KatanaWalletTracker />}
            </motion.div>
          )}

          {dashboardConfig.showActiveTrades && (
            <motion.div
              className="col-span-12 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-lg font-bold text-white">ACTIVE TRADES</h3>
              </div>
              <div className="overflow-x-auto">
                {tradesLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Loading active trades...
                  </div>
                ) : tradesError ? (
                  <div className="p-6 text-center text-sm text-red-400">
                    {tradesError}
                  </div>
                ) : activeTrades.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No active trades available right now.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Current</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">PNL</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">PNL %</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrades.map((trade, index) => {
                        const type = trade.side?.toUpperCase?.() || trade.type || "BUY";
                        const token = trade.token || trade.market || trade.symbol || "UNKNOWN";
                        const amount = trade.amount || trade.quantity || "-";
                        const entry = trade.entryPrice || trade.price || trade.entry || "-";
                        const current = trade.currentPrice || trade.current || "-";
                        const pnl = trade.pnl || trade.profit || "-";
                        const pnlPercent = trade.pnlPercent || trade.returnPercent || "-";
                        return (
                          <motion.tr
                            key={trade.id || `${token}-${index}`}
                            className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors"
                            whileHover={{ backgroundColor: "rgba(168, 85, 247, 0.05)" }}
                          >
                            <td className="px-4 py-3 text-sm text-white font-medium">{token}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">${entry}</td>
                            <td className="px-4 py-3 text-sm text-white">${current}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnl}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{pnlPercent}</td>
                            <td className="px-4 py-3">
                              <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors">
                                Close
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* KATANA TERMINAL */}
        <TerminalConsole />
      </div>
    </div>
  );
};

export default HFTDashboard;
