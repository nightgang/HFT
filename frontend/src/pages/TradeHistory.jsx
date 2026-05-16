import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Filter,
  Download,
  Clock,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useTradeHistory } from "../hooks";
import { DataTable, LoadingSpinner, ErrorMessage, Button, Modal } from "../components/ui";
import { createTradeHistoryColumns } from "../hooks/useTable";

const TradeHistory = () => {
  const [filter, setFilter] = useState("all"); // all, buy, sell
  const [timeRange, setTimeRange] = useState("7d"); // 1d, 7d, 30d, all
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

  const { data: trades = [], isLoading, error, refetch } = useTradeHistory({
    type: filter,
    timeRange: timeRange,
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    if (!filteredTrades.length) return;
    const csv = convertToCSV(filteredTrades);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const convertToCSV = (trades) => {
    const headers = [
      "Date",
      "Token",
      "Type",
      "Amount",
      "Price",
      "Total",
      "Fee",
      "PnL",
      "Status",
    ];
    const rows = trades.map((trade) => [
      new Date(trade.timestamp).toLocaleString(),
      trade.tokenSymbol,
      trade.type,
      trade.amount,
      trade.price,
      trade.totalValue,
      trade.fee,
      trade.pnl,
      trade.status,
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const filteredTrades = useMemo(() => {
    return trades.filter(
      (trade) =>
        trade.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.tokenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.txHash?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [trades, searchTerm]);

  const tradeColumns = createTradeHistoryColumns();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading trade history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trade History</h1>
          <p className="text-gray-600 dark:text-gray-400">View and analyze your trading activity</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={!filteredTrades.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by token, name, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Trades</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <DataTable
          data={filteredTrades}
          columns={tradeColumns}
          loading={isLoading}
          searchPlaceholder="Search trades..."
          pageSize={15}
          enableSorting={true}
          enableFiltering={false}
          enablePagination={true}
        />
      </div>

      {/* Trade Details Modal */}
      <Modal
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        title="Trade Details"
      >
        {selectedTrade && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Transaction Hash
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {selectedTrade.txHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedTrade.txHash)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timestamp
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(selectedTrade.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {selectedTrade.tokenSymbol} ({selectedTrade.tokenName})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <p className={`text-sm font-medium mt-1 ${
                  selectedTrade.type === 'buy'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedTrade.type.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {selectedTrade.amount} {selectedTrade.tokenSymbol}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  ${selectedTrade.price.toFixed(4)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Value
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  ${selectedTrade.totalValue.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fee
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  ${selectedTrade.fee.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TradeHistory;
