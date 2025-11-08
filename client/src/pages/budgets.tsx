import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetProgressCard } from "@/components/budget-progress-card";
import { Card } from "@/components/ui/card";

// TODO: Remove mock data when connecting to backend
const mockBudgets = [
  { category: "Groceries", spent: 450.75, total: 600, icon: "🛒" },
  { category: "Entertainment", spent: 280.50, total: 300, icon: "🎬" },
  { category: "Transportation", spent: 420.00, total: 350, icon: "🚗" },
  { category: "Utilities", spent: 125.00, total: 200, icon: "💡" },
  { category: "Shopping", spent: 350.25, total: 400, icon: "🛍️" },
  { category: "Dining", spent: 210.00, total: 300, icon: "🍽️" },
  { category: "Healthcare", spent: 85.00, total: 150, icon: "⚕️" },
  { category: "Other", spent: 95.50, total: 200, icon: "📦" },
];

export default function Budgets() {
  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.total, 0);
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const percentageUsed = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Set and track your monthly spending limits
          </p>
        </div>
        <Button data-testid="button-create-budget">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold tabular-nums">${totalBudget.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-bold tabular-nums">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {percentageUsed.toFixed(0)}% of budget
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
            <p className="text-2xl font-bold tabular-nums text-chart-3">
              ${totalRemaining.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBudgets.map((budget) => (
          <BudgetProgressCard
            key={budget.category}
            category={budget.category}
            spent={budget.spent}
            total={budget.total}
            icon={budget.icon}
          />
        ))}
      </div>
    </div>
  );
}
