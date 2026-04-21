import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {Wallet, Clock3, ListChecks, UserCircle} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/helpers';
import { useRaceQRStore } from '@/stores/raceqr-store';

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function WalletPage() {
  const activeAttendeeId = useRaceQRStore((state) => state.activeAttendeeId);
  const getAttendeeById = useRaceQRStore((state) => state.getAttendeeById);
  const getWalletByAttendeeId = useRaceQRStore((state) => state.getWalletByAttendeeId);
  const swingers = useRaceQRStore((state) => state.swingers);

  if (!activeAttendeeId) {
    return <Navigate to="/entrance" replace />;
  }

  const attendee = getAttendeeById(activeAttendeeId);
  const wallet = getWalletByAttendeeId(activeAttendeeId);

  if (!attendee || !wallet) {
    return <Navigate to="/entrance" replace />;
  }

  const attendeeSwingers = useMemo(
    () => swingers.filter((item) => item.attendeeId === attendee.id),
    [swingers, attendee.id],
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Race day hospitality"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">Digital attendee wallet</Badge>
          <h1 className="text-3xl font-bold">Reward balance and event journey at a glance</h1>
          <p className="text-white/80">
            Each registered attendee receives a lightweight digital wallet showing live token balance, redemption history and
            any owner swinger records linked to their race-day experience.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><UserCircle className="h-5 w-5 text-primary" /> Wallet holder</CardTitle>
            <CardDescription>Minimal attendee identity, role and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-semibold text-foreground">{attendee.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-semibold capitalize text-foreground">{attendee.role}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-in status</p>
              <Badge variant={attendee.status === 'checked-in' ? 'default' : 'secondary'}>{attendee.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Wallet className="h-5 w-5 text-primary" /> Token balance</CardTitle>
            <CardDescription>Use tokens at vendor QR points or collect them from staff and venue actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{wallet.balance}</p>
            <p className="mt-2 text-sm text-muted-foreground">Each token is currently valued at £{wallet.tokenValue.toFixed(2)} for operator reconciliation.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ListChecks className="h-5 w-5 text-primary" /> Owner swinger status</CardTitle>
            <CardDescription>Issued by secretaries, redeemable by vendors or convertible into tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendeeSwingers.length ? (
              <div className="space-y-3">
                {attendeeSwingers.map((swinger) => (
                  <div key={swinger.id} className="rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium capitalize">{swinger.rewardType} swinger</span>
                      <Badge variant={swinger.status === 'issued' ? 'secondary' : 'outline'}>{swinger.status}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">Potential token value: {swinger.tokenValue}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No swinger records linked to this attendee yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Clock3 className="h-5 w-5 text-primary" /> Wallet transaction history</CardTitle>
          <CardDescription>Full credit, conversion and redemption history for trust and visitor transparency.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.history.length ? (
                wallet.history.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                    <TableCell>{transaction.source}</TableCell>
                    <TableCell className="capitalize">{transaction.type}</TableCell>
                    <TableCell>{transaction.type === 'debit' ? `-${transaction.amount}` : `+${transaction.amount}`}</TableCell>
                    <TableCell>{transaction.note}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}