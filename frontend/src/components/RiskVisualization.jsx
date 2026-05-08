function RiskVisualization({ riskScore, exposure, alerts }) {
  const riskClass = riskScore > 75 ? 'text-rose-400' : riskScore > 40 ? 'text-amber-300' : 'text-emerald-400';

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-slate-950/70 p-5 shadow-glowSoft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-amber-300">Risk Visualization</div>
          <div className="text-xs text-slate-400">Portfolio exposure and alert heatmap</div>
        </div>
        <div className={`text-xs font-semibold ${riskClass}`}>Risk Score {riskScore}%</div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-900/80 p-4">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Exposure</div>
          <div className="mt-2 text-2xl font-semibold text-white">{exposure}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/80 p-4 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Active Alerts</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {alerts.map((alert, idx) => (
              <li key={idx} className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <div className="font-medium text-white">{alert.title}</div>
                <div className="text-slate-500 text-xs mt-1">{alert.description}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RiskVisualization;
