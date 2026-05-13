import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import axios from "axios";

const SentimentAnalysis = () => {
  const [sentiments, setSentiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSentimentData();
    const interval = setInterval(fetchSentimentData, 20000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchSentimentData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/sentiment-analysis?source=${filter}`,
      );
      setSentiments(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch sentiment data:", error);
      setLoading(false);
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.6) return "text-green-400 bg-green-500/20";
    if (score > 0.4) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const getSentimentIcon = (score) => {
    if (score > 0.6) return <ThumbsUp className="w-4 h-4" />;
    if (score < 0.4) return <ThumbsDown className="w-4 h-4" />;
    return <MessageCircle className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="text-center py-12">Loading sentiment data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Sentiment Analysis</h1>
        <div className="flex gap-2">
          {["all", "twitter", "discord", "telegram"].map((source) => (
            <button
              key={source}
              onClick={() => setFilter(source)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                filter === source
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Bullish</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {sentiments.filter((s) => s.sentimentScore > 0.6).length}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Positive sentiment signals
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/5 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Neutral</span>
            <MessageCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {
              sentiments.filter(
                (s) => s.sentimentScore <= 0.6 && s.sentimentScore >= 0.4,
              ).length
            }
          </div>
          <p className="text-xs text-gray-500 mt-2">Mixed sentiment signals</p>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Bearish</span>
            <ThumbsDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">
            {sentiments.filter((s) => s.sentimentScore < 0.4).length}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Negative sentiment signals
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sentiments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No sentiment data available
          </div>
        ) : (
          sentiments.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded ${getSentimentColor(item.sentimentScore)}`}
                    >
                      {getSentimentIcon(item.sentimentScore)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {item.tokenMint}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.source} •{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{item.content}</p>
                </div>
                <div className="text-right ml-4">
                  <div
                    className={`text-2xl font-bold ${getSentimentColor(item.sentimentScore)}`}
                  >
                    {(item.sentimentScore * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </p>
                  {item.volume && (
                    <p className="text-xs text-gray-500 mt-1">
                      Volume: {item.volume}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SentimentAnalysis;
