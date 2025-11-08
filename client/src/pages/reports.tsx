import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpendingChart } from "@/components/spending-chart";
import { TrendChart } from "@/components/trend-chart";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// TODO: Remove mock data when connecting to backend
const mockSpendingData = [
  { category: 'Groceries', amount: 450.75, color: 'hsl(var(--chart-1))' },
  { category: 'Entertainment', amount: 280.50, color: 'hsl(var(--chart-2))' },
  { category: 'Transportation', amount: 420.00, color: 'hsl(var(--chart-3))' },
  { category: 'Utilities', amount: 125.00, color: 'hsl(var(--chart-4))' },
  { category: 'Shopping', amount: 350.25, color: 'hsl(var(--chart-5))' },
];

const mockTrendData = [
  { month: 'Jul', income: 3500, expenses: 2800 },
  { month: 'Aug', income: 3500, expenses: 3100 },
  { month: 'Sep', income: 4000, expenses: 2900 },
  { month: 'Oct', income: 3500, expenses: 3200 },
  { month: 'Nov', income: 3750, expenses: 2950 },
  { month: 'Dec', income: 4200, expenses: 3400 },
];

export default function Reports() {
  const handleExport = (format: string) => {
    console.log('Exporting data as', format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your spending patterns and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-40" data-testid="select-export-format">
              <SelectValue placeholder="Export data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export as CSV</SelectItem>
              <SelectItem value="json">Export as JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-download-report">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Average Monthly Spending</p>
          <p className="text-2xl font-bold tabular-nums">$3,058.33</p>
          <p className="text-xs text-muted-foreground mt-1">Based on last 6 months</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Highest Spending Month</p>
          <p className="text-2xl font-bold tabular-nums">December</p>
          <p className="text-xs text-muted-foreground mt-1">$3,400.00 total</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Savings Rate</p>
          <p className="text-2xl font-bold tabular-nums text-chart-3">18.5%</p>
          <p className="text-xs text-muted-foreground mt-1">Of total income</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart data={mockSpendingData} title="Current Month Breakdown" />
        <TrendChart data={mockTrendData} title="6-Month Trend" />
      </div>

      {/* Category Breakdown Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {mockSpendingData.map((item) => {
            const total = mockSpendingData.reduce((sum, i) => sum + i.amount, 0);
            const percentage = (item.amount / total) * 100;
            return (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium tabular-nums w-24 text-right">
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
