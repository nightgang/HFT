import { useEffect, useState } from "react";
import { BrowserRouter as Router, NavLink, Routes, Route } from "react-router-dom";
import routes from "./routeConfig";
import NotFound from "./pages/NotFound";

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
          <div className="text-gray-500 text-sm">Initializing trading engine...</div>
          <div className="w-48 h-1 bg-purple-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex">
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-slate-900/90 border-r border-purple-500/20 transition-all duration-300 flex flex-col`}
        >
          <div className="p-6 flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-purple-400">⚔️ KATANA</h1>}
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
                <p className="mt-2 text-xs text-slate-500">Mode: {darkMode ? "Dark" : "Light"}</p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Katana Trading Suite</h2>
                <p className="text-slate-400">Fast analytics and smart trading tools in one dashboard.</p>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-full border border-purple-500/30 bg-slate-950/80 px-4 py-2 text-slate-200 hover:bg-purple-500/20 transition"
              >
                {darkMode ? "Dark Mode" : "Light Mode"}
              </button>
            </div>

            <Routes>
              {routes.map((route) => {
                const Page = route.component;
                const element = route.needsDarkMode ? (
                  <Page darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
                ) : (
                  <Page />
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
