import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import axios from 'axios';

const PredictiveAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(new Set());

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/predictive-alerts');
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.put(`http://localhost:3001/api/predictive-alerts/${alertId}/acknowledge`);
      setAcknowledged(new Set([...acknowledged, alertId]));
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'high': return 'border-orange-500/50 bg-orange-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'border-blue-500/50 bg-blue-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    return <Zap className="w-5 h-5 text-yellow-400" />;
  };

  const getAlertTypeIcon = (type) => {
    return <TrendingUp className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="text-center py-12">Loading predictive alerts...</div>;
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Predictive Alerts</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Alerts</span>
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{activeAlerts.length}</div>
          <p className="text-xs text-gray-500 mt-2">Monitoring for opportunities</p>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Triggered</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">{triggeredAlerts.length}</div>
          <p className="text-xs text-gray-500 mt-2">Action required</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Accuracy</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {Math.round((triggeredAlerts.length / Math.max(alerts.length, 1)) * 100)}%
          </div>
          <p className="text-xs text-gray-500 mt-2">Prediction accuracy</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Active & Triggered Alerts</h2>
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No predictive alerts at the moment</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{alert.tokenMint}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/30 text-red-300'
                          : alert.severity === 'high'
                          ? 'bg-orange-500/30 text-orange-300'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-500/30 text-yellow-300'
                          : 'bg-blue-500/30 text-blue-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${
                        alert.status === 'triggered'
                          ? 'bg-red-500/30 text-red-300'
                          : 'bg-blue-500/30 text-blue-300'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{alert.alertType}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-white mb-2">
                    {alert.threshold.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Confidence: {(alert.confidenceScore * 100).toFixed(0)}%
                  </div>
                  {!acknowledged.has(alert.id) && alert.status === 'triggered' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {acknowledged.has(alert.id) && (
                    <span className="text-xs text-gray-500">Acknowledged</span>
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

export default PredictiveAlerts;
