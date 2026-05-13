import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";
import axios from "axios";

const AdvancedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orderType: "stop_loss",
    tokenMint: "",
    amount: "",
    triggerPrice: "",
    limitPrice: "",
  });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/advanced-orders",
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/api/advanced-orders", formData);
      setFormData({
        orderType: "stop_loss",
        tokenMint: "",
        amount: "",
        triggerPrice: "",
        limitPrice: "",
      });
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(
        `http://localhost:3001/api/advanced-orders/${orderId}`,
      );
      fetchOrders();
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  const getOrderTypeIcon = (type) => {
    return type === "stop_loss" ? (
      <ArrowDownLeft className="w-4 h-4" />
    ) : (
      <ArrowUpRight className="w-4 h-4" />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "executed":
        return "bg-green-500/20 text-green-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Advanced Orders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {showModal && (
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">
            Create Advanced Order
          </h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Order Type
                </label>
                <select
                  value={formData.orderType}
                  onChange={(e) =>
                    setFormData({ ...formData, orderType: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white"
                >
                  <option value="stop_loss">Stop Loss</option>
                  <option value="trailing_stop">Trailing Stop</option>
                  <option value="take_profit">Take Profit</option>
                  <option value="bracket">Bracket Order</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Token Mint
                </label>
                <input
                  type="text"
                  value={formData.tokenMint}
                  onChange={(e) =>
                    setFormData({ ...formData, tokenMint: e.target.value })
                  }
                  placeholder="Enter token mint"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Enter amount"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Trigger Price
                </label>
                <input
                  type="number"
                  value={formData.triggerPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, triggerPrice: e.target.value })
                  }
                  placeholder="Enter trigger price"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Limit Price
                </label>
                <input
                  type="number"
                  value={formData.limitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, limitPrice: e.target.value })
                  }
                  placeholder="Enter limit price"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Create Order
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No advanced orders yet
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4 flex items-center justify-between hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-purple-500/20 rounded">
                  {getOrderTypeIcon(order.orderType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold capitalize">
                      {order.orderType}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{order.tokenMint}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-white font-semibold">
                  {order.amount} tokens
                </div>
                <div className="text-sm text-gray-400">
                  Trigger: {order.triggerPrice} | Limit: {order.limitPrice}
                </div>
              </div>
              <button
                onClick={() => handleDeleteOrder(order.id)}
                className="ml-4 p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdvancedOrders;
