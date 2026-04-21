import { useMemo, useState } from 'react';
import {ShieldCheck, Coins, ScanLine, ListChecks, Store, History} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastBanner } from '@/components/ToastBanner';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/helpers';
import { useAuthStore } from '@/stores/auth-store';
import { useRaceQRStore } from '@/stores/raceqr-store';

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function StaffConsolePage() {
  const currentStaff = useAuthStore((state) => state.currentStaff);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const appendAudit = useAuthStore((state) => state.appendAudit);
  const attendees = useRaceQRStore((state) => state.attendees);
  const wallets = useRaceQRStore((state) => state.wallets);
  const venueQrs = useRaceQRStore((state) => state.venueQrs);
  const swingers = useRaceQRStore((state) => state.swingers);
  const auditLogs = useRaceQRStore((state) => state.auditLogs);
  const allocateTokens = useRaceQRStore((state) => state.allocateTokens);
  const scanVenueQr = useRaceQRStore((state) => state.scanVenueQr);
  const issueSwinger = useRaceQRStore((state) => state.issueSwinger);
  const redeemSwinger = useRaceQRStore((state) => state.redeemSwinger);
  const redeemTokens = useRaceQRStore((state) => state.redeemTokens);
  const { toast, showToast } = useToast();

  const [allocation, setAllocation] = useState({ attendeeId: attendees[0]?.id ?? '', amount: '5', note: 'Hospitality thank-you tokens' });
  const [scanForm, setScanForm] = useState({ attendeeId: attendees[0]?.id ?? '', qrId: venueQrs[2]?.id ?? '' });
  const [swingerForm, setSwingerForm] = useState({ attendeeId: attendees.find((item) => item.role === 'owner')?.id ?? '', rewardType: 'drink', tokenValue: '6' });
  const [redemption, setRedemption] = useState({ attendeeId: attendees[0]?.id ?? '', amount: '4', rewardLabel: 'Trackside drink' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingSection, setPendingSection] = useState('');

  const attendeeOptions = useMemo(
    () => attendees.map((attendee) => ({ value: attendee.id, label: `${attendee.name} · ${attendee.role}` })),
    [attendees],
  );

  if (!currentStaff) {
    return null;
  }

  const handleAllocation = async () => {
    if (!hasPermission('allocate_tokens')) {
      setErrors((state) => ({ ...state, allocation: 'Your staff role does not allow token allocation.' }));
      return;
    }
    const amount = Number(allocation.amount);
    if (!allocation.attendeeId || Number.isNaN(amount) || amount <= 0 || !allocation.note.trim()) {
      setErrors((state) => ({ ...state, allocation: 'Choose an attendee, enter a positive amount and include an audit note.' }));
      return;
    }
    setErrors((state) => ({ ...state, allocation: '' }));
    setPendingSection('allocation');
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const result = allocateTokens({ attendeeId: allocation.attendeeId, amount, note: allocation.note, staff: currentStaff });
    setPendingSection('');
    if (!result.success) {
      setErrors((state) => ({ ...state, allocation: result.message }));
      return;
    }
    appendAudit({
      id: `audit-auth-${Date.now()}`,
      actorId: currentStaff.id,
      actorName: currentStaff.name,
      actorRole: currentStaff.role,
      action: 'staff_console_allocation',
      targetType: 'auth',
      targetId: currentStaff.id,
      details: 'Staff console initiated a token allocation request.',
      createdAt: new Date().toISOString(),
    });
    showToast({ title: 'Tokens allocated', description: result.message, variant: 'default' });
  };

  const handleScan = async () => {
    if (!hasPermission('manage_access') && !hasPermission('redeem_rewards')) {
      setErrors((state) => ({ ...state, scan: 'Your role cannot validate access or vendor QR actions.' }));
      return;
    }
    if (!scanForm.attendeeId || !scanForm.qrId) {
      setErrors((state) => ({ ...state, scan: 'Select both an attendee and a QR checkpoint.' }));
      return;
    }
    setErrors((state) => ({ ...state, scan: '' }));
    setPendingSection('scan');
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const result = scanVenueQr({ attendeeId: scanForm.attendeeId, qrId: scanForm.qrId, staff: currentStaff });
    setPendingSection('');
    if (!result.success) {
      setErrors((state) => ({ ...state, scan: result.message }));
      showToast({ title: 'Access result', description: result.message, variant: 'destructive' });
      return;
    }
    showToast({ title: 'QR recorded', description: result.message, variant: 'default' });
  };

  const handleIssueSwinger = async () => {
    if (!hasPermission('issue_swingers')) {
      setErrors((state) => ({ ...state, swinger: 'Your role is not permitted to issue owner swingers.' }));
      return;
    }
    const tokenValue = Number(swingerForm.tokenValue);
    if (!swingerForm.attendeeId || Number.isNaN(tokenValue) || tokenValue <= 0) {
      setErrors((state) => ({ ...state, swinger: 'Choose an owner and set a valid token value.' }));
      return;
    }
    setErrors((state) => ({ ...state, swinger: '' }));
    setPendingSection('swinger');
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const result = issueSwinger({
      attendeeId: swingerForm.attendeeId,
      rewardType: swingerForm.rewardType as 'drink' | 'snack' | 'tokens',
      tokenValue,
      staff: currentStaff,
    });
    setPendingSection('');
    if (!result.success) {
      setErrors((state) => ({ ...state, swinger: result.message }));
      return;
    }
    showToast({ title: 'Swinger issued', description: result.message, variant: 'default' });
  };

  const handleRedeemTokens = async () => {
    if (!hasPermission('redeem_rewards')) {
      setErrors((state) => ({ ...state, redemption: 'Your role cannot redeem rewards at vendor points.' }));
      return;
    }
    const amount = Number(redemption.amount);
    if (!redemption.attendeeId || Number.isNaN(amount) || amount <= 0 || !redemption.rewardLabel.trim()) {
      setErrors((state) => ({ ...state, redemption: 'Provide attendee, token amount and reward label.' }));
      return;
    }
    setErrors((state) => ({ ...state, redemption: '' }));
    setPendingSection('redemption');
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const result = redeemTokens({ attendeeId: redemption.attendeeId, amount, rewardLabel: redemption.rewardLabel, staff: currentStaff });
    setPendingSection('');
    if (!result.success) {
      setErrors((state) => ({ ...state, redemption: result.message }));
      return;
    }
    showToast({ title: 'Vendor redemption complete', description: result.message, variant: 'default' });
  };

  const ownerSwingers = swingers.filter((item) => item.status === 'issued');

  return (
    <div className="space-y-8">
      <ToastBanner toast={toast} />
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Racecourse operations"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">Authenticated staff workspace</Badge>
          <h1 className="text-3xl font-bold">Operations console for rewards, QR validation and owner hospitality</h1>
          <p className="text-white/80">
            Signed in as {currentStaff.name}. Your role controls which workflows are enabled below, ensuring racecourse
            operators can separate manager, gate, secretary and vendor responsibilities without losing a clean audit trail.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Coins className="h-5 w-5 text-primary" /> Allocate tokens</CardTitle>
            <CardDescription>Authorized staff can deposit rewards directly into an attendee wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Attendee</Label>
              <Select value={allocation.attendeeId} onChange={(event) => setAllocation((state) => ({ ...state, attendeeId: event.target.value }))}>
                {attendeeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input value={allocation.amount} onChange={(event) => setAllocation((state) => ({ ...state, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Audit note</Label>
                <Input value={allocation.note} onChange={(event) => setAllocation((state) => ({ ...state, note: event.target.value }))} />
              </div>
            </div>
            {errors.allocation ? <p className="text-sm text-destructive">{errors.allocation}</p> : null}
            <Button onClick={handleAllocation} disabled={pendingSection === 'allocation'} className="w-full">
              {pendingSection === 'allocation' ? 'Allocating...' : 'Allocate tokens'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ScanLine className="h-5 w-5 text-primary" /> Venue QR validation</CardTitle>
            <CardDescription>Record visits, exit events and restricted-area access against role-based rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Attendee</Label>
              <Select value={scanForm.attendeeId} onChange={(event) => setScanForm((state) => ({ ...state, attendeeId: event.target.value }))}>
                {attendeeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>QR checkpoint</Label>
              <Select value={scanForm.qrId} onChange={(event) => setScanForm((state) => ({ ...state, qrId: event.target.value }))}>
                {venueQrs.map((qr) => <option key={qr.id} value={qr.id}>{qr.label} · {qr.location}</option>)}
              </Select>
            </div>
            {errors.scan ? <p className="text-sm text-destructive">{errors.scan}</p> : null}
            <Button onClick={handleScan} disabled={pendingSection === 'scan'} className="w-full">
              {pendingSection === 'scan' ? 'Recording scan...' : 'Record QR scan'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ListChecks className="h-5 w-5 text-primary" /> Issue owner swinger</CardTitle>
            <CardDescription>Secretary teams can issue detachable-stub hospitality benefits linked to the owner's wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Owner attendee</Label>
              <Select value={swingerForm.attendeeId} onChange={(event) => setSwingerForm((state) => ({ ...state, attendeeId: event.target.value }))}>
                {attendees.filter((item) => item.role === 'owner').map((attendee) => <option key={attendee.id} value={attendee.id}>{attendee.name}</option>)}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reward type</Label>
                <Select value={swingerForm.rewardType} onChange={(event) => setSwingerForm((state) => ({ ...state, rewardType: event.target.value }))}>
                  <option value="drink">Drink</option>
                  <option value="snack">Snack</option>
                  <option value="tokens">Token conversion</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Token conversion value</Label>
                <Input value={swingerForm.tokenValue} onChange={(event) => setSwingerForm((state) => ({ ...state, tokenValue: event.target.value }))} />
              </div>
            </div>
            {errors.swinger ? <p className="text-sm text-destructive">{errors.swinger}</p> : null}
            <Button onClick={handleIssueSwinger} disabled={pendingSection === 'swinger'} className="w-full">
              {pendingSection === 'swinger' ? 'Issuing...' : 'Issue swinger'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Store className="h-5 w-5 text-primary" /> Vendor redemptions</CardTitle>
            <CardDescription>Redeem tokens for goods or convert outstanding swinger stubs into wallet value.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Attendee</Label>
              <Select value={redemption.attendeeId} onChange={(event) => setRedemption((state) => ({ ...state, attendeeId: event.target.value }))}>
                {attendeeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Token amount</Label>
                <Input value={redemption.amount} onChange={(event) => setRedemption((state) => ({ ...state, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Reward label</Label>
                <Input value={redemption.rewardLabel} onChange={(event) => setRedemption((state) => ({ ...state, rewardLabel: event.target.value }))} />
              </div>
            </div>
            {errors.redemption ? <p className="text-sm text-destructive">{errors.redemption}</p> : null}
            <Button onClick={handleRedeemTokens} disabled={pendingSection === 'redemption'} className="w-full">
              {pendingSection === 'redemption' ? 'Redeeming...' : 'Redeem tokens'}
            </Button>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Outstanding swinger stubs</p>
              <div className="mt-3 space-y-3">
                {ownerSwingers.length ? ownerSwingers.map((swinger) => (
                  <div key={swinger.id} className="flex flex-col gap-3 rounded-lg bg-muted p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{swinger.attendeeName}</p>
                      <p className="text-sm text-muted-foreground">{swinger.rewardType} · value {swinger.tokenValue}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        const result = redeemSwinger(swinger.id, false, currentStaff);
                        showToast({ title: result.success ? 'Reward fulfilled' : 'Unable to redeem', description: result.message, variant: result.success ? 'default' : 'destructive' });
                      }}>
                        Fulfil reward
                      </Button>
                      <Button onClick={() => {
                        const result = redeemSwinger(swinger.id, true, currentStaff);
                        showToast({ title: result.success ? 'Swinger converted' : 'Unable to convert', description: result.message, variant: result.success ? 'default' : 'destructive' });
                      }}>
                        Convert to tokens
                      </Button>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No unredeemed swinger records.</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><History className="h-5 w-5 text-primary" /> Wallet balances and recent audit</CardTitle>
          <CardDescription>Operational snapshot of who holds value and which staff actions have taken place.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Wallet balances</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => {
                  const attendee = attendees.find((item) => item.id === wallet.attendeeId);
                  return (
                    <TableRow key={wallet.id}>
                      <TableCell>{attendee?.name ?? 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{attendee?.role ?? 'guest'}</TableCell>
                      <TableCell>{wallet.balance} tokens</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Recent audit events</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.slice(0, 6).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.actorName}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}