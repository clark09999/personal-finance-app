import React, { useEffect, useState } from 'react';
import api from '../api';
import { Transaction } from '../types/api';
import TransactionForm from './TransactionForm';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.getTransactions({ limit: 100 });
      if ((res as any).message) throw res;
      setTransactions(res as Transaction[]);
    } catch (e:any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const handleCreateSuccess = (t: Transaction) => { setTransactions(prev => [t, ...prev]); setShowForm(false); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      const res = await api.deleteTransaction(id);
      if ((res as any)?.message) throw res;
      setTransactions(prev => prev.filter(p => p.id !== id));
    } catch (e:any) { alert(e?.message || 'Delete failed'); }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Transactions</h2>
          <div>
            <button onClick={()=>setShowForm(s=>!s)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">{showForm? 'Close' : 'Add'}</button>
          </div>
        </div>

        {showForm && <TransactionForm onSuccess={handleCreateSuccess} onCancel={()=>setShowForm(false)} />}

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white rounded-lg shadow">
          <ul>
            {transactions.map(t => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-sm text-gray-500">{t.category} • {new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`${t.type==='income'?'text-green-600':'text-red-600'} font-semibold`}>${Number(t.amount).toFixed(2)}</div>
                  <button onClick={()=>{ setEditing(t); setShowForm(true); }} className="px-2 py-1 border rounded">Edit</button>
                  <button onClick={()=>handleDelete(t.id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
