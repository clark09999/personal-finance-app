import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Wallet, TrendingUp, Target, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { BudgetProgressCard } from "@/components/budget-progress-card";
import { AIInsightsCard } from "@/components/ai-insights-card";
import { SpendingChart } from "@/components/spending-chart";
import { GoalCard } from "@/components/goal-card";
import { Card } from "@/components/ui/card";
import { IntervalToggle, type Interval } from "@/components/interval-toggle";
import { EnhancedTrendChart } from "@/components/enhanced-trend-chart";

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Dashboard() {
  const [interval, setInterval] = useState<Interval>('monthly');

  // Fetch trend data based on selected interval
  const { data: trendData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['/api/summary/trends', interval],
    queryFn: async () => {
      const response = await fetch(`/api/summary/trends?interval=${interval}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trend data');
      }
      return response.json();
    },
  });

  // Fetch spending summary data
  const { data: spendingData, isLoading: isLoadingSpending } = useQuery({
    queryKey: ['/api/summary/spending'],
    queryFn: async () => {
      const response = await fetch('/api/summary/spending');
      if (!response.ok) {
        throw new Error('Failed to fetch spending data');
      }
      const data = await response.json();
      // Add colors to spending data
      return data.map((item: { category: string; amount: number }, index: number) => ({
        ...item,
        color: chartColors[index % chartColors.length],
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your financial overview at a glance
        </p>
      </div>

      {/* Overspending Alert */}
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Budget Alert</h4>
            <p className="text-sm text-muted-foreground">
              You've exceeded your Transportation budget by $70.00 this month.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
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
          icon={TrendingUp}
        />
        <StatCard
          title="Goals Progress"
          value="67%"
          subtitle="2 of 3 goals on track"
          icon={Target}
        />
      </div>

      {/* AI Insights */}
      <AIInsightsCard />

      {/* Charts Grid with Interval Toggle */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Financial Analysis</h2>
          <IntervalToggle interval={interval} onIntervalChange={setInterval} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart data={spendingData || []} isLoading={isLoadingSpending} />
          <EnhancedTrendChart 
            data={trendData || []} 
            interval={interval}
            isLoading={isLoadingTrends}
            title={`${interval.charAt(0).toUpperCase() + interval.slice(1)} Trends`}
          />
        </div>
      </div>

      {/* Budget Progress */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Budget Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BudgetProgressCard
            category="Groceries"
            spent={450.75}
            total={600}
            icon="🛒"
          />
          <BudgetProgressCard
            category="Entertainment"
            spent={280.50}
            total={300}
            icon="🎬"
          />
          <BudgetProgressCard
            category="Transportation"
            spent={420.00}
            total={350}
            icon="🚗"
          />
          <BudgetProgressCard
            category="Utilities"
            spent={125.00}
            total={200}
            icon="💡"
          />
        </div>
      </div>

      {/* Goals */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Savings Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalCard
            name="Emergency Fund"
            current={6500}
            target={10000}
            deadline="2024-12-31"
          />
          <GoalCard
            name="Vacation Fund"
            current={1200}
            target={3000}
            deadline="2024-06-30"
          />
        </div>
      </div>
    </div>
  );
}
