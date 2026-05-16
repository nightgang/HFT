import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Sliders,
} from "lucide-react";
import axios from "axios";

const Settings = () => {
  const [settings, setSettings] = useState({
    maxDailyLoss: 1000,
    maxPositionSize: 10000,
    maxTradeFrequency: 20,
    minTradeInterval: 60,
    riskTolerance: "medium",
    autoTradeEnabled: false,
    sentimentWeighting: 0.3,
    technicalWeighting: 0.5,
    riskWeighting: 0.2,
  });

  const [uiPreferences, setUiPreferences] = useState({
    themeMode: "dark",
    accentColor: "purple",
    sidebarCompact: false,
    dashboardConfig: {
      showStatsCards: true,
      showTradePanel: true,
      showLiveFeed: true,
      showWalletTracker: true,
      showActiveTrades: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uiSaved, setUiSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    const storedUi = window.localStorage.getItem("uiPreferences");
    if (storedUi) {
      try {
        setUiPreferences((prev) => ({
          ...prev,
          ...JSON.parse(storedUi),
        }));
      } catch (error) {
        console.warn("Unable to load UI preferences", error);
      }
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings");
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put("/api/settings", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaving(false);
    }
  };

  const handleUiSave = () => {
    try {
      window.localStorage.setItem(
        "uiPreferences",
        JSON.stringify(uiPreferences)
      );
      window.dispatchEvent(
        new CustomEvent("frontend-ui-config-updated", {
          detail: uiPreferences,
        })
      );
      setUiSaved(true);
      setTimeout(() => setUiSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save UI preferences:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {saved && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">Settings saved successfully!</span>
        </div>
      )}

      {uiSaved && (
        <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400">Interface preferences saved!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Interface Preferences */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Interface Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Theme Mode</label>
              <select
                value={uiPreferences.themeMode}
                onChange={(e) =>
                  setUiPreferences({
                    ...uiPreferences,
                    themeMode: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
              <select
                value={uiPreferences.accentColor}
                onChange={(e) =>
                  setUiPreferences({
                    ...uiPreferences,
                    accentColor: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-cyan-500/30 rounded px-4 py-2 text-white"
              >
                <option value="purple">Purple</option>
                <option value="green">Green</option>
                <option value="cyan">Cyan</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={uiPreferences.sidebarCompact}
                  onChange={(e) =>
                    setUiPreferences({
                      ...uiPreferences,
                      sidebarCompact: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                />
                Compact Sidebar Layout
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Enable compact sidebar layout for a cleaner workspace.
              </p>
            </div>

            <div className="border-t border-slate-700/60 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Dashboard Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uiPreferences.dashboardConfig.showStatsCards}
                    onChange={(e) =>
                      setUiPreferences({
                        ...uiPreferences,
                        dashboardConfig: {
                          ...uiPreferences.dashboardConfig,
                          showStatsCards: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                  />
                  <span className="text-gray-200">Show stats cards</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uiPreferences.dashboardConfig.showTradePanel}
                    onChange={(e) =>
                      setUiPreferences({
                        ...uiPreferences,
                        dashboardConfig: {
                          ...uiPreferences.dashboardConfig,
                          showTradePanel: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                  />
                  <span className="text-gray-200">Show trade panel</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uiPreferences.dashboardConfig.showLiveFeed}
                    onChange={(e) =>
                      setUiPreferences({
                        ...uiPreferences,
                        dashboardConfig: {
                          ...uiPreferences.dashboardConfig,
                          showLiveFeed: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                  />
                  <span className="text-gray-200">Show live feed</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uiPreferences.dashboardConfig.showWalletTracker}
                    onChange={(e) =>
                      setUiPreferences({
                        ...uiPreferences,
                        dashboardConfig: {
                          ...uiPreferences.dashboardConfig,
                          showWalletTracker: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                  />
                  <span className="text-gray-200">Show wallet tracker</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uiPreferences.dashboardConfig.showActiveTrades}
                    onChange={(e) =>
                      setUiPreferences({
                        ...uiPreferences,
                        dashboardConfig: {
                          ...uiPreferences.dashboardConfig,
                          showActiveTrades: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-cyan-500/30"
                  />
                  <span className="text-gray-200">Show active trades table</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUiSave}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              Save Interface Preferences
            </button>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Risk Management</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Max Daily Loss ($)
              </label>
              <input
                type="number"
                value={settings.maxDailyLoss}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxDailyLoss: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum loss allowed per day
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Max Position Size ($)
              </label>
              <input
                type="number"
                value={settings.maxPositionSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxPositionSize: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum position size for single trade
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Risk Tolerance
              </label>
              <select
                value={settings.riskTolerance}
                onChange={(e) =>
                  setSettings({ ...settings, riskTolerance: e.target.value })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trading Rules */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Trading Rules</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Max Trade Frequency (per hour)
              </label>
              <input
                type="number"
                value={settings.maxTradeFrequency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTradeFrequency: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of trades per hour
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Min Trade Interval (seconds)
              </label>
              <input
                type="number"
                value={settings.minTradeInterval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minTradeInterval: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum time between trades
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={settings.autoTradeEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoTradeEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded bg-slate-800 border-purple-500/30"
                />
                Enable Auto Trading
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Allow system to execute trades automatically
              </p>
            </div>
          </div>
        </div>

        {/* Signal Weighting */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Signal Weighting</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">
                  Sentiment Weight
                </label>
                <span className="text-purple-400 font-semibold">
                  {(settings.sentimentWeighting * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sentimentWeighting}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sentimentWeighting: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">
                  Technical Weight
                </label>
                <span className="text-purple-400 font-semibold">
                  {(settings.technicalWeighting * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.technicalWeighting}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    technicalWeighting: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">Risk Weight</label>
                <span className="text-purple-400 font-semibold">
                  {(settings.riskWeighting * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.riskWeighting}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    riskWeighting: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <p className="text-xs text-gray-500 border-t border-purple-500/20 pt-3">
              Total Weight:{" "}
              {(
                (settings.sentimentWeighting +
                  settings.technicalWeighting +
                  settings.riskWeighting) *
                100
              ).toFixed(0)}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
