# Frontend Architecture Guide

## Overview

Frontend aplikasi HFT menggunakan arsitektur modern yang terstruktur dengan baik, dengan pemisahan yang jelas antara services, hooks, components, dan pages.

## Directory Structure

```
frontend/src/
├── services/              # API integration layer
│   ├── api.js            # Base HTTP client
│   ├── auth.service.js   # Authentication
│   ├── trading.service.js
│   ├── wallet.service.js
│   ├── portfolio.service.js
│   ├── analytics.service.js
│   ├── [20+ more services]
│   └── index.js          # Central export
│
├── hooks/                 # Custom React hooks
│   ├── useApi.js         # API query hooks (React Query)
│   ├── useCustom.js      # Utility hooks
│   ├── useWebSocket.js   # WebSocket connection
│   ├── useLocalStorage.js # Local storage
│   ├── useTable.jsx      # Table management
│   └── index.js          # Central export
│
├── components/           # React components (organized by feature)
│   ├── common/           # Reusable UI components
│   │   ├── StateIndicators.jsx
│   │   ├── Toast.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   └── index.js
│   ├── layouts/          # Layout components
│   │   └── index.jsx
│   ├── dashboard/        # Dashboard components
│   ├── trading/          # Trading components
│   ├── portfolio/        # Portfolio components
│   ├── ui/               # Legacy UI components
│   ├── [other components]
│   └── index.js
│
├── pages/                # Page-level components
│   ├── Dashboard.jsx
│   ├── PortfolioPage.jsx
│   ├── TradingPage.jsx
│   ├── [other pages]
│   ├── README.md
│   └── index.js
│
├── styles/              # Global styles
├── contexts/            # React contexts (if needed)
├── utils/               # Utility functions
└── App.jsx             # Root component
```

## Data Flow Architecture

```
┌─────────────────────────────────────────┐
│         React Component Layer            │
│   (Pages & Components)                   │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│         Custom Hooks Layer               │
│   (useGetTrades, useCreateOrder, etc)    │
│   - React Query integration              │
│   - State management                     │
│   - Caching & invalidation               │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│         Service Layer                    │
│   (tradingService, walletService, etc)   │
│   - Business logic                       │
│   - API endpoint composition              │
│   - Request/response handling            │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│         API Client Layer                 │
│   (api.js)                               │
│   - HTTP requests                        │
│   - Authentication                       │
│   - Error handling                       │
└──────────────────┬──────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   Backend API        │
        │   (Node.js/Express)  │
        └──────────────────────┘
```

## Usage Patterns

### 1. Fetching Data in Components

```javascript
// ❌ DON'T - Direct API calls
import axios from 'axios';

function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    axios.get('/api/data').then(res => setData(res.data));
  }, []);
}

// ✅ DO - Use hooks
import { useGetTrades } from '../hooks';

function MyComponent() {
  const { data, isLoading, error } = useGetTrades();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  return <div>{/* render data */}</div>;
}
```

### 2. Mutations (Create/Update/Delete)

```javascript
import { useCreateTrade } from '../hooks';

function TradingForm() {
  const createTrade = useCreateTrade();

  const handleSubmit = async (formData) => {
    try {
      await createTrade.mutateAsync(formData);
      // Data automatically refetched via React Query
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createTrade.isPending}>
        {createTrade.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### 3. Component Structure

```javascript
// ✅ Good component structure
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, PageContainer } from '../components/layouts';
import { LoadingSpinner, ErrorState } from '../components/common';
import { useGetData } from '../hooks';

export default function MyPage() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useGetData(filters);

  // Loading state
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  // Empty state
  if (!data?.length) return <EmptyState message="No data" />;

  // Main content
  return (
    <PageContainer title="My Page">
      <Card>{/* content */}</Card>
    </PageContainer>
  );
}
```

### 4. Service Creation

```javascript
// Example: Creating a new service
import api from './api';

class NewFeatureService {
  async getData(filters) {
    return api.get('/endpoint', { params: filters });
  }

  async createItem(data) {
    return api.post('/endpoint', data);
  }

  async updateItem(id, updates) {
    return api.put(`/endpoint/${id}`, updates);
  }

  async deleteItem(id) {
    return api.delete(`/endpoint/${id}`);
  }
}

