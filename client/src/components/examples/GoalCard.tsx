import { GoalCard } from '../goal-card';

export default function GoalCardExample() {
  return (
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
      <GoalCard
        name="New Laptop"
        current={850}
        target={1500}
      />
    </div>
  );
}
