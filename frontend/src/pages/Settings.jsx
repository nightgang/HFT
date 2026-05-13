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

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/settings");
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
      await axios.put("http://localhost:3001/api/settings", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaving(false);
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

      <div className="space-y-6">
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
