/**
 * Pages Structure & Best Practices
 */

# Pages Directory Guide

## File Structure

```
pages/
├── HFTDashboard.jsx           # Main trading dashboard
├── Dashboard.jsx              # Improved dashboard template
├── PortfolioPage.jsx          # Portfolio management
├── TradingPage.jsx            # Trading interface
├── AdvancedOrders.jsx         # Advanced order management
├── PortfolioDashboard.jsx     # Portfolio overview
├── TradeHistory.jsx           # Trade history & analytics
├── PnLDashboard.jsx           # P&L tracking
├── RiskHeatmap.jsx            # Risk visualization
├── PredictiveAlerts.jsx       # AI alerts
├── SentimentAnalysis.jsx      # Market sentiment
├── MarketScreener.jsx         # Token screening
├── LiquidityPools.jsx         # Liquidity management
├── JitoBundles.jsx            # MEV bundles
├── CrossChainBridge.jsx       # Cross-chain bridging
├── Monitoring.jsx             # System monitoring
├── NotificationsHub.jsx       # Notifications
├── APIKeysManager.jsx         # API key management
├── Settings.jsx               # User settings
├── NotFound.jsx               # 404 page
└── README.md                  # This file
```

## Page Template

Every page should follow this structure:

```javascript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer, GridContainer, Card } from '../components/layouts';
import { LoadingSpinner, ErrorState } from '../components/common';
import { useYourHook } from '../hooks';

export default function PageName() {
  // State management
  const [state, setState] = useState(initialValue);

  // Data fetching with hooks
  const { data, isLoading, error, refetch } = useYourHook();

  // Loading state
  if (isLoading) {
    return (
      <PageContainer title="Page Title">
        <LoadingSpinner message="Loading..." />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer title="Page Title">
        <ErrorState error={error} onRetry={refetch} />
      </PageContainer>
    );
  }

  // Main content
  return (
    <PageContainer
      title="Page Title"
      description="Page description"
    >
      {/* Your content here */}
    </PageContainer>
  );
}
```

## Key Patterns

### 1. Data Fetching

```javascript
import { useGetHoldings, useCreateOrder } from '../hooks';

// Read data
const { data, isLoading, error } = useGetHoldings();

// Write data (mutations)
const createOrder = useCreateOrder();
const handleSubmit = async (orderData) => {
  try {
    await createOrder.mutateAsync(orderData);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

### 2. State Management

```javascript
// Use useState for UI state
const [filters, setFilters] = useState({});
const [selectedItem, setSelectedItem] = useState(null);

// Use React Query for server state
const { data } = useGetData(filters);
```

### 3. Loading States

```javascript
// Loading
if (isLoading) return <LoadingSpinner />;

// Error
if (error) return <ErrorState error={error} onRetry={refetch} />;

// Empty
if (!data?.length) return <EmptyState message="No data" />;

// Content
return <div>{/* render data */}</div>;
```

### 4. Animations

```javascript
// Page entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Staggered children
{items.map((item, idx) => (
  <motion.div
    key={idx}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: idx * 0.1 }}
  >
    {item}
  </motion.div>
))}
```

## Common Hooks Usage

```javascript
// Portfolio
const { data: portfolio } = useGetPortfolioOverview();
const { data: holdings } = useGetHoldings();
const { data: performance } = useGetPortfolioPerformance('1d');

// Trading
const { data: trades } = useGetTrades();
const { data: orders } = useGetOrders();
const createTrade = useCreateTrade();

// Analytics
const { data: analytics } = useGetPerformanceAnalytics('1d');
const { data: alerts } = useGetAlerts();

// System
const { data: status } = useGetSystemStatus();
const { data: logs } = useGetSystemLogs();
```

## Best Practices

1. **Always handle loading/error states**
2. **Use PageContainer for consistent styling**
3. **Fetch data via hooks, not directly in components**
4. **Use animations for better UX**
5. **Keep pages focused on single responsibility**
6. **Re-export common components at page level**
7. **Use GridContainer for responsive layouts**
8. **Add proper error boundaries**
9. **Implement pagination for large datasets**
10. **Use React Query refetch for manual updates**

## Migration Path

Old pages should be refactored to:
1. Use hooks instead of direct API calls
2. Handle loading/error states properly
3. Use new layout components (PageContainer, GridContainer, Card)
4. Use new common components (Modal, Toast, Badge)
5. Implement proper animations

## Testing

```javascript
// Example test structure
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import * as hooks from '../hooks';

describe('Dashboard', () => {
  it('should display loading state', () => {
    jest.spyOn(hooks, 'useGetPortfolioOverview').mockReturnValue({
      isLoading: true,
    });
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```
