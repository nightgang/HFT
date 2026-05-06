import { useState, useEffect } from 'react';

function Portfolio() {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('http://localhost:3001/wallets');
      const data = await response.json();
      setWallets(data.wallets);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  const fetchPortfolio = async (walletAddress) => {
    try {
      const response = await fetch(`http://localhost:3001/portfolio/${walletAddress}`);
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchTradeHistory = async (walletAddress) => {
    try {
      const response = await fetch(`http://localhost:3001/trades/${walletAddress}`);
      const data = await response.json();
      setTradeHistory(data.trades || []);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
      setTradeHistory([]);
    }
  };

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
    fetchPortfolio(wallet.publicKey);
    fetchTradeHistory(wallet.publicKey);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Wallets</h2>
            <div className="space-y-2">
              {wallets.map(wallet => (
                <div
                  key={wallet.publicKey}
                  onClick={() => handleWalletSelect(wallet)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedWallet?.publicKey === wallet.publicKey
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="font-semibold">{wallet.name}</div>
                  <div className="text-xs text-gray-400 truncate">{wallet.publicKey}</div>
                  {wallet.external && (
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">External</span>
                  )}
                </div>
              ))}
            </div>

            {wallets.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No wallets found. Create or connect a wallet first.
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Details */}
        <div className="lg:col-span-2">
          {selectedWallet ? (
            <div className="space-y-6">
              {/* Wallet Header */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-400">
                  Portfolio: {selectedWallet.name}
                </h2>
                <div className="text-sm text-gray-400 break-all">
                  {selectedWallet.publicKey}
                </div>
              </div>

              {/* Portfolio Analysis */}
              {portfolio ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Smart Money Score */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-purple-400">Smart Money Score</h3>
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-2 ${
                          portfolio.smartMoney?.score >= 70 ? 'text-green-400' :
                          portfolio.smartMoney?.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {portfolio.smartMoney?.score != null ? `${portfolio.smartMoney.score}/100` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {Array.isArray(portfolio.smartMoney?.signals) ? portfolio.smartMoney.signals.join(', ') : 'No signals'}
                        </div>
                      </div>
                    </div>

                    {/* Holdings */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-blue-400">Holdings</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>SOL Balance:</span>
                          <span className="font-semibold">{portfolio.solBalance?.toFixed(4) || 'N/A'} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Token Count:</span>
                          <span className="font-semibold">{portfolio.tokenCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trade Volume</span>
                          <span className="font-semibold">{tradeHistory.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated PnL</span>
                          <span className={`font-semibold ${portfolio.pnlEstimate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {portfolio.pnlEstimate >= 0 ? '+' : ''}{portfolio.pnlEstimate.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-teal-400">Trading Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-400">Successful Trades</div>
                        <div className="text-2xl font-semibold text-green-400">{tradeHistory.filter(t => t.status === 'success').length}</div>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-400">Buy Orders</div>
                        <div className="text-2xl font-semibold text-blue-400">{tradeHistory.filter(t => t.type === 'buy').length}</div>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-400">Sell Orders</div>
                        <div className="text-2xl font-semibold text-red-400">{tradeHistory.filter(t => t.type === 'sell').length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-400">Token Holdings</h3>
                    {portfolio.holdings.length === 0 ? (
                      <div className="text-gray-500">No token holdings detected.</div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {portfolio.holdings.map(token => (
                          <div key={token.mint} className="bg-gray-900 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold">{token.symbol}</div>
                                <div className="text-xs text-gray-400 truncate max-w-sm">{token.mint}</div>
                              </div>
                              <div className="text-sm text-gray-200">{token.amount}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <div className="text-gray-500">Loading portfolio data...</div>
                </div>
              )}

              {/* Trade History */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-orange-400">Trade History</h3>
                {tradeHistory.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tradeHistory.map(trade => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-300">
                              {new Date(trade.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${
                            trade.status === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Token: <span className="font-mono text-xs">{trade.tokenMint}</span></div>
                          <div>Amount: <span className="font-semibold">{trade.amount}</span></div>
                          {trade.signature && (
                            <div>Tx: <span className="font-mono text-xs">{trade.signature}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No trades found for this wallet
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-gray-500">Select a wallet to view portfolio</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;