import {
  Home,
  Zap,
  TrendingUp,
  AreaChart,
  Bell,
  Key,
  Wallet,
  History,
  Search,
  Layers,
  Package,
  Settings as SettingsIcon,
  AlertTriangle,
  MessageCircle,
  Link as LinkIcon,
  Activity,
} from "lucide-react";

import HFTDashboard from "./pages/hft/HFTDashboard";
import AdvancedOrders from "./pages/hft/AdvancedOrders";
import Monitoring from "./pages/hft/Monitoring";
import PnLDashboard from "./pages/hft/PnLDashboard";
import RiskHeatmap from "./pages/hft/RiskHeatmap";
import PredictiveAlerts from "./pages/hft/PredictiveAlerts";
import SentimentAnalysis from "./pages/hft/SentimentAnalysis";
import CrossChainBridge from "./pages/hft/CrossChainBridge";
import LiquidityPools from "./pages/hft/LiquidityPools";
import JitoBundles from "./pages/hft/JitoBundles";
import Settings from "./pages/hft/Settings";
import PortfolioDashboard from "./pages/hft/PortfolioDashboard";
import TradeHistory from "./pages/hft/TradeHistory";
import MarketScreener from "./pages/hft/MarketScreener";
import PerformanceAnalytics from "./pages/hft/PerformanceAnalytics";
import NotificationsHub from "./pages/hft/NotificationsHub";
import APIKeysManager from "./pages/hft/APIKeysManager";

const routes = [
  {
    path: "/",
    label: "Trading",
    icon: Home,
    component: HFTDashboard,
    exact: true,
    needsDarkMode: true,
  },
  {
    path: "/terminal",
    label: "HFT Terminal",
    icon: Zap,
    component: HFTDashboard,
    needsDarkMode: true,
  },
  {
    path: "/portfolio",
    label: "Portfolio",
    icon: Wallet,
    component: PortfolioDashboard,
  },
  {
    path: "/history",
    label: "Trade History",
    icon: History,
    component: TradeHistory,
  },
  {
    path: "/screener",
    label: "Market Screener",
    icon: Search,
    component: MarketScreener,
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: AreaChart,
    component: PerformanceAnalytics,
  },
  {
    path: "/monitoring",
    label: "Monitoring",
    icon: Activity,
    component: Monitoring,
  },
  {
    path: "/notifications",
    label: "Notifications",
    icon: Bell,
    component: NotificationsHub,
  },
  {
    path: "/api-keys",
    label: "API Keys",
    icon: Key,
    component: APIKeysManager,
  },
  {
    path: "/advanced-orders",
    label: "Advanced Orders",
    icon: Zap,
    component: AdvancedOrders,
  },
  {
    path: "/pnl",
    label: "P&L Dashboard",
    icon: TrendingUp,
    component: PnLDashboard,
  },
  {
    path: "/risk",
    label: "Risk Heatmap",
    icon: AlertTriangle,
    component: RiskHeatmap,
  },
  {
    path: "/alerts",
    label: "Alerts",
    icon: Bell,
    component: PredictiveAlerts,
  },
  {
    path: "/sentiment",
    label: "Sentiment",
    icon: MessageCircle,
    component: SentimentAnalysis,
  },
  {
    path: "/bridge",
    label: "Cross-Chain",
    icon: LinkIcon,
    component: CrossChainBridge,
  },
  {
    path: "/liquidity",
    label: "Liquidity Pools",
    icon: Layers,
    component: LiquidityPools,
  },
  {
    path: "/bundles",
    label: "Jito Bundles",
    icon: Package,
    component: JitoBundles,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: SettingsIcon,
    component: Settings,
  },
];

export default routes;
