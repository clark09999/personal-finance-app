import { BudgetProgressCard } from '../budget-progress-card';

export default function BudgetProgressCardExample() {
  return (
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
  );
}
