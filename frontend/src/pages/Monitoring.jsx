import React from "react";
import { Activity } from "lucide-react";

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

      <div className="rounded-3xl border border-purple-500/20 bg-slate-900/70 p-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Monitoring Status</h2>
        <p className="text-slate-400">
          Monitoring and alerting system is active. All metrics are being collected and stored in Prometheus with Grafana dashboards for visualization.
        </p>
      </div>
    </div>
  );
};

export default Monitoring;
