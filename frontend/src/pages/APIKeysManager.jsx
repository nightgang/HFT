import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, RotateCw, Check, X } from 'lucide-react';
import axios from 'axios';

const APIKeysManager = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    permissions: {
      read: true,
      trade: false,
      withdraw: false,
      admin: false
    },
    ipWhitelist: ''
  });
  const [createdKey, setCreatedKey] = useState(null);
  const [copying, setCopying] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/api-keys');
      setKeys(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/api-keys', {
        ...formData,
        ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.split(',').map(ip => ip.trim()) : []
      });
      setCreatedKey(response.data);
      setFormData({
        name: '',
        permissions: {
          read: true,
          trade: false,
          withdraw: false,
          admin: false
        },
        ipWhitelist: ''
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const deleteKey = async (id) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      try {
        await axios.delete(`http://localhost:3001/api/api-keys/${id}`);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to delete API key:', error);
      }
    }
  };

  const regenerateKey = async (id) => {
    if (window.confirm('This will invalidate the current key. Continue?')) {
      try {
        const response = await axios.put(`http://localhost:3001/api/api-keys/${id}/regenerate`);
        setCreatedKey(response.data);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to regenerate API key:', error);
      }
    }
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopying(keyId);
    setTimeout(() => setCopying(null), 2000);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys Manager</h1>
          <p className="text-gray-400">Manage your API keys and access tokens</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Key
        </button>
      </div>

      {/* Warning */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 font-semibold">Keep your API keys secure</p>
          <p className="text-red-300/80 text-sm">Never share your API keys. Each key has specific permissions - limit them to what you need.</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Create New API Key</h2>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Key Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Trading Bot, Analytics, Backup"
                required
                className="w-full bg-slate-700 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">A descriptive name to identify this key</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">Permissions</label>
              <div className="space-y-2">
                {['read', 'trade', 'withdraw', 'admin'].map(perm => (
                  <label key={perm} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions[perm]}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, [perm]: e.target.checked }
                      })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-white capitalize">{perm}</span>
                    <span className="text-xs text-gray-400">
                      {perm === 'read' && '(View account, balances, orders)'}
                      {perm === 'trade' && '(Place, cancel orders)'}
                      {perm === 'withdraw' && '(Withdraw funds)'}
                      {perm === 'admin' && '(Full access)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">IP Whitelist (optional)</label>
              <input
                type="text"
                value={formData.ipWhitelist}
                onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                placeholder="192.168.1.1, 10.0.0.1"
                className="w-full bg-slate-700 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated IPs. Leave empty to allow all IPs</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors font-semibold"
              >
                Create Key
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Created Key Display */}
      {createdKey && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-green-300 font-semibold mb-2">API Key Created Successfully</p>
              <p className="text-green-300/80 text-sm mb-4">Copy your key now. You won't be able to see it again!</p>
              
              <div className="bg-slate-800 rounded p-4 font-mono text-sm mb-4 break-all">
                <p className="text-gray-400 text-xs mb-2">Secret Key:</p>
                <p className="text-green-400">{createdKey.secret}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(createdKey.secret, 'secret')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copying === 'secret' ? 'Copied!' : 'Copy Secret'}
                </button>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">Active API Keys ({keys.length})</h2>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Key className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No API keys created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/10">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Key</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Permissions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Last Used</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{key.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-400 bg-slate-700/50 px-2 py-1 rounded">
                          {visibleKeys[key.id] ? key.key : `${key.key.substring(0, 10)}...`}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                        >
                          {visibleKeys[key.id] ? 
                            <EyeOff className="w-4 h-4 text-gray-400" /> : 
                            <Eye className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key, key.id)}
                          className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                        >
                          {copying === key.id ? 
                            <Check className="w-4 h-4 text-green-400" /> : 
                            <Copy className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(key.permissions).map(([perm, allowed]) => (
                          allowed && (
                            <span key={perm} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {perm}
                            </span>
                          )
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => regenerateKey(key.id)}
                          className="p-2 hover:bg-yellow-500/20 rounded transition-colors"
                          title="Regenerate key"
                        >
                          <RotateCw className="w-4 h-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => deleteKey(key.id)}
                          className="p-2 hover:bg-red-500/20 rounded transition-colors"
                          title="Delete key"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default APIKeysManager;
