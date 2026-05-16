import { useState, useEffect } from "react";

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

// Specialized hooks for common preferences
export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage("theme", "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return [theme, setTheme];
};

export const useTablePageSize = () => {
  return useLocalStorage("tablePageSize", 10);
};

export const useAutoRefresh = () => {
  return useLocalStorage("autoRefresh", true);
};

export const useRefreshInterval = () => {
  return useLocalStorage("refreshInterval", 30000); // 30 seconds
};

export const useNotificationSettings = () => {
  return useLocalStorage("notificationSettings", {
    tradeAlerts: true,
    priceAlerts: true,
    systemAlerts: true,
    soundEnabled: false,
  });
};

export const useChartSettings = () => {
  return useLocalStorage("chartSettings", {
    timeframe: "1h",
    indicators: ["volume", "rsi"],
    theme: "dark",
  });
};

export const usePortfolioSettings = () => {
  return useLocalStorage("portfolioSettings", {
    showPercentages: true,
    showValues: true,
    sortBy: "value",
    hideSmallBalances: false,
  });
};

export const useApiKeyVisibility = () => {
  return useLocalStorage("apiKeyVisibility", {});
};