import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import type { Interval } from "./interval-toggle";

interface TrendDataPoint {
  date: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
}

interface EnhancedTrendChartProps {
  data: TrendDataPoint[];
  interval: Interval;
  title?: string;
  isLoading?: boolean;
}

export function EnhancedTrendChart({ data, interval, title = "Financial Trends", isLoading }: EnhancedTrendChartProps) {
  // Format data for display with readable date labels
  const formattedData = data.map(point => {
    const date = new Date(point.date);
    let dateLabel: string;

    if (interval === 'daily') {
      dateLabel = format(date, 'MMM d');
    } else if (interval === 'weekly') {
      dateLabel = format(date, 'MMM d');
    } else {
      dateLabel = format(date, 'MMM yyyy');
    }

    return {
      ...point,
      dateLabel,
      income: point.total_income,
      expense: point.total_expense,
      net: point.net_balance,
    };
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="dateLabel"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-3))' }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-1))' }}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net Balance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
