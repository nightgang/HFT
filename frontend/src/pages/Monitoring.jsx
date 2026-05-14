import React from "react";
import { Activity, ExternalLink, ShieldCheck } from "lucide-react";

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "/grafana";
const prometheusUrl = import.meta.env.VITE_PROMETHEUS_URL || "/prometheus";
const backendMetricsUrl = import.meta.env.VITE_BACKEND_METRICS_URL || "/metrics";

const Monitoring = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitoring</h1>
          <p className="text-slate-400 mt-2">
            View system health, telemetry, and infrastructure dashboards.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/70 px-5 py-3 border border-purple-500/30">
          <Activity className="w-5 h-5 text-purple-300" />
          <span className="text-slate-200">Connected to monitoring stack</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6 shadow-xl shadow-purple-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Grafana Dashboard</h2>
              <p className="text-sm text-slate-500">Visualize metrics and alerts from the trading system.</p>
            </div>
          </div>
          <a
            href={grafanaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 transition"
          >
            Open Grafana
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6 shadow-xl shadow-purple-500/10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Prometheus Metrics</h2>
              <p className="text-sm text-slate-500">Query raw metrics and validate exporter health.</p>
            </div>
          </div>
          <a
            href={prometheusUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 transition"
          >
            Open Prometheus
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6 shadow-xl shadow-purple-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-sky-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Backend Metrics</h2>
              <p className="text-sm text-slate-500">Inspect API and system metrics exposed by the backend.</p>
            </div>
          </div>
          <a
            href={backendMetricsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 transition"
          >
            Open Metrics
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Embedded Monitoring Preview</h2>
        <p className="text-sm text-slate-400 mb-4">
          If the monitoring stack is available, the Grafana dashboard will appear below. If embedding is blocked by browser security or Grafana settings, use the direct link above.
        </p>
        <div className="overflow-hidden rounded-3xl border border-purple-500/10 bg-black">
          <iframe
            title="Grafana Monitoring"
            src={grafanaUrl}
            className="h-[720px] w-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
