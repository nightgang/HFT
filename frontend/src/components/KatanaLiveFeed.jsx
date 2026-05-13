import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

function KatanaLiveFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/system/detections");
        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch token detections");
        }

        setFeed(data.data?.detections || []);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Feed error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFeed();
    intervalId = setInterval(fetchFeed, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const statusColors = {
    new: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    risk: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <h3 className="font-bold text-white text-sm">LIVE TOKEN FEED</h3>
        <div className="ml-auto text-xs text-gray-500">
          {feed.length} tokens
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-64 space-y-2 p-3">
        {loading && (
          <div className="p-3 text-sm text-gray-400">
            Loading token detections…
          </div>
        )}
        {error && (
          <div className="p-3 text-sm text-red-400">
            Unable to load detections: {error}
          </div>
        )}
        {!loading && !error && feed.length === 0 && (
          <div className="p-3 text-sm text-gray-400">
            No recent token detections available.
          </div>
        )}
        {!loading &&
          !error &&
          feed.map((token) => {
            const status = token.riskLevel?.toLowerCase() || "new";
            const timeAgo = token.detectedAt
              ? `${Math.max(0, Math.floor((Date.now() - token.detectedAt) / 1000))}s ago`
              : "now";
            return (
              <div
                key={token.mint}
                className="p-3 bg-black/40 border border-purple-500/20 hover:border-purple-400/50 rounded-lg transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono font-bold text-white text-sm">
                      {token.symbol || token.mint.slice(0, 8)}
                    </div>
                    <div className="text-xs text-gray-500">{token.mint}</div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${statusColors[status]}`}
                  >
                    {status === "new" && "🆕"}
                    {status === "medium" && "📊"}
                    {status === "low" && "⚠️"}
                    {status === "risk" && "🚨"} {status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Liquidity</span>
                    <div className="text-green-400 font-bold">
                      {token.liquidity?.toFixed(1) ?? "0.0"} SOL
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Market Cap</span>
                    <div className="text-purple-400 font-bold">
                      ${token.marketCap ?? "0"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">Detected</span>
                    <div className="text-blue-400 font-mono text-xs font-bold">
                      {timeAgo}
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-xs font-bold rounded transition border border-purple-500/30">
                  → SNIPE
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default KatanaLiveFeed;
