import { useState, useEffect } from "react";
import { BrowserRouter as Router, NavLink, Routes, Route } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Zap,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  MessageCircle,
  Link as LinkIcon,
  Layers,
  Package,
  Settings as SettingsIcon,
  Wallet,
  History,
  Search,
  AreaChart,
  Bell,
  Key,
  Sun,
  Moon,
} from "lucide-react";
import HFTDashboard from "./pages/HFTDashboard";
import AdvancedOrders from "./pages/AdvancedOrders";
import PnLDashboard from "./pages/PnLDashboard";
import RiskHeatmap from "./pages/RiskHeatmap";
import PredictiveAlerts from "./pages/PredictiveAlerts";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import CrossChainBridge from "./pages/CrossChainBridge";
import LiquidityPools from "./pages/LiquidityPools";
import JitoBundles from "./pages/JitoBundles";
import Settings from "./pages/Settings";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import TradeHistory from "./pages/TradeHistory";
import MarketScreener from "./pages/MarketScreener";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import NotificationsHub from "./pages/NotificationsHub";
import APIKeysManager from "./pages/APIKeysManager";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            ⚔️ KATANA MODE
          </div>
          <div className="text-gray-500 text-sm">
            Initializing trading engine...
          </div>
          <div className="w-48 h-1 bg-purple-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const routes = [
    { path: "/", label: "Trading", icon: Home, element: <HFTDashboard darkMode={darkMode} onToggleDarkMode={() => setDarkMode((prev) => !prev)} /> },
    { path: "/portfolio", label: "Portfolio", icon: Wallet, element: <PortfolioDashboard /> },
    { path: "/history", label: "Trade History", icon: History, element: <TradeHistory /> },
    { path: "/screener", label: "Market Screener", icon: Search, element: <MarketScreener /> },
    { path: "/analytics", label: "Analytics", icon: AreaChart, element: <PerformanceAnalytics /> },
    { path: "/notifications", label: "Notifications", icon: Bell, element: <NotificationsHub /> },
    { path: "/api-keys", label: "API Keys", icon: Key, element: <APIKeysManager /> },
    { path: "/advanced-orders", label: "Advanced Orders", icon: Zap, element: <AdvancedOrders /> },
    { path: "/pnl", label: "P&L Dashboard", icon: TrendingUp, element: <PnLDashboard /> },
    { path: "/risk", label: "Risk Heatmap", icon: AlertTriangle, element: <RiskHeatmap /> },
    { path: "/alerts", label: "Alerts", icon: BarChart3, element: <PredictiveAlerts /> },
    { path: "/sentiment", label: "Sentiment", icon: MessageCircle, element: <SentimentAnalysis /> },
    { path: "/bridge", label: "Cross-Chain", icon: LinkIcon, element: <CrossChainBridge /> },
    { path: "/liquidity", label: "Liquidity Pools", icon: Layers, element: <LiquidityPools /> },
    { path: "/bundles", label: "Jito Bundles", icon: Package, element: <JitoBundles /> },
    { path: "/settings", label: "Settings", icon: SettingsIcon, element: <Settings /> },
  ];

  const navItems = routes.map((route) => ({
    path: route.path,
    label: route.label,
    icon: route.icon,
  }));

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex">
        {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900/80 border-r border-purple-500/20 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-purple-400">⚔️ KATANA</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-purple-500/20 rounded transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:bg-purple-500/20"
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-purple-500/20 text-xs text-gray-500 text-center">
          {sidebarOpen && <p>Advanced Trading Platform</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<HFTDashboard darkMode={darkMode} onToggleDarkMode={() => setDarkMode((prev) => !prev)} />} />
          </Routes>
        </div>
      </div>
    </div>
  </Router>
  );
}

export default App;
