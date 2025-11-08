import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface GoalCardProps {
  name: string;
  current: number;
  target: number;
  deadline?: string;
}

export function GoalCard({ name, current, target, deadline }: GoalCardProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chart-3/10">
          <Target className="h-5 w-5 text-chart-3" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1" data-testid={`text-goal-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </h4>
          {deadline && (
            <p className="text-xs text-muted-foreground mb-3">
              Deadline: {new Date(deadline).toLocaleDateString()}
            </p>
          )}
          <div className="space-y-2">
            <Progress value={percentage} className="[&>div]:bg-chart-3" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{percentage.toFixed(0)}% complete</span>
              <span className="font-medium tabular-nums">
                ${current.toFixed(2)} / ${target.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              ${remaining.toFixed(2)} remaining
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
