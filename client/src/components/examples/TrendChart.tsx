import { TrendChart } from '../trend-chart';

export default function TrendChartExample() {
  const mockData = [
    { month: 'Jul', income: 3500, expenses: 2800 },
    { month: 'Aug', income: 3500, expenses: 3100 },
    { month: 'Sep', income: 4000, expenses: 2900 },
    { month: 'Oct', income: 3500, expenses: 3200 },
    { month: 'Nov', income: 3750, expenses: 2950 },
    { month: 'Dec', income: 4200, expenses: 3400 },
  ];

  return <TrendChart data={mockData} />;
}
