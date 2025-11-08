import { TransactionTable } from "@/components/transaction-table";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";

// TODO: Remove mock data when connecting to backend
const mockTransactions = [
  { id: '1', date: '2024-01-15', description: 'Grocery Shopping at Whole Foods', category: 'Groceries', amount: 85.50, type: 'expense' as const },
  { id: '2', date: '2024-01-14', description: 'Monthly Salary Deposit', category: 'Income', amount: 3500.00, type: 'income' as const },
  { id: '3', date: '2024-01-12', description: 'Movie Tickets - AMC Theater', category: 'Entertainment', amount: 45.00, type: 'expense' as const },
  { id: '4', date: '2024-01-10', description: 'Gas Station Fill-up', category: 'Transportation', amount: 60.00, type: 'expense' as const },
  { id: '5', date: '2024-01-08', description: 'Electric Bill Payment', category: 'Utilities', amount: 125.00, type: 'expense' as const },
  { id: '6', date: '2024-01-07', description: 'Online Shopping - Amazon', category: 'Shopping', amount: 120.75, type: 'expense' as const },
  { id: '7', date: '2024-01-05', description: 'Restaurant Dinner', category: 'Dining', amount: 85.00, type: 'expense' as const },
  { id: '8', date: '2024-01-03', description: 'Coffee Shop', category: 'Dining', amount: 12.50, type: 'expense' as const },
  { id: '9', date: '2024-01-02', description: 'Pharmacy Prescription', category: 'Healthcare', amount: 35.00, type: 'expense' as const },
  { id: '10', date: '2024-01-01', description: 'Freelance Project Payment', category: 'Income', amount: 500.00, type: 'income' as const },
];

export default function Transactions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your financial transactions
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <TransactionTable
        transactions={mockTransactions}
        onEdit={(id) => console.log('Edit transaction:', id)}
        onDelete={(id) => console.log('Delete transaction:', id)}
      />
    </div>
  );
}
