import React, { Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { Spinner } from '@/components/ui/spinner';
import { ErrorBoundary } from '@/components/error-boundary';

// Lazy load pages
const Dashboard = React.lazy(() => import('@/pages/dashboard'));
const Transactions = React.lazy(() => import('@/pages/transactions'));
const Budgets = React.lazy(() => import('@/pages/budgets'));
const Reports = React.lazy(() => import('@/pages/reports'));
const NotFound = React.lazy(() => import('@/pages/not-found'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}
