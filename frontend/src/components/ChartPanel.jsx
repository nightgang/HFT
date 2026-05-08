function ChartPanel({ title, values }) {
  const maxValue = Math.max(...values.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-slate-950/70 p-5 shadow-glowSoft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-violet-300">{title}</div>
          <div className="text-xs text-slate-400">Live strategy chart</div>
        </div>
        <div className="text-xs text-slate-500">Simulated pattern</div>
      </div>
      <div className="grid h-44 grid-cols-12 gap-1">
        {values.map((point) => (
          <div
            key={point.label}
            className="rounded-full bg-gradient-to-t from-violet-600 to-violet-300"
            style={{ height: `${(point.value / maxValue) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {values.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export default ChartPanel;
