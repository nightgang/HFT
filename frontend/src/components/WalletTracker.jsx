import { useState } from 'react';

function WalletTracker() {
  const [walletAddress, setWalletAddress] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/smart-money/${walletAddress.trim()}`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      alert(`Error analyzing wallet: ${error.message}`);
    }
    setIsLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'High Confidence';
    if (score >= 40) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Solana wallet address"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        {isLoading ? 'Analyzing...' : 'Analyze Wallet'}
      </button>

      {analysis && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-purple-400 mb-3">Analysis Results</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Smart Score:</span>
              <span className={`font-bold text-lg ${getScoreColor(analysis.score)}`}>
                {analysis.score}/100
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Confidence:</span>
              <span className={`font-semibold ${getScoreColor(analysis.score)}`}>
                {getScoreLabel(analysis.score)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>SOL Balance:</span>
              <span className="font-semibold">{analysis.solBalance?.toFixed(4) || 'N/A'} SOL</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Token Holdings:</span>
              <span className="font-semibold">{analysis.tokenCount || 0}</span>
            </div>

            {analysis.signals && analysis.signals.length > 0 && (
              <div>
                <span className="text-sm text-gray-400">Signals:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.signals.map(signal => (
                    <span
                      key={signal}
                      className="px-2 py-1 bg-purple-600 text-xs rounded-full"
                    >
                      {signal.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletTracker;