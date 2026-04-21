import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useRaceQRStore } from '@/stores/raceqr-store';
import { LayoutDashboard, QrCode, Wallet, ShieldCheck, LogOut, LogIn, ScanLine } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/entrance', label: 'Entrance', icon: QrCode },
  { to: '/scan', label: 'Scan QR', icon: ScanLine },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/staff', label: 'Staff Console', icon: ShieldCheck },
];

export const AppShell = () => {
  const navigate = useNavigate();
  const currentStaff = useAuthStore((state) => state.currentStaff);
  const logout = useAuthStore((state) => state.logout);
  const activeAttendeeId = useRaceQRStore((state) => state.activeAttendeeId);
  const attendees = useRaceQRStore((state) => state.attendees);
  const activeAttendee = attendees.find((item) => item.id === activeAttendeeId) ?? null;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b border-amber-900/20 bg-[#1c2b22] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-200/20 text-amber-200">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">RaceQR Wallet</p>
                <p className="text-sm text-white/70">Trackside QR check-in, rewards and paddock access</p>
              </div>
            </Link>
            {activeAttendee ? (
              <Badge variant="secondary" className="hidden border border-amber-200/30 bg-white/10 text-amber-100 md:inline-flex">
                Active attendee: {activeAttendee.name}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {currentStaff ? (
              <>
                <Badge variant="outline" className="border-white/30 text-white">
                  {currentStaff.role} · {currentStaff.name}
                </Badge>
                <Button
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    logout();
                    navigate('/staff/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => navigate('/staff/login')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Staff Login
              </Button>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 px-6 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-200/20 text-amber-100'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};