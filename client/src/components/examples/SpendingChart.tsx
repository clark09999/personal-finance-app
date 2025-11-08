import { SpendingChart } from '../spending-chart';

export default function SpendingChartExample() {
  const mockData = [
    { category: 'Groceries', amount: 450.75, color: 'hsl(var(--chart-1))' },
    { category: 'Entertainment', amount: 280.50, color: 'hsl(var(--chart-2))' },
    { category: 'Transportation', amount: 420.00, color: 'hsl(var(--chart-3))' },
    { category: 'Utilities', amount: 125.00, color: 'hsl(var(--chart-4))' },
    { category: 'Shopping', amount: 350.25, color: 'hsl(var(--chart-5))' },
  ];

  return <SpendingChart data={mockData} />;
}
