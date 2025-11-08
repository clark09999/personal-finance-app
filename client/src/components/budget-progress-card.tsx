import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

interface BudgetProgressCardProps {
  category: string;
  spent: number;
  total: number;
  icon?: string;
}

export function BudgetProgressCard({ category, spent, total, icon }: BudgetProgressCardProps) {
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = Math.max(total - spent, 0);
  const isOverBudget = spent > total;
  const isNearLimit = percentage > 80 && !isOverBudget;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h4 className="font-medium" data-testid={`text-category-${category.toLowerCase()}`}>{category}</h4>
            <p className="text-sm text-muted-foreground">
              ${spent.toFixed(2)} / ${total.toFixed(2)}
            </p>
          </div>
        </div>
        {(isOverBudget || isNearLimit) && (
          <AlertCircle className={`h-5 w-5 ${isOverBudget ? 'text-destructive' : 'text-chart-4'}`} />
        )}
      </div>
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={isOverBudget ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-chart-4' : ''}
          data-testid={`progress-${category.toLowerCase()}`}
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{percentage.toFixed(0)}% used</span>
          <span className={isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {isOverBudget ? `$${(spent - total).toFixed(2)} over` : `$${remaining.toFixed(2)} left`}
          </span>
        </div>
      </div>
    </Card>
  );
}
