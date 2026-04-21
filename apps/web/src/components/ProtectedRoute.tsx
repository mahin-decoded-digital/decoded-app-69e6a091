import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const currentStaff = useAuthStore((state) => state.currentStaff);

  if (!currentStaff) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
};
