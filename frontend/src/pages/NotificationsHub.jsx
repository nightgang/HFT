import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, TrendingUp, Zap, Filter, Trash2, Archive } from 'lucide-react';
import axios from 'axios';

const NotificationsHub = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, price, trade, alert, system
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/notifications', {
        params: {
          filter: filter
        }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3001/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:3001/api/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'price':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'trade':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'price':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'trade':
        return 'border-purple-500/20 bg-purple-500/5';
      case 'alert':
        return 'border-red-500/20 bg-red-500/5';
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      default:
        return 'border-slate-500/20 bg-slate-500/5';
    }
  };

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' || (filter === 'unread' && !notif.read) || notif.type === filter
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications Hub</h1>
          <p className="text-gray-400">Manage your alerts and notifications</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg transition-colors text-sm"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-4">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: notifications.filter(n => !n.read).length },
            { id: 'price', label: 'Price Alerts', count: notifications.filter(n => n.type === 'price').length },
            { id: 'trade', label: 'Trade Updates', count: notifications.filter(n => n.type === 'trade').length },
            { id: 'alert', label: 'System Alerts', count: notifications.filter(n => n.type === 'alert').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                filter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-slate-800/50 rounded">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-12 text-center">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                setSelectedNotif(notif);
                if (!notif.read) markAsRead(notif.id);
              }}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10 ${
                notif.read
                  ? 'bg-slate-800/20 border-slate-500/20'
                  : `${getNotificationColor(notif.type)} border-2`
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`font-semibold ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notif.read && (
                        <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>

                  {notif.data && (
                    <div className="mt-3 p-3 bg-slate-700/30 rounded text-xs text-gray-300 space-y-1">
                      {Object.entries(notif.data).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-400">{key}:</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              {getNotificationIcon(selectedNotif.type)}
              <h3 className="text-xl font-bold text-white">{selectedNotif.title}</h3>
              <button
                onClick={() => setSelectedNotif(null)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Message</p>
                <p className="text-white">{selectedNotif.message}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Time</p>
                <p className="text-white">{new Date(selectedNotif.timestamp).toLocaleString()}</p>
              </div>

              {selectedNotif.data && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Details</p>
                  <div className="bg-slate-700/30 rounded p-3 space-y-2">
                    {Object.entries(selectedNotif.data).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors font-semibold"
              >
                Action
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsHub;
