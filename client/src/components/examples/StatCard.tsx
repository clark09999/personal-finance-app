import { StatCard } from '../stat-card';
import { DollarSign, TrendingDown, Wallet, Target } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Spending"
        value="$3,245.50"
        subtitle="This month"
        icon={DollarSign}
        trend={{ value: "12% from last month", isPositive: false }}
      />
      <StatCard
        title="Budget Remaining"
        value="$1,754.50"
        subtitle="35% of monthly budget"
        icon={Wallet}
        trend={{ value: "On track", isPositive: true }}
      />
      <StatCard
        title="Savings"
        value="$8,420.00"
        icon={TrendingDown}
      />
      <StatCard
        title="Goals Progress"
        value="67%"
        subtitle="2 of 3 goals on track"
        icon={Target}
      />
    </div>
  );
}
