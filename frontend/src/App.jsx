import { useEffect, useState } from "react";
import { BrowserRouter as Router, NavLink, Routes, Route } from "react-router-dom";
import routes from "./routeConfig";
import NotFound from "./pages/hft/NotFound";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeMode, setThemeMode] = useState("dark");
  const [accentColor, setAccentColor] = useState("purple");
  const [dashboardConfig, setDashboardConfig] = useState({
    showStatsCards: true,
    showTradePanel: true,
    showLiveFeed: true,
    showWalletTracker: true,
    showActiveTrades: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedUiConfig = window.localStorage.getItem("uiPreferences");
    if (storedUiConfig) {
      try {
        const parsed = JSON.parse(storedUiConfig);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.sidebarCompact !== undefined) {
          setSidebarOpen(!parsed.sidebarCompact);
        }
        if (parsed.dashboardConfig) {
          setDashboardConfig((prev) => ({
            ...prev,
            ...parsed.dashboardConfig,
          }));
        }
      } catch (error) {
        console.warn("Failed to parse UI preferences", error);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("data-accent", accentColor);
    window.localStorage.setItem(
      "uiPreferences",
      JSON.stringify({
        themeMode,
        accentColor,
        sidebarCompact: !sidebarOpen,
        dashboardConfig,
      })
    );
  }, [themeMode, accentColor, sidebarOpen, dashboardConfig]);

  useEffect(() => {
    const handleUiUpdate = (event) => {
      const detail = event?.detail || {};
      if (detail.themeMode) setThemeMode(detail.themeMode);
      if (detail.accentColor) setAccentColor(detail.accentColor);
      if (detail.sidebarCompact !== undefined) {
        setSidebarOpen(!detail.sidebarCompact);
      }
      if (detail.dashboardConfig) {
        setDashboardConfig((prev) => ({
          ...prev,
          ...detail.dashboardConfig,
        }));
      }
    };
    window.addEventListener("frontend-ui-config-updated", handleUiUpdate);
    return () => window.removeEventListener("frontend-ui-config-updated", handleUiUpdate);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              HFT-SYSTEM
            </div>
          <div className="text-gray-500 text-sm">Initializing trading engine...</div>
          <div className="w-48 h-1 bg-purple-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const toggleDarkMode = () =>
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex">
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-slate-900/90 border-r border-purple-500/20 transition-all duration-300 flex flex-col`}
        >
          <div className="p-6 flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-cyan-400">HFT-SYSTEM</h1>}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? "«" : "»"}
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-2">
            {routes.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "text-slate-300 hover:bg-purple-500/20"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="p-4 border-t border-purple-500/20 text-sm text-slate-400">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-purple-300">Status</div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-slate-300">Advanced Trading Platform</p>
                <p className="mt-2 text-xs text-slate-500">
                  Mode: {themeMode === "dark" ? "Dark" : "Light"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Accent: {accentColor}
                </p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">HFT-SYSTEM</h2>
                <p className="text-slate-400">Professional Solana HFT Command Center.</p>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-full border border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] hover:text-white transition"
              >
                Switch to {themeMode === "dark" ? "Light" : "Dark"}
              </button>
            </div>

            <Routes>
              {routes.map((route) => {
                const Page = route.component;
                const element = route.needsDarkMode ? (
                  <Page
                    darkMode={themeMode === "dark"}
                    onToggleDarkMode={toggleDarkMode}
                    dashboardConfig={dashboardConfig}
                  />
                ) : (
                  <Page dashboardConfig={dashboardConfig} />
                );
                return <Route key={route.path} path={route.path} element={element} />;
              })}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
