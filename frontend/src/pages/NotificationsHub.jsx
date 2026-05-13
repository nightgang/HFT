import React, { useState, useMemo } from "react";
import {
  Bell,
  X,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Zap,
  Filter,
  Trash2,
  Archive,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useDeleteNotification,
  useMarkAllNotificationsRead
} from "../hooks";
import {
  DataTable,
  LoadingSpinner,
  ErrorMessage,
  Button,
  Modal,
  Select
} from "../components/ui";
import { createNotificationsColumns } from "../hooks/useTable";

const NotificationsHub = () => {
  const [filter, setFilter] = useState("all"); // all, unread, price, trade, alert, system
  const [selectedNotif, setSelectedNotif] = useState(null);

  const { data: notifications = [], isLoading, error, refetch } = useNotifications();
  const markAsReadMutation = useMarkNotificationRead();
  const deleteNotificationMutation = useDeleteNotification();
  const markAllAsReadMutation = useMarkAllNotificationsRead();

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const markAsRead = async (id) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await deleteNotificationMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "price":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "trade":
        return <Zap className="w-5 h-5 text-purple-500" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "price":
        return "border-blue-500/20 bg-blue-500/5";
      case "trade":
        return "border-purple-500/20 bg-purple-500/5";
      case "alert":
        return "border-red-500/20 bg-red-500/5";
      case "success":
        return "border-green-500/20 bg-green-500/5";
      default:
        return "border-gray-500/20 bg-gray-500/5";
    }
  };

  const notificationsColumns = createNotificationsColumns();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading notifications...</span>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">Stay updated with your trading activity</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            disabled={markAllAsReadMutation.isPending || !notifications.some(n => !n.read)}
          >
            <Archive className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter
            </label>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { label: "All Notifications", value: "all" },
                { label: "Unread Only", value: "unread" },
                { label: "Price Alerts", value: "price" },
                { label: "Trade Updates", value: "trade" },
                { label: "System Alerts", value: "alert" },
                { label: "Success Messages", value: "success" },
              ]}
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <DataTable
          data={filteredNotifications}
          columns={notificationsColumns}
          loading={isLoading}
          searchPlaceholder="Search notifications..."
          pageSize={15}
          enableSorting={true}
          enableFiltering={false}
          enablePagination={true}
        />
      </div>

      {/* Notification Details Modal */}
      <Modal
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title="Notification Details"
      >
        {selectedNotif && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              {getNotificationIcon(selectedNotif.type)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedNotif.title || "Notification"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(selectedNotif.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {selectedNotif.message}
              </p>
            </div>

            {selectedNotif.metadata && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Details
                </h4>
                <pre className="bg-gray-100 dark:bg-slate-700 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedNotif.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              {!selectedNotif.read && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    markAsRead(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  disabled={markAsReadMutation.isPending}
                >
                  Mark as Read
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => {
                  deleteNotification(selectedNotif.id);
                  setSelectedNotif(null);
                }}
                disabled={deleteNotificationMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationsHub;
