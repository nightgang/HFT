import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import axios from "axios";

const JitoBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    transactions: "",
    tipAmount: 1,
    priority: "high",
    maxBlockHeight: "",
  });

  useEffect(() => {
    fetchBundles();
    const interval = setInterval(fetchBundles, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/jito-bundles",
      );
      setBundles(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch bundles:", error);
      setLoading(false);
    }
  };

  const handleSubmitBundle = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/api/jito-bundles", {
        transactions: formData.transactions.split(",").map((t) => t.trim()),
        tipAmount: parseFloat(formData.tipAmount),
        priority: formData.priority,
        maxBlockHeight: parseInt(formData.maxBlockHeight),
      });
      setFormData({
        transactions: "",
        tipAmount: 1,
        priority: "high",
        maxBlockHeight: "",
      });
      setShowForm(false);
      fetchBundles();
    } catch (error) {
      console.error("Failed to submit bundle:", error);
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    try {
      await axios.delete(`http://localhost:3001/api/jito-bundles/${bundleId}`);
      fetchBundles();
    } catch (error) {
      console.error("Failed to delete bundle:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading bundles...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Jito Bundles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Bundle
        </button>
      </div>

      {/* Create Bundle Form */}
      {showForm && (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Create MEV Protection Bundle
          </h2>
          <form onSubmit={handleSubmitBundle} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Transaction Signatures (comma-separated)
              </label>
              <textarea
                value={formData.transactions}
                onChange={(e) =>
                  setFormData({ ...formData, transactions: e.target.value })
                }
                placeholder="tx1, tx2, tx3..."
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Tip Amount (SOL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tipAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Max Block Height (optional)
              </label>
              <input
                type="number"
                value={formData.maxBlockHeight}
                onChange={(e) =>
                  setFormData({ ...formData, maxBlockHeight: e.target.value })
                }
                className="w-full bg-slate-800 border border-purple-500/30 rounded px-4 py-2 text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Submit Bundle
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bundles List */}
      <div className="space-y-3">
        {bundles.length === 0 ? (
          <div className="bg-slate-900/30 border border-purple-500/10 rounded-lg p-12 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No bundles created yet</p>
          </div>
        ) : (
          bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`flex items-center gap-1 ${getStatusColor(bundle.status)}`}
                    >
                      {getStatusIcon(bundle.status)}
                      <span className="font-semibold capitalize">
                        {bundle.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Bundle #{bundle.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Transactions</p>
                      <p className="text-white font-mono text-xs">
                        {bundle.transactionCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tip</p>
                      <p className="text-white">{bundle.tipAmount || 0} SOL</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Priority</p>
                      <p className="text-white capitalize">
                        {bundle.priority || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-white text-xs">
                        {bundle.createdAt
                          ? new Date(bundle.createdAt).toLocaleTimeString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {bundle.blockHeight && (
                    <div className="mt-3 bg-slate-800/50 rounded px-3 py-2">
                      <p className="text-xs text-gray-500">
                        Block Height: {bundle.blockHeight}
                      </p>
                    </div>
                  )}

                  {bundle.bundleId && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Jito Bundle ID:</p>
                      <p className="text-xs text-purple-400 font-mono break-all">
                        {bundle.bundleId}
                      </p>
                    </div>
                  )}

                  {bundle.failureReason && (
                    <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                      <p className="text-xs text-red-400">
                        Failure: {bundle.failureReason}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteBundle(bundle.id)}
                  className="text-red-400 hover:text-red-300 transition-colors ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MEV Info Card */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-white mb-2">MEV Protection</h3>
            <p className="text-sm text-gray-400 mb-2">
              Jito Bundles provide MEV protection by bundling your transactions
              with others, ensuring they execute at a fair price without
              front-running or sandwich attacks.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Higher tip amounts increase bundle inclusion priority</li>
              <li>
                • Bundle status updates in real-time as blocks are produced
              </li>
              <li>
                • Failed bundles can be resubmitted with adjusted parameters
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JitoBundles;
