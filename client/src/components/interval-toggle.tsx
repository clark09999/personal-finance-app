import { Button } from "@/components/ui/button";

export type Interval = 'daily' | 'weekly' | 'monthly';

interface IntervalToggleProps {
  interval: Interval;
  onIntervalChange: (interval: Interval) => void;
}

export function IntervalToggle({ interval, onIntervalChange }: IntervalToggleProps) {
  const intervals: { value: Interval; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="flex gap-2">
      {intervals.map(({ value, label }) => (
        <Button
          key={value}
          variant={interval === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onIntervalChange(value)}
          data-testid={`button-interval-${value}`}
          className="toggle-elevate"
          data-active={interval === value}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
