import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  PieChart,
} from "lucide-react";
import { useGetPortfolioOverview } from "../hooks";
import { DataTable, LoadingSpinner, ErrorMessage, Button, Modal } from "../components/ui";
import { createPortfolioColumns } from "../hooks/useTable";

const PortfolioDashboard = () => {
  const [showValues, setShowValues] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);

  const { data: portfolio, isLoading, error, refetch } = useGetPortfolioOverview();

  const handleRefresh = async () => {
    await refetch();
  };

  const handleExport = () => {
    if (!portfolio?.assets?.length) return;
    const csv = convertToCSV(portfolio.assets);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const convertToCSV = (assets) => {
    const headers = [
      "Token",
      "Symbol",
      "Amount",
      "Price (USD)",
      "Total Value (USD)",
      "Change %",
    ];
    const rows = assets.map((asset) => [
      asset.name,
      asset.symbol,
      asset.amount,
      asset.price,
      asset.totalValue,
      asset.change24h,
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading portfolio...</span>
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

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">No portfolio data available</div>
      </div>
    );
  }

  const portfolioColumns = createPortfolioColumns();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor your assets</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? (
              <Eye className="w-4 h-4 mr-2" />
            ) : (
              <EyeOff className="w-4 h-4 mr-2" />
            )}
            {showValues ? 'Hide' : 'Show'} Values
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={!portfolio.assets?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {showValues
                  ? `$${portfolio.totalValue?.toFixed(2) || "0.00"}`
                  : "••••••"}
              </p>
            </div>
            <Wallet className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">24h Change</p>
              <p
                className={`text-2xl font-bold ${portfolio.change24hPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {portfolio.change24hPercent >= 0 ? "+" : ""}
                {portfolio.change24hPercent?.toFixed(2) || "0.00"}%
              </p>
            </div>
            {portfolio.change24hPercent >= 0 ? (
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-500 opacity-20" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolio.assets?.length || 0}
              </p>
            </div>
            <PieChart className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolio.winRate?.toFixed(1) || "0.0"}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assets</h2>
        </div>
        <DataTable
          data={portfolio.assets || []}
          columns={portfolioColumns}
          loading={isLoading}
          searchPlaceholder="Search assets..."
          pageSize={10}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
        />
      </div>

      {/* Asset Details Modal */}
      <Modal
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        title="Asset Details"
      >
        {selectedToken && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                {selectedToken.symbol?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedToken.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedToken.symbol}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedToken.amount?.toFixed(4)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {showValues ? `$${selectedToken.price?.toFixed(4)}` : "••••"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Value
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {showValues ? `$${selectedToken.totalValue?.toFixed(2)}` : "••••"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  24h Change
                </label>
                <p className={`text-lg font-semibold mt-1 ${
                  selectedToken.change24h >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedToken.change24h >= 0 ? "+" : ""}
                  {selectedToken.change24h?.toFixed(2)}%
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Allocation
              </label>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((selectedToken.allocation || 0) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedToken.allocation?.toFixed(1)}% of portfolio
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortfolioDashboard;
