import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

function HFTWalletTracker() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    async function loadWallets() {
      try {
        const response = await fetch("/api/trading/wallets");
        const data = await response.json();
        setWallets(data.wallets || []);
      } catch (error) {
        console.error("Failed to load wallets:", error);
      }
    }

    loadWallets();
  }, []);

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center space-x-2">
        <Wallet className="w-4 h-4 text-purple-400" />
        <h3 className="font-bold text-white text-sm">WALLET TRACKER</h3>
      </div>

      {/* Content */}
      <div className="space-y-2 p-3 max-h-64 overflow-y-auto">
        {wallets.length > 0 ? (
          wallets.map((wallet, index) => (
            <div
              key={wallet.publicKey || index}
              className="p-3 bg-black/40 border border-purple-500/20 rounded-lg hover:border-purple-400/50 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-white text-sm">
                    {wallet.name || "Wallet " + (index + 1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {wallet.publicKey || wallet.address || "Unknown"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">
                    {wallet.external ? "External" : "Internal"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {wallet.publicKey ? "CONNECTED" : "UNKNOWN"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                  <div className="text-gray-500">Type</div>
                  <div className="font-bold text-white">
                    {wallet.external ? "External" : "On-chain"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {wallet.external ? "Manual sign" : "Auto trade"}
                  </div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                  <div className="text-gray-500">Wallet</div>
                  <div className="text-blue-400 font-bold">{index + 1}</div>
                  <div className="text-xs text-gray-500">Configured</div>
                </div>
                <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                  <div className="text-gray-500">Status</div>
                  <div className="flex items-center space-x-1 text-green-400 font-bold">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs">Active</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-gray-400">
            No wallets found yet. Connect a wallet to begin trading.
          </div>
        )}
      </div>

      {/* Add Wallet Button */}
      <div className="px-3 pb-3">
        <button
          onClick={async () => {
            const publicKey = window.prompt("Enter wallet public key:");
            if (!publicKey) return;
            const name =
              window.prompt("Enter wallet name (optional):") ||
              "External Wallet";

            try {
              const response = await fetch("/api/trading/wallet/connect", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ publicKey, name }),
              });
              const result = await response.json();
              if (!response.ok) {
                throw new Error(result.error || "Failed to add wallet");
              }
              window.alert(`Wallet connected: ${result.wallet.name}`);
              const updated = await fetch("/api/trading/wallets");
              const walletData = await updated.json();
              setWallets(walletData.wallets || []);
            } catch (error) {
              console.error("Failed to add wallet:", error);
              window.alert(`Failed to add wallet: ${error.message}`);
            }
          }}
          className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-xs font-bold rounded transition border border-purple-500/30"
        >
          + ADD WALLET
        </button>
      </div>
    </div>
  );
}

export default HFTWalletTracker;
