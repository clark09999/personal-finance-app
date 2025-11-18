import { useEffect } from 'react';

export function usePreloadRoute(route: string) {
  useEffect(() => {
    // Preload the route module when the component mounts
    const preloadRoute = () => {
      switch (route) {
        case '/transactions':
          import('@/pages/transactions');
          break;
        case '/budgets':
          import('@/pages/budgets');
          break;
        case '/reports':
          import('@/pages/reports');
          break;
        // Add more routes as needed
      }
    };

    // Delay preloading until after the current route has loaded
    const timeoutId = setTimeout(preloadRoute, 1000);

    return () => clearTimeout(timeoutId);
  }, [route]);
}

// Preload specific component
export function usePreloadComponent(component: 'charts' | 'table') {
  useEffect(() => {
    const preloadComponent = () => {
      switch (component) {
        case 'charts':
          import('@/components/enhanced-trend-chart');
          import('@/components/spending-chart');
          break;
        case 'table':
          import('@/components/transaction-table');
          break;
      }
    };

    const timeoutId = setTimeout(preloadComponent, 1000);

    return () => clearTimeout(timeoutId);
  }, [component]);
}

// Usage example:
// const MyComponent = () => {
//   usePreloadRoute('/transactions');
//   usePreloadComponent('charts');
//   return <div>Content</div>;
// };
