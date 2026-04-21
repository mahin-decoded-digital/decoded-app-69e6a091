import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/DashboardPage';
import EntrancePage from '@/pages/EntrancePage';
import WalletPage from '@/pages/WalletPage';
import ScanPage from '@/pages/ScanPage';
import StaffLoginPage from '@/pages/StaffLoginPage';
import StaffConsolePage from '@/pages/StaffConsolePage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/entrance" element={<EntrancePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffConsolePage />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}