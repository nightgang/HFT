import React from "react";
import { Loader2, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <Loader2
      className={`animate-spin text-blue-500 ${sizeClasses[size]} ${className}`}
    />
  );
};

export const LoadingOverlay = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-slate-800 rounded-lg p-6 flex items-center space-x-4">
      <LoadingSpinner size="lg" />
      <span className="text-white">{message}</span>
    </div>
  </div>
);

export const ErrorMessage = ({ error, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          Error
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          {error?.message || "An unexpected error occurred"}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
);

export const WarningMessage = ({ message, onDismiss }) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
    <div className="flex items-start">
      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Warning
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          {message}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-3 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  </div>
);

export const SuccessMessage = ({ message, onDismiss }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
    <div className="flex items-start">
      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
          Success
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          {message}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-3 text-sm font-medium text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-100"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  </div>
);

export const EmptyState = ({
  title = "No data",
  description = "There's nothing to display here yet.",
  icon: Icon = AlertCircle,
  action,
}) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
      {title}
    </h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {description}
    </p>
    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
);

export const DataTableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                colIndex === 0 ? "w-1/4" : colIndex === columns - 1 ? "w-1/6" : "w-1/3"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-lg p-6">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);