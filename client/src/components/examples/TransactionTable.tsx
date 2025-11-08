import { TransactionTable } from '../transaction-table';

export default function TransactionTableExample() {
  const mockTransactions = [
    { id: '1', date: '2024-01-15', description: 'Grocery Shopping', category: 'Groceries', amount: 85.50, type: 'expense' as const },
    { id: '2', date: '2024-01-14', description: 'Salary Deposit', category: 'Income', amount: 3500.00, type: 'income' as const },
    { id: '3', date: '2024-01-12', description: 'Movie Tickets', category: 'Entertainment', amount: 45.00, type: 'expense' as const },
    { id: '4', date: '2024-01-10', description: 'Gas Station', category: 'Transportation', amount: 60.00, type: 'expense' as const },
    { id: '5', date: '2024-01-08', description: 'Electric Bill', category: 'Utilities', amount: 125.00, type: 'expense' as const },
  ];

  return (
    <TransactionTable
      transactions={mockTransactions}
      onEdit={(id) => console.log('Edit transaction:', id)}
      onDelete={(id) => console.log('Delete transaction:', id)}
    />
  );
}
