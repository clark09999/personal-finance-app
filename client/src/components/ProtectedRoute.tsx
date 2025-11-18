import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasToken = !!localStorage.getItem('bf_access_token');
  if (!hasToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
