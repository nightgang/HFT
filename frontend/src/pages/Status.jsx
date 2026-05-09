import { useEffect, useState } from 'react';

function Status() {
  const [health, setHealth] = useState(null);
  const [sniperStatus, setSniperStatus] = useState(null);
  const [wsInfo, setWsInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [healthRes, sniperRes, wsRes] = await Promise.all([
        fetch('http://localhost:3001/health'),
        fetch('http://localhost:3001/sniper/status'),
        fetch('http://localhost:3001/ws/info'),
      ]);

      const [healthData, sniperData, wsData] = await Promise.all([
        healthRes.json(),
        sniperRes.json(),
        wsRes.json(),
      ]);

      setHealth(healthData);
      setSniperStatus(sniperData);
      setWsInfo(wsData);
      setError(null);
    } catch (err) {
      setError('Unable to reach backend services. Please make sure backend is running.');
      console.error('Status fetch error:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="border border-green-500/20 bg-slate-950/70 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="text-sm uppercase tracking-[0.3em] text-green-400">System Status</div>
          <h2 className="text-3xl font-semibold text-white">Live health & backend diagnostics</h2>
          <p className="text-sm text-slate-400">
            This dashboard shows the current health checks and service status for the HFT backend.
          </p>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Health Check</div>
                <div className="mt-4 text-2xl font-semibold text-white">{health?.status || 'unknown'}</div>
                <div className="mt-2 text-sm text-slate-400">Uptime: {health ? `${Math.floor(health.uptime)}s` : '–'}</div>
                <div className="mt-2 text-sm text-slate-400">Database: {health?.checks?.database?.status || '–'}</div>
                <div className="mt-2 text-sm text-slate-400">Memory: {health?.checks?.memory?.status || '–'}</div>
                <div className="mt-2 text-sm text-slate-400">API: {health?.checks?.api?.status || '–'}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Sniper Engine</div>
                <div className="mt-4 text-2xl font-semibold text-white">{sniperStatus?.isActive ? 'Active' : 'Inactive'}</div>
                <div className="mt-2 text-sm text-slate-400">Auto trade: {sniperStatus?.autoTradeEnabled ? 'Enabled' : 'Disabled'}</div>
                <div className="mt-2 text-sm text-slate-400">Strategy: {sniperStatus?.strategy || 'unknown'}</div>
                <div className="mt-2 text-sm text-slate-400">Requests queued: {sniperStatus?.queueLength ?? '–'}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">WebSocket</div>
                <div className="mt-4 text-2xl font-semibold text-white">{wsInfo?.clients ?? '0'}</div>
                <div className="mt-2 text-sm text-slate-400">Port: {wsInfo?.port || '3002'}</div>
                <div className="mt-2 text-sm text-slate-400">Connected clients: {wsInfo?.clients ?? '0'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Raw Health Payload</div>
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">
            {health ? JSON.stringify(health, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Raw Service Payload</div>
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">
            {sniperStatus ? JSON.stringify(sniperStatus, null, 2) : 'Loading...'}
            {'\n'}
            {wsInfo ? JSON.stringify(wsInfo, null, 2) : ''}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Status;
