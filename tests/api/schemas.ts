export const transactionSchema = {
  type: 'object',
  required: ['id', 'amount', 'type', 'category', 'date', 'description'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  amount: { type: ['number', 'string'] },
    type: { type: 'string', enum: ['income', 'expense'] },
    category: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    description: { type: 'string' }
  }
};

export const userSchema = {
  type: 'object',
  required: ['id', 'email', 'name'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

export const budgetSchema = {
  type: 'object',
  required: ['id', 'category', 'amount', 'period'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    category: { type: 'string' },
    amount: { type: 'number' },
    period: { type: 'string', enum: ['monthly', 'yearly'] },
    startDate: { type: 'string', format: 'date' }
  }
};