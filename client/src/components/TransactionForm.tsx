import React, { useState, useEffect } from 'react';
import api from '../api';
import { Transaction } from '../types/api';

interface Props {
  onSuccess?: (t: Transaction) => void;
  onCancel?: () => void;
  initial?: Partial<Transaction>;
}

export default function TransactionForm({ onSuccess, onCancel, initial }: Props) {
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [type, setType] = useState<'income'|'expense'>(initial?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // simple category list; ideally load from API
  const categories = [
    { id: 'food', name: 'Food' },
    { id: 'transport', name: 'Transport' },
    { id: 'income', name: 'Income' },
    { id: 'other', name: 'Other' },
  ];

  useEffect(() => { if (initial) { setAmount(initial.amount ?? ''); setType(initial.type ?? 'expense'); setCategoryId(initial.categoryId ?? ''); setDescription(initial.description ?? ''); } }, [initial]);

  const validate = (): string | null => {
    if (!categoryId) return 'Category is required';
    if (!amount) return 'Amount is required';
    if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(amount)) return 'Amount must be a positive number with up to 2 decimals';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true); setError(null);
    try {
      const payload = { amount, type, categoryId, description, date };
      const res = await api.createTransaction(payload as any);
      if ((res as any).message) throw res;
      onSuccess && onSuccess(res as Transaction);
      // reset
      setAmount(''); setDescription(''); setCategoryId('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create transaction');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow">
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 block w-full border rounded px-2 py-2" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <div className="mt-1">
            <label className="mr-3"><input type="radio" checked={type==='income'} onChange={()=>setType('income')} /> Income</label>
            <label className="ml-3"><input type="radio" checked={type==='expense'} onChange={()=>setType('expense')} /> Expense</label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="mt-1 block w-full border rounded px-2 py-2">
            <option value="">Select</option>
            {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 block w-full border rounded px-2 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 block w-full border rounded px-2 py-2" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white">{loading? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
