import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

function AdvancedChart({ data, height = 280 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#050816' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
        timeVisible: true,
      },
    });

    const series = chart.addLineSeries({
      color: '#7c3aed',
      lineWidth: 2,
    });

    series.setData(data);
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height]);

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-slate-950/70 p-4 shadow-glowSoft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-violet-300">Advanced Price Chart</div>
          <div className="text-xs text-slate-500">Lightweight TradingView-style chart</div>
        </div>
        <div className="text-xs text-slate-400">Live feed</div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}

export default AdvancedChart;
