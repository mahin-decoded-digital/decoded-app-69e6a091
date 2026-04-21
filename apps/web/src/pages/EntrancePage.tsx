import { useMemo, useState } from 'react';
import {ArrowRight, QrCode, UserPlus, Search, Check} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ToastBanner } from '@/components/ToastBanner';
import { useToast } from '@/hooks/use-toast';
import { useRaceQRStore } from '@/stores/raceqr-store';
import type { UserRole } from '@/types/models';
import { formatDateTime } from '@/lib/helpers';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  anonymous: false,
  role: 'guest' as UserRole,
};

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function EntrancePage() {
  const registerAttendee = useRaceQRStore((state) => state.registerAttendee);
  const checkInReturning = useRaceQRStore((state) => state.checkInReturning);
  const attendees = useRaceQRStore((state) => state.attendees);
  const activeAttendeeId = useRaceQRStore((state) => state.activeAttendeeId);
  const wallets = useRaceQRStore((state) => state.wallets);
  const { toast, showToast } = useToast();

  const [form, setForm] = useState(defaultForm);
  const [lookup, setLookup] = useState('');
  const [formError, setFormError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const activeAttendee = useMemo(
    () => attendees.find((item) => item.id === activeAttendeeId) ?? null,
    [attendees, activeAttendeeId],
  );
  const activeWallet = wallets.find((item) => item.attendeeId === activeAttendeeId) ?? null;

  const handleRegister = async () => {
    setFormError('');

    if (!form.anonymous) {
      if (!form.name.trim()) {
        setFormError('Please enter a name or switch to anonymous registration.');
        return;
      }
      if (!form.email.trim() && !form.phone.trim()) {
        setFormError('Please add a phone number or email so the attendee can check in again later.');
        return;
      }
    }

    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const attendee = registerAttendee(form);
    setIsSubmitting(false);
    setForm(defaultForm);
    showToast({
      title: 'Wallet created',
      description: `${attendee.name} is checked in and has a live rewards wallet.`,
      variant: 'default',
    });
  };

  const handleReturningCheckIn = async () => {
    setLookupError('');
    if (!lookup.trim()) {
      setLookupError('Enter the attendee name, phone or email used last time.');
      return;
    }
    setIsCheckingIn(true);
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const result = checkInReturning(lookup);
    setIsCheckingIn(false);
    if (!result.success) {
      setLookupError(result.message);
      return;
    }
    setLookup('');
    showToast({ title: 'Check-in successful', description: result.message, variant: 'default' });
  };

  return (
    <div className="space-y-8">
      <ToastBanner toast={toast} />
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Racing gates entrance"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">Entrance QR flows</Badge>
          <h1 className="text-3xl font-bold">Two fast check-in journeys for race day arrivals</h1>
          <p className="text-white/80">
            Present one clearly labelled QR for new visitors and one for returning attendees. The registration flow keeps
            details minimal, while returning guests can identify themselves with a single email, phone number or name.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><UserPlus className="h-5 w-5 text-primary" /> New visitor registration</CardTitle>
            <CardDescription>Create a wallet in seconds with minimal personal data and an anonymous option.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} disabled={form.anonymous} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Visitor name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}>
                  <option value="guest">Guest</option>
                  <option value="owner">Owner</option>
                  <option value="trainer">Trainer</option>
                  <option value="stablehand">Stablehand</option>
                  <option value="staff">Staff / service provider</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} disabled={form.anonymous} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} disabled={form.anonymous} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="07..." />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-border p-4 text-sm">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    anonymous: event.target.checked,
                    name: event.target.checked ? '' : current.name,
                    email: event.target.checked ? '' : current.email,
                    phone: event.target.checked ? '' : current.phone,
                  }))
                }
                className="mt-1"
              />
              <span>
                <span className="font-medium text-foreground">Register anonymously</span>
                <span className="mt-1 block text-muted-foreground">
                  Anonymous visitors still receive a wallet, but cannot use phone or email based returning check-in until they later share contact details.
                </span>
              </span>
            </label>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <Button onClick={handleRegister} disabled={isSubmitting} className="w-full">
              <QrCode className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Creating wallet...' : 'Complete new-user QR registration'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Search className="h-5 w-5 text-primary" /> Returning attendee check-in</CardTitle>
            <CardDescription>Designed for the second entrance QR so known visitors can re-enter with almost no friction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lookup">Name, phone or email</Label>
              <Input id="lookup" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="charlotte@example.com or 07123 456789" />
            </div>
            {lookupError ? <p className="text-sm text-destructive">{lookupError}</p> : null}
            <Button onClick={handleReturningCheckIn} disabled={isCheckingIn} className="w-full">
              <ArrowRight className="mr-2 h-4 w-4" />
              {isCheckingIn ? 'Checking in...' : 'Use returning-user QR flow'}
            </Button>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Helpful signage copy</p>
              <p className="mt-2">New here? Scan the registration QR. Been here before? Scan the returning check-in QR and type one identifier only.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Check className="h-5 w-5 text-primary" /> Current live attendee</CardTitle>
          <CardDescription>Preview what the visitor sees immediately after scanning and completing entry.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAttendee && activeWallet ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Attendee</p>
                <p className="mt-2 text-xl font-semibold">{activeAttendee.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Role: {activeAttendee.role}</p>
              </div>
              <div className="rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Wallet balance</p>
                <p className="mt-2 text-xl font-semibold">{activeWallet.balance} tokens</p>
                <p className="mt-1 text-sm text-muted-foreground">Initial welcome tokens are loaded instantly.</p>
              </div>
              <div className="rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Last check-in</p>
                <p className="mt-2 text-base font-semibold">{formatDateTime(activeAttendee.lastCheckInAt)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Use this confirmation at the gate or next enclosure.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Complete either entrance flow to create or locate an attendee profile.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}