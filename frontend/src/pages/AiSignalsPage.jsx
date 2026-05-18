import React, { useMemo, useState } from "react";
import { Brain, BarChart3, Sparkles, Shield, TrendingUp, Clock } from "lucide-react";
import { useRealtimeDashboardData } from "../hooks";
import { formatSignalConfidence, getSignalConfidenceClass } from "../hooks/aiSignalHelpers";

const toTimestamp = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString();
};

const statCard = (label, value, icon, accent) => (
  <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-lg shadow-purple-500/10">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs uppercase tracking-[0.24em] text-gray-400">{label}</span>
      {icon}
    </div>
    <div className="text-3xl font-bold text-white">{value}</div>
    {accent && <div className="mt-2 text-sm text-gray-400">{accent}</div>}
  </div>
);

const AiSignalsPage = () => {
  const realtime = useRealtimeDashboardData();
  const aiSignals = realtime.aiSignals || [];
  const predictions = realtime.aiPredictions || [];
  const highConfidenceSignals = aiSignals.filter((signal) => (signal.confidence ?? 0) >= 0.85);
  const sortedSignals = useMemo(
    () => [...aiSignals].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 12),
    [aiSignals],
  );
  const avgConfidence = aiSignals.length
    ? Math.round(
        aiSignals.reduce(
          (sum, signal) => sum + ((signal.confidence ?? 0) > 1 ? signal.confidence : (signal.confidence ?? 0) * 100),
          0,
        ) / aiSignals.length,
      )
    : 0;
  const lastSignal = aiSignals[0] || null;
  const confidenceBuckets = useMemo(() => {
    const buckets = { high: 0, medium: 0, low: 0 };
    aiSignals.forEach((signal) => {
      const value = (signal.confidence ?? 0) > 1 ? signal.confidence : (signal.confidence ?? 0) * 100;
      if (value >= 90) buckets.high += 1;
      else if (value >= 80) buckets.medium += 1;
      else buckets.low += 1;
    });
    return buckets;
  }, [aiSignals]);

  const [showHighConfidenceOnly, setShowHighConfidenceOnly] = useState(false);
  const displayedSignals = showHighConfidenceOnly ? highConfidenceSignals : sortedSignals;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-purple-300">
            <Brain className="w-4 h-4" /> AI SIGNALS
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white">Dedicated AI Signal Intelligence</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Track live AI signal generation, high-confidence recommendations, and prediction coverage in a dedicated workflow panel.
          </p>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {statCard(
            "Signal Volume",
            aiSignals.length,
            <Sparkles className="w-5 h-5 text-cyan-300" />,
            "Last 20 events",
          )}
          {statCard(
            "High Confidence",
            highConfidenceSignals.length,
            <Shield className="w-5 h-5 text-emerald-300" />,
            `${Math.round((highConfidenceSignals.length / Math.max(aiSignals.length, 1)) * 100)}% of feed`,
          )}
          {statCard(
            "Avg. Confidence",
            avgConfidence ? `${avgConfidence}%` : "N/A",
            <TrendingUp className="w-5 h-5 text-purple-300" />,
            "Across incoming signals",
          )}
          {statCard(
            "Predictions",
            predictions.length,
            <BarChart3 className="w-5 h-5 text-violet-300" />,
            "AI model output",
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-[0.24em]">Live Signal Feed</div>
                <h2 className="mt-3 text-xl font-semibold text-white">Realtime AI signals</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowHighConfidenceOnly(false)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    !showHighConfidenceOnly
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  All Signals
                </button>
                <button
                  onClick={() => setShowHighConfidenceOnly(true)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    showHighConfidenceOnly
                      ? "bg-emerald-500 text-black"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  High Confidence
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50">
              <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-black/40 px-4 py-3 text-xs uppercase tracking-[0.24em] text-gray-500">
                <span className="col-span-4">Token</span>
                <span className="col-span-3">Signal</span>
                <span className="col-span-2">Confidence</span>
                <span className="col-span-3">Updated</span>
              </div>
              <div className="divide-y divide-white/5">
                {displayedSignals.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    No AI signals available yet.
                  </div>
                ) : (
                  displayedSignals.map((signal, idx) => {
                    const confidence = signal.confidence ?? 0;
                    const normalized = confidence > 1 ? confidence : confidence * 100;
                    return (
                      <div key={`${signal.tokenMint || signal.token || idx}-${idx}`} className="grid grid-cols-12 gap-4 px-4 py-4 text-sm text-slate-200 hover:bg-white/5 transition">
                        <div className="col-span-4">
                          <div className="font-semibold text-white">{signal.tokenMint || signal.token || "UNKNOWN"}</div>
                          <div className="text-xs text-gray-500">{signal.source || signal.model || "AI model"}</div>
                        </div>
                        <div className="col-span-3 text-gray-300">{signal.signalType ? signal.signalType.replace(/_/g, " ").toUpperCase() : signal.recommendation || "Signal"}</div>
                        <div className="col-span-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getSignalConfidenceClass(confidence)}`}>
                            {formatSignalConfidence(confidence)}
                          </span>
                        </div>
                        <div className="col-span-3 text-right text-xs text-gray-500">{toTimestamp(signal.timestamp || signal.receivedAt || signal.createdAt)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gray-400">Signal Distribution</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">Confidence Buckets</h3>
                </div>
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: "High (>=90%)", value: confidenceBuckets.high, color: "bg-emerald-500" },
                  { label: "Medium (80-89%)", value: confidenceBuckets.medium, color: "bg-cyan-500" },
                  { label: "Low (<80%)", value: confidenceBuckets.low, color: "bg-amber-500" },
                ].map((bucket) => (
                  <div key={bucket.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{bucket.label}</span>
                      <span>{bucket.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className={`${bucket.color} h-full rounded-full`} style={{ width: `${aiSignals.length ? (bucket.value / aiSignals.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gray-400">Latest Signal</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">Current AI focus</h3>
                </div>
                <Clock className="w-5 h-5 text-slate-300" />
              </div>
              {lastSignal ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-slate-950/70 p-4 border border-white/5">
                    <div className="text-sm font-semibold text-white">{lastSignal.tokenMint || lastSignal.token || "UNKNOWN"}</div>
                    <div className="text-xs text-gray-400">{lastSignal.signalType ? lastSignal.signalType.replace(/_/g, " ").toUpperCase() : lastSignal.recommendation || "Signal"}</div>
                    <div className="mt-3 text-xs text-gray-400">{toTimestamp(lastSignal.timestamp || lastSignal.receivedAt || lastSignal.createdAt)}</div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className={`rounded-full px-3 py-1 ${getSignalConfidenceClass(lastSignal.confidence)}`}>
                      Confidence {formatSignalConfidence(lastSignal.confidence)}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                      {lastSignal.signalType?.replace(/_/g, " ") || "Unknown"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-sm text-gray-500">Waiting for AI signals to appear in the dedicated feed.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Signal Health</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Risk & confidence</h2>
            </div>
            <Shield className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-xs text-gray-400">Incoming Signal Rate</div>
              <div className="mt-2 text-2xl font-semibold text-white">{aiSignals.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-xs text-gray-400">High-confidence share</div>
              <div className="mt-2 text-2xl font-semibold text-white">{aiSignals.length ? `${Math.round((highConfidenceSignals.length / aiSignals.length) * 100)}%` : "0%"}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-xs text-gray-400">Prediction buffer</div>
              <div className="mt-2 text-2xl font-semibold text-white">{predictions.length}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AiSignalsPage;
