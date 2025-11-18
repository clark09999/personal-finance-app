import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Download, LogOut } from 'lucide-react';
import api from '@/api';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
              <Link to="/transactions" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                <Receipt className="w-5 h-5 mr-2" />
                Transactions
              </Link>
              <Link to="/budgets" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                <Target className="w-5 h-5 mr-2" />
                Budgets
              </Link>
              <Link to="/export" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                <Download className="w-5 h-5 mr-2" />
                Export
              </Link>
            </div>
            <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
