import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIInsightsCard() {
  return (
    <Card className="p-6 border-primary/20 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get personalized financial recommendations, spending pattern analysis, and budget optimization suggestions powered by artificial intelligence.
          </p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Coming soon features:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Smart spending alerts and predictions</li>
              <li>• Automated budget recommendations</li>
              <li>• Financial goal planning assistance</li>
              <li>• Anomaly detection in transactions</li>
            </ul>
          </div>
          <Button variant="outline" className="mt-4" disabled data-testid="button-ai-insights">
            Enable AI Insights
          </Button>
        </div>
      </div>
    </Card>
  );
}
