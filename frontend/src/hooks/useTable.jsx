import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useMemo } from "react";

export const useTable = (data, columns, options = {}) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...options,
  });

  return table;
};

// Common column definitions for trading data
export const createTradeHistoryColumns = () => [
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
  },
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "side",
    header: "Side",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ getValue }) => getValue().toLocaleString(),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "filled" ? "bg-green-100 text-green-800" :
        getValue() === "pending" ? "bg-yellow-100 text-yellow-800" :
        "bg-red-100 text-red-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
];

export const createPortfolioColumns = () => [
  {
    accessorKey: "symbol",
    header: "Asset",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ getValue }) => getValue().toLocaleString(),
  },
  {
    accessorKey: "value",
    header: "Value (USD)",
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "change24h",
    header: "24h Change",
    cell: ({ getValue }) => (
      <span className={`font-medium ${
        getValue() >= 0 ? "text-green-600" : "text-red-600"
      }`}>
        {getValue() >= 0 ? "+" : ""}{getValue().toFixed(2)}%
      </span>
    ),
  },
  {
    accessorKey: "allocation",
    header: "Allocation",
    cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
  },
];

export const createApiKeysColumns = () => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "exchange",
    header: "Exchange",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
];

export const createNotificationsColumns = () => [
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "success" ? "bg-green-100 text-green-800" :
        getValue() === "warning" ? "bg-yellow-100 text-yellow-800" :
        getValue() === "error" ? "bg-red-100 text-red-800" :
        "bg-blue-100 text-blue-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Message",
  },
  {
    accessorKey: "read",
    header: "Status",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"
      }`}>
        {getValue() ? "Read" : "Unread"}
      </span>
    ),
  },
];

export const createAdvancedOrdersColumns = () => [
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "side",
    header: "Side",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ getValue }) => getValue().toLocaleString(),
  },
  {
    accessorKey: "triggerPrice",
    header: "Trigger Price",
    cell: ({ getValue }) => getValue() ? `$${getValue().toFixed(2)}` : "-",
  },
  {
    accessorKey: "limitPrice",
    header: "Limit Price",
    cell: ({ getValue }) => getValue() ? `$${getValue().toFixed(2)}` : "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        getValue() === "active" ? "bg-green-100 text-green-800" :
        getValue() === "filled" ? "bg-blue-100 text-blue-800" :
        getValue() === "cancelled" ? "bg-red-100 text-red-800" :
        "bg-yellow-100 text-yellow-800"
      }`}>
        {getValue().toUpperCase()}
      </span>
    ),
  },
];