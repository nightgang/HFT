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

import HFTDashboard from "./pages/HFTDashboard";
import AdvancedOrders from "./pages/AdvancedOrders";
import Monitoring from "./pages/Monitoring";
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
