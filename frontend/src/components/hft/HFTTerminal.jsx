import { useState, useEffect, useRef } from "react";
import { Copy, Settings } from "lucide-react";

function KatanaTerminal() {
  const [logs, setLogs] = useState([]);
  const [activePanel, setActivePanel] = useState("live-feed");
  const logEndRef = useRef(null);

  const sampleLogs = [
    {
      timestamp: "14:32:01",
      type: "success",
      message: "✓ Helius RPC connected (42ms latency)",
    },
    { timestamp: "14:32:02", type: "success", message: "✓ Jupiter API ready" },
    {
      timestamp: "14:32:03",
      type: "success",
      message: "✓ Jito relay subscribed",
    },
    {
      timestamp: "14:32:04",
      type: "success",
      message: "✓ WebSocket authenticated",
    },
    {
      timestamp: "14:32:05",
      type: "info",
      message: "→ Listening for token launches...",
    },
    {
      timestamp: "14:33:12",
      type: "detect",
      message: "🎯 NEW TOKEN: RAY | Liq: 45.2 SOL | MC: $2.3M",
    },
    {
      timestamp: "14:33:13",
      type: "safe",
      message: "✓ Risk check passed (mint auth revoked)",
    },
    {
      timestamp: "14:33:14",
      type: "success",
      message: "✓ BOUGHT 150 RAY @ 5.24 (slippage: 0.28%)",
    },
    {
      timestamp: "14:33:42",
      type: "tp",
      message: "💰 TP1 HIT! Sold 45 RAY @ 10.48 (+99%)",
    },
    {
      timestamp: "14:34:00",
      type: "info",
      message: "→ Position: 55 RAY | Entry: 5.24 | Current: 11.2",
    },
  ];

  useEffect(() => {
    setLogs(sampleLogs);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      case "detect":
        return "text-purple-400";
      case "tp":
        return "text-green-500 font-bold";
      case "safe":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const ActiveTrades = () => (
    <div className="space-y-2 text-xs">
      <div className="text-purple-400 text-xs mb-2">≣ ACTIVE TRADES</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-b border-purple-500/20">
            <tr>
              <th className="px-2 py-1 text-left text-gray-500">TOKEN</th>
              <th className="px-2 py-1 text-right text-gray-500">AMOUNT</th>
              <th className="px-2 py-1 text-right text-gray-500">ENTRY</th>
              <th className="px-2 py-1 text-right text-gray-500">CURRENT</th>
              <th className="px-2 py-1 text-right text-gray-500">PNL %</th>
              <th className="px-2 py-1 text-center text-gray-500">TP/SL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {[
              {
                token: "RAY",
                amount: 150,
                entry: 5.24,
                current: 6.89,
                pnl: 31.5,
                tp: "TP1:45%",
                sl: "SL:4.19",
              },
              {
                token: "PSAI",
                amount: 280,
                entry: 0.145,
                current: 0.182,
                pnl: 25.5,
                tp: "TP1:0%",
                sl: "SL:0.116",
              },
              {
                token: "WIF",
                amount: 420,
                entry: 0.0842,
                current: 0.0651,
                pnl: -22.7,
                tp: "TP1:0%",
                sl: "SL:0.0673",
              },
            ].map((trade, idx) => (
              <tr key={idx} className="hover:bg-purple-500/5">
                <td className="px-2 py-1 font-bold text-white">
                  {trade.token}
                </td>
                <td className="px-2 py-1 text-right text-white font-mono">
                  {trade.amount}
                </td>
                <td className="px-2 py-1 text-right text-gray-400 font-mono">
                  ${trade.entry.toFixed(4)}
                </td>
                <td className="px-2 py-1 text-right text-purple-400 font-mono font-bold">
                  ${trade.current.toFixed(4)}
                </td>
                <td
                  className={`px-2 py-1 text-right font-bold ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {trade.pnl >= 0 ? "+" : ""}
                  {trade.pnl}%
                </td>
                <td className="px-2 py-1 text-center text-xs">
                  <div className="text-green-400">{trade.tp}</div>
                  <div className="text-red-400">{trade.sl}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const SystemLogs = () => (
    <div className="space-y-1 text-xs font-mono">
      {logs.map((log, idx) => (
        <div
          key={idx}
          className={`flex items-start space-x-2 ${getLogColor(log.type)}`}
        >
          <span className="text-gray-600 flex-shrink-0 w-12">
            [{log.timestamp}]
          </span>
          <span className="flex-1">{log.message}</span>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );

  const WalletSummary = () => (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-black/40 border border-green-500/30 rounded">
          <div className="text-gray-500 text-xs">Wallet Balance</div>
          <div className="text-green-400 font-bold">45.32 SOL ($7,631)</div>
        </div>
        <div className="p-2 bg-black/40 border border-purple-500/30 rounded">
          <div className="text-gray-500 text-xs">Total PNL</div>
          <div className="text-green-400 font-bold">+$2,850.50</div>
        </div>
        <div className="p-2 bg-black/40 border border-blue-500/30 rounded">
          <div className="text-gray-500 text-xs">Active Trades</div>
          <div className="text-blue-400 font-bold">3 open</div>
        </div>
        <div className="p-2 bg-black/40 border border-yellow-500/30 rounded">
          <div className="text-gray-500 text-xs">Win Rate</div>
          <div className="text-yellow-400 font-bold">87.5%</div>
        </div>
      </div>
    </div>
  );

  const StatusBar = () => (
    <div className="text-xs text-gray-600 font-mono space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <span className="text-green-400">⚡ Latency: 42ms</span>
          <span className="text-blue-400">TPS: 1,500</span>
          <span className="text-purple-400">Block: 287,452,185</span>
        </div>
        <div className="flex space-x-4">
          <span className="text-cyan-400">Network: Mainnet</span>
          <span className="text-pink-400">Mode: KATANA</span>
        </div>
      </div>
      <div className="flex justify-between text-purple-400">
        <span>
          Shortcuts: [B] Buy | [S] Sell | [P] Positions | [H] History | [?] Help
          | [T] Terminal
        </span>
        <span className="text-green-400">✓ All Systems Operational</span>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black/80 border-t border-purple-500/20 font-mono text-white">
      {/* Tab Bar */}
      <div className="flex border-b border-purple-500/20 bg-black/40">
        {[
          { id: "live-feed", label: "📡 LIVE FEED" },
          { id: "active-trades", label: "📊 ACTIVE TRADES" },
          { id: "system-logs", label: "📋 SYSTEM LOGS" },
          { id: "wallet", label: "💰 WALLET" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`px-3 py-2 text-xs font-bold transition flex-1 ${
              activePanel === tab.id
                ? "bg-purple-500/30 text-purple-300 border-b-2 border-purple-400"
                : "bg-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-track-black scrollbar-thumb-purple-500/20">
        {activePanel === "live-feed" && <LiveFeed />}
        {activePanel === "active-trades" && <ActiveTrades />}
        {activePanel === "system-logs" && <SystemLogs />}
        {activePanel === "wallet" && <WalletSummary />}
      </div>

      {/* Status Bar */}
      <div className="border-t border-purple-500/20 bg-black/40 px-4 py-2">
        <StatusBar />
      </div>

      {/* Input Bar */}
      <div className="border-t border-purple-500/20 bg-black/40 px-4 py-2 flex items-center space-x-2">
        <span className="text-purple-400">❯</span>
        <input
          type="text"
          placeholder="Type command or press ? for help"
          className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder-gray-600"
        />
        <button className="p-1 hover:text-purple-400 transition text-gray-600">
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default KatanaTerminal;
