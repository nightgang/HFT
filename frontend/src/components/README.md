/**
 * README - Components Structure
 * Guide untuk mengorganisir dan menggunakan components
 */

# Components Directory Structure

## Organization

```
components/
├── common/              # Reusable UI components
│   ├── StateIndicators.jsx      # Loading, Error, Empty states
│   ├── Toast.jsx               # Notification toasts
│   ├── Badge.jsx               # Status & price badges
│   ├── Modal.jsx               # Dialog & confirmation modals
│   └── index.js                # Common exports
├── layouts/             # Layout & container components
│   └── index.jsx        # MainLayout, PageContainer, Card, Grid
├── dashboard/           # Dashboard-specific components
│   ├── StatsCard.jsx    # Statistics display cards
│   └── index.js
├── trading/             # Trading-related components
│   ├── TradingPanel.jsx # Order placement
│   └── index.js
├── portfolio/           # Portfolio-related components
│   ├── PortfolioOverview.jsx # Portfolio summary
│   └── index.js
├── ui/                  # Existing UI components
│   ├── DataTable.jsx
│   ├── Feedback.jsx
│   ├── Form.jsx
│   └── index.js
└── (other existing components) # Legacy components
```

## Usage Guidelines

### Common Components

```javascript
import { LoadingSpinner, ErrorState, Modal, StatusBadge } from '@/components/common';

// Loading state
<LoadingSpinner size="md" message="Loading..." />

// Error state
<ErrorState error={error} onRetry={handleRetry} />

// Modal
<Modal isOpen={isOpen} onClose={onClose} title="Settings">
  Modal content
</Modal>

// Status badge
<StatusBadge status="active" label="Active" />
```

### Layouts

```javascript
import { MainLayout, PageContainer, Card, GridContainer } from '@/components/layouts';

// Main layout
<MainLayout sidebar={<Sidebar />} header={<Header />}>
  Main content
</MainLayout>

// Page container
<PageContainer title="Dashboard" description="Overview">
  Page content
</PageContainer>

// Cards & Grid
<GridContainer columns={3}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</GridContainer>
```

### Feature Components

```javascript
import { TradingPanel } from '@/components/trading';
import { PortfolioOverview } from '@/components/portfolio';

// Use in pages
<TradingPanel walletId={activeWallet?.id} selectedToken={token} />
<PortfolioOverview />
```

## Best Practices

1. **Use Services + Hooks**: All components should fetch data via services and hooks
2. **Loading States**: Always handle loading, error, and empty states
3. **Animations**: Use Framer Motion for smooth transitions
4. **Responsive**: Design for mobile-first, then enhance for larger screens
5. **Accessibility**: Include proper labels, ARIA attributes, and keyboard navigation
6. **Type Safety**: Use PropTypes or TypeScript for prop validation
7. **Composition**: Break large components into smaller, reusable ones

## Creating New Components

1. Create component file in appropriate directory
2. Use hooks for data fetching
3. Include loading/error states
4. Add proper exports to index.js
5. Document usage in README

## Migration Plan

Old components in root should be moved to appropriate subdirectories:
- HFTHeader.jsx → layouts/
- HFTLayout.jsx → layouts/
- HFTSidebar.jsx → layouts/
- HFTTradePanel.jsx → trading/
- HFTActiveTrades.jsx → trading/
- etc.

This ensures better organization and easier maintenance.