export default new NewFeatureService();
```

### 5. Hook Integration with Service

```javascript
// Example: Creating a new hook
import { useQuery, useMutation } from '@tanstack/react-query';
import newFeatureService from '../services/new-feature.service';

export const useGetNewFeature = (filters, options = {}) => {
  return useQuery({
    queryKey: ['newFeature', filters],
    queryFn: () => newFeatureService.getData(filters),
    ...options,
  });
};

export const useCreateNewFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => newFeatureService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newFeature'] });
    },
  });
};
```

## State Management

### Local Component State
```javascript
const [filters, setFilters] = useState({});
const [isOpen, setIsOpen] = useState(false);
```

### Global Server State (React Query)
```javascript
// Cached automatically, re-fetched on refocus
const { data } = useGetPortfolio();

// Manual refetch
const { refetch } = useGetPortfolio();
await refetch();

// Invalidate cache (automatic re-fetch)
queryClient.invalidateQueries({ queryKey: ['portfolio'] });
```

### Local Persistence
```javascript
const [theme, setTheme] = useLocalStorage('theme', 'dark');
```

## Common Patterns

### Conditional Rendering with Loading States
```javascript
const { data, isLoading, error } = useGetData();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorState error={error} />;
if (!data) return <EmptyState />;

return <div>{data}</div>;
```

### Animations with Framer Motion
```javascript
import { motion, AnimatePresence } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Responsive Grid Layout
```javascript
import { GridContainer } from '../components/layouts';

<GridContainer columns={3}>
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</GridContainer>
// Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
```

## Performance Optimization

1. **React Query Caching**
   - Automatic deduplication
   - Stale time configuration
   - Manual cache invalidation

2. **Component Code Splitting**
   ```javascript
   const DashboardPage = lazy(() => import('./pages/Dashboard'));
   ```

3. **Memoization**
   ```javascript
   const MemoizedComponent = memo(MyComponent);
   ```

4. **useCallback & useMemo**
   ```javascript
   const handleClick = useCallback(() => {}, [dependency]);
   ```

## Error Handling

```javascript
// In hooks
try {
  await service.method();
} catch (error) {
  console.error('Failed:', error.message);
  throw error;
}

// In components
const { error } = useGetData();
if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}
```

## Testing Strategy

```javascript
// Test components with mocked hooks
import { render, screen } from '@testing-library/react';
import * as hooks from '../hooks';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  it('should display data when loaded', () => {
    jest.spyOn(hooks, 'useGetPortfolio').mockReturnValue({
      data: { value: 1000 },
      isLoading: false,
    });
    render(<Dashboard />);
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
```

## Best Practices

1. ✅ Always use hooks for data fetching
2. ✅ Handle loading, error, and empty states
3. ✅ Use TypeScript or PropTypes for validation
4. ✅ Organize components by feature
5. ✅ Create reusable components
6. ✅ Use animations for better UX
7. ✅ Implement proper error boundaries
8. ✅ Test components and hooks
9. ✅ Use React Query for server state
10. ✅ Follow naming conventions

## Common Gotchas

❌ **Don't**:
- Make API calls directly in components
- Use prop drilling for deeply nested components
- Fetch same data multiple times
- Ignore loading/error states
- Use setTimeout for side effects

✅ **Do**:
- Use hooks and services
- Use context or state management for deeply nested components
- Let React Query handle caching
- Always handle all states
- Use useEffect properly with dependencies

## Deployment Checklist

- [ ] All API endpoints are using service layer
- [ ] Error boundaries implemented
- [ ] Loading states for all async operations
- [ ] Environment variables configured
- [ ] API base URL properly set
- [ ] Authentication token handling
- [ ] Performance optimizations applied
- [ ] Code splitting configured
- [ ] Error tracking configured
- [ ] Analytics integrated

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
npm run test:coverage

# Code formatting
npm run format
```

## Resources

- [React Query Documentation](https://react-query-v3.tanstack.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hooks](https://react.dev/reference/react)
- [Frontend Best Practices](https://react.dev/learn)

## Support

For questions or issues with the frontend architecture:
1. Check the README files in each directory
2. Review existing components and pages
3. Check the services and hooks documentation
4. Ask the team for guidance
