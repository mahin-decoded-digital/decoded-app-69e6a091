import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const authError = useAuthStore((state) => state.authError);
  const staffUsers = useAuthStore((state) => state.staffUsers);
  const [email, setEmail] = useState('manager@raceqr.test');
  const [password, setPassword] = useState('RaceQR123');
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    setLocalError('');
    if (!email.trim() || !password.trim()) {
      setLocalError('Enter both email and password to access the staff console.');
      return;
    }
    setPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const success = login(email, password);
    setPending(false);
    if (!success) {
      return;
    }
    navigate('/staff');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Racecourse operations team"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10">
          <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">Role-based staff access</Badge>
          <h1 className="mt-3 text-3xl font-bold">Secure staff login for gate, secretary, vendor and manager workflows</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Staff authentication protects token allocation, lounge access actions, vendor redemptions and CSV export.
            Every authenticated action is written into the RaceQR audit trail to preserve operational trust.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {staffUsers.map((staff) => (
              <div key={staff.id} className="rounded-lg border border-white/20 bg-white/10 p-4 text-white">
                <p className="font-semibold">{staff.name}</p>
                <p className="text-sm text-white/70">{staff.role} · {staff.email}</p>
                <p className="mt-2 text-xs text-white/70">Permissions: {staff.permissions.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-primary" /> Staff authentication</CardTitle>
          <CardDescription>Use one of the demo role accounts shown on the left. Default password: RaceQR123</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Staff email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
          {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
          <Button onClick={handleSubmit} disabled={pending} className="w-full">
            <Lock className="mr-2 h-4 w-4" />
            {pending ? 'Signing in...' : 'Sign in to staff console'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}