import React, { useEffect, useState } from 'react';
import api from '../api';
import { Summary, Transaction } from '../types/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import AIInsights from '@/components/AIInsights';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function Dashboard() {
  const [range, setRange] = useState<'week'|'month'|'year'>('week');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // compute dates
        const now = new Date();
        let start: Date;
        if (range === 'week') { start = new Date(now); start.setDate(now.getDate() - 6); }
        else if (range === 'month') { start = new Date(now); start.setMonth(now.getMonth() - 1); }
        else { start = new Date(now); start.setFullYear(now.getFullYear() - 1); }

        const start_date = start.toISOString();
        const end_date = now.toISOString();

        const [s, txs] = await Promise.all([api.getSummary({ start_date, end_date }), api.getTransactions({ limit: 100, start_date, end_date })]);
        if ((s as any).message) throw s;
        if ((txs as any).message) throw txs;
        if (!mounted) return;
        setSummary(s as Summary);
        setTransactions(txs as Transaction[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [range]);

  const trendData = React.useMemo(() => {
    if (!transactions) return [];
    // group by date (simple)
    const map = new Map<string, { date: string; income: number; expense: number }>();
    transactions.slice().reverse().forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      const item = map.get(day) ?? { date: day, income: 0, expense: 0 };
      const amt = parseFloat(t.amount);
      if (t.type === 'income') item.income += amt; else item.expense += amt;
      map.set(day, item);
    });
    return Array.from(map.values()).slice(-7);
  }, [transactions]);

  const pieData = React.useMemo(() => {
    if (!summary) return [];
    return summary.category_breakdown.map((c, i) => ({ name: c.category, value: parseFloat(c.amount), color: COLORS[i % COLORS.length] }));
  }, [summary]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">FinanceFlow Dashboard</h1>
          <div>
            <select value={range} onChange={(e) => setRange(e.target.value as any)} className="px-3 py-2 rounded-lg border">
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </header>

        {loading && <div className="p-4">Loading...</div>}
        {error && <div className="p-4 text-red-600">{error}</div>}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Total Income</div>
              <div className="text-xl font-bold">${summary ? Number(summary.totalIncome).toFixed(2) : '0.00'}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-xl font-bold">${summary ? Number(summary.totalExpenses).toFixed(2) : '0.00'}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Net Balance</div>
              <div className="text-xl font-bold">${summary ? Number(summary.netBalance).toFixed(2) : '0.00'}</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-2">Trend (7 days)</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#10B981" />
                  <Line type="monotone" dataKey="expense" stroke="#EF4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-2">Spending by Category</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Category Breakdown</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(summary?.category_breakdown || []).map(c => ({ name: c.category, amount: Number(c.amount), count: c.transaction_count }))}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#3B82F6" />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          <ul>
            {transactions.slice(0,10).map(t => (
              <li key={t.id} className="flex justify-between py-2 border-b">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-sm text-gray-500">{t.category} • {new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div className={`${t.type==='income'?'text-green-600':'text-red-600'} font-semibold`}>${Number(t.amount).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* AI Insights - ADD THIS */}
        <div className="mt-8">
          <AIInsights />
        </div>
      </div>
    </div>
  );
}

