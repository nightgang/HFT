import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart } from "lightweight-charts";
import TerminalConsole from "../components/TerminalConsole";
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

  // Trading Icons
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
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

// Mock data for demonstration
const mockTrades = [
  { id: 1, token: "KAT", type: "BUY", amount: "1000", entry: "0.000842", current: "0.000956", pnl: "+$114", pnlPercent: "+13.5%", status: "ACTIVE" },
  { id: 2, token: "SOL", type: "SELL", amount: "50", entry: "142.50", current: "138.20", pnl: "+$215", pnlPercent: "+3.0%", status: "ACTIVE" },
  { id: 3, token: "RAY", type: "BUY", amount: "200", entry: "2.145", current: "2.312", pnl: "+$334", pnlPercent: "+7.8%", status: "ACTIVE" },
];

const mockLiveFeed = [
  { id: 1, type: "LAUNCH", message: "New token $NEON launched on Raydium", time: "2s ago", color: "text-purple-400" },
  { id: 2, type: "TRADE", message: "Smart wallet bought 500K $KAT", time: "5s ago", color: "text-green-400" },
  { id: 3, type: "LIQUIDITY", message: "Raydium pool added $50K liquidity", time: "12s ago", color: "text-cyan-400" },
  { id: 4, type: "PRICE", message: "$KAT price: $0.000956 (+211%)", time: "18s ago", color: "text-emerald-400" },
];

const mockWallets = [
  { address: "7xKX...9mL2", pnl: "+$2,450", balance: "$15,230", status: "PROFIT" },
  { address: "3pQ8...4nR9", pnl: "+$890", balance: "$8,120", status: "PROFIT" },
  { address: "9wL5...2kT7", pnl: "-$320", balance: "$4,890", status: "LOSS" },
];

const HFTDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

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
    { id: "strategies", label: "Strategies", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "plugins", label: "Plugins", icon: Puzzle },
  ];

  const statsCards = [
    { label: "Total PNL", value: "$18,742.60", change: "+7.8%", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Win Rate", value: "86.3%", change: "+4.2%", icon: Activity, color: "text-emerald-400" },
    { label: "Total Volume", value: "$127.4K", change: "+12.5%", icon: DollarSign, color: "text-cyan-400" },
    { label: "Active Trades", value: "14", change: "Realtime", icon: ZapIcon, color: "text-purple-400" },
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
              onClick={() => setActiveTab(item.id)}
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
            </div>
          </div>

          {/* Stats Cards */}
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
        </header>

        {/* Main Grid Layout */}
        <div className="p-6 grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Main Chart - 60% width */}
          <motion.div
            className="col-span-12 lg:col-span-7 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg overflow-hidden"
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
          <motion.div
            className="col-span-12 lg:col-span-2 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-500/20 pb-2">
              KATANA TRADE PANEL
            </h3>

            {/* Buy/Sell Tabs */}
            <div className="flex mb-4">
              <button className="flex-1 bg-green-500/20 text-green-400 py-2 px-4 rounded-l-lg border border-green-500/30">
                BUY
              </button>
              <button className="flex-1 bg-red-500/20 text-red-400 py-2 px-4 rounded-r-lg border border-red-500/30">
                SELL
              </button>
            </div>

            {/* Trade Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Strategy</label>
                <select className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white text-sm">
                  <option>Market Order</option>
                  <option>Limit Order</option>
                  <option>Stop Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Amount (SOL)</label>
                <input
                  type="number"
                  placeholder="0.1"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Slippage (%)</label>
                <select className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white text-sm">
                  <option>0.5%</option>
                  <option>1%</option>
                  <option>2%</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Jito Bundle</span>
                  <div className="w-10 h-5 bg-green-500/20 rounded-full relative">
                    <div className="w-4 h-4 bg-green-400 rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">MEV Protection</span>
                  <div className="w-10 h-5 bg-green-500/20 rounded-full relative">
                    <div className="w-4 h-4 bg-green-400 rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Auto Buy</span>
                  <div className="w-10 h-5 bg-purple-500/20 rounded-full relative">
                    <div className="w-4 h-4 bg-purple-400 rounded-full absolute left-0.5 top-0.5"></div>
                  </div>
                </label>
              </div>

              {/* Execute Button */}
              <motion.button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-green-500/30 border border-green-400/30"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 255, 136, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>EXECUTE BUY</span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Right Analytics Panel - 20% width */}
          <motion.div
            className="col-span-12 lg:col-span-3 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Live Feed */}
            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-500/20 pb-2">
                LIVE FEED
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {mockLiveFeed.map((feed) => (
                    <motion.div
                      key={feed.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 p-2 bg-slate-800/50 rounded border border-purple-500/10"
                    >
                      <div className={`w-2 h-2 rounded-full ${feed.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex-1">
                        <div className={`text-sm ${feed.color}`}>{feed.message}</div>
                        <div className="text-xs text-gray-500">{feed.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Wallet Tracker */}
            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-500/20 pb-2">
                WALLET TRACKER
              </h3>
              <div className="space-y-3">
                {mockWallets.map((wallet) => (
                  <div key={wallet.address} className="p-3 bg-slate-800/50 rounded border border-purple-500/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-gray-400">{wallet.address}</span>
                      <span className={`text-xs ${wallet.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {wallet.pnl}
                      </span>
                    </div>
                    <div className="text-sm text-white">{wallet.balance}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Active Trades Table - Full width bottom */}
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
                  {mockTrades.map((trade) => (
                    <motion.tr
                      key={trade.id}
                      className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors"
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.05)' }}
                    >
                      <td className="px-4 py-3 text-sm text-white font-medium">{trade.token}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{trade.amount}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">${trade.entry}</td>
                      <td className="px-4 py-3 text-sm text-white">${trade.current}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-medium">{trade.pnl}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-medium">{trade.pnlPercent}</td>
                      <td className="px-4 py-3">
                        <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors">
                          Close
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* KATANA TERMINAL */}
        <TerminalConsole />
      </div>
    </div>
  );
};

export default HFTDashboard;
