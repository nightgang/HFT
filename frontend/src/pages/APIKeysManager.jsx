import React, { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RotateCw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRegenerateApiKey,
  useApiKeyVisibility
} from "../hooks";
import {
  DataTable,
  LoadingSpinner,
  ErrorMessage,
  Button,
  Modal,
  Input,
  Form
} from "../components/ui";
import { createApiKeysColumns } from "../hooks/useTable";

const APIKeysManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    exchange: "",
    permissions: {
      read: true,
      trade: false,
      withdraw: false,
      admin: false,
    },
    ipWhitelist: "",
  });
  const [createdKey, setCreatedKey] = useState(null);
  const [copying, setCopying] = useState(null);

  const { data: keys = [], isLoading, error, refetch } = useApiKeys();
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const regenerateApiKeyMutation = useRegenerateApiKey();
  const [visibleKeys, setVisibleKeys] = useApiKeyVisibility();

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const result = await createApiKeyMutation.mutateAsync({
        ...formData,
        ipWhitelist: formData.ipWhitelist
          ? formData.ipWhitelist.split(",").map((ip) => ip.trim())
          : [],
      });
      setCreatedKey(result);
      setFormData({
        name: "",
        exchange: "",
        permissions: {
          read: true,
          trade: false,
          withdraw: false,
          admin: false,
        },
        ipWhitelist: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create API key:", error);
    }
  };

  const deleteKey = async (id) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteApiKeyMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete API key:", error);
      }
    }
  };

  const regenerateKey = async (id) => {
    if (window.confirm("This will invalidate the current key. Continue?")) {
      try {
        const result = await regenerateApiKeyMutation.mutateAsync(id);
        setCreatedKey(result);
      } catch (error) {
        console.error("Failed to regenerate API key:", error);
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

  const apiKeysColumns = createApiKeysColumns();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading API keys...</span>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your exchange API keys securely</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <DataTable
          data={keys}
          columns={apiKeysColumns}
          loading={isLoading}
          searchPlaceholder="Search API keys..."
          pageSize={10}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
        />
      </div>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create New API Key"
        size="lg"
      >
        <Form onSubmit={handleCreateKey}>
          <div className="space-y-4">
            <Input
              label="Key Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Binance Main Account"
              required
            />

            <Input
              label="Exchange"
              value={formData.exchange}
              onChange={(e) => setFormData(prev => ({ ...prev, exchange: e.target.value }))}
              placeholder="e.g., Binance, Coinbase, etc."
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {Object.entries(formData.permissions).map(([permission, enabled]) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [permission]: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {permission}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="IP Whitelist (optional)"
              value={formData.ipWhitelist}
              onChange={(e) => setFormData(prev => ({ ...prev, ipWhitelist: e.target.value }))}
              placeholder="192.168.1.1, 10.0.0.1 (comma separated)"
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createApiKeyMutation.isPending}
                disabled={createApiKeyMutation.isPending}
              >
                Create API Key
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Created Key Modal */}
      <Modal
        isOpen={!!createdKey}
        onClose={() => setCreatedKey(null)}
        title="API Key Created Successfully"
      >
        {createdKey && (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Key className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important Security Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      This is the only time you will see your secret key. Make sure to copy and store it securely.
                      You will not be able to retrieve it later.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded text-sm font-mono">
                  {createdKey.apiKey}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(createdKey.apiKey, 'apiKey')}
                >
                  {copying === 'apiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded text-sm font-mono">
                  {createdKey.secretKey}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(createdKey.secretKey, 'secretKey')}
                >
                  {copying === 'secretKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCreatedKey(null)}>
                I Have Saved My Keys
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default APIKeysManager;
