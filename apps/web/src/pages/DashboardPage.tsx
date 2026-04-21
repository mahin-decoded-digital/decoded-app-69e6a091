import { Download, Users, Activity, ShieldCheck, QrCode, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadCsv, formatDateTime, toCsv } from '@/lib/helpers';
import { useRaceQRStore } from '@/stores/raceqr-store';

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function DashboardPage() {
  const navigate = useNavigate();
  const attendees = useRaceQRStore((state) => state.attendees);
  const wallets = useRaceQRStore((state) => state.wallets);
  const behaviorEvents = useRaceQRStore((state) => state.behaviorEvents);
  const auditLogs = useRaceQRStore((state) => state.auditLogs);
  const swingers = useRaceQRStore((state) => state.swingers);

  const checkedInCount = attendees.filter((item) => item.status === 'checked-in').length;
  const ownerCount = attendees.filter((item) => item.role === 'owner').length;
  const totalTokens = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const recentEvents = behaviorEvents.slice(0, 6);
  const metrics = [
    { label: 'Checked-in attendees', value: checkedInCount, helper: 'Live attendance captured through entrance QR codes.' },
    { label: 'Owner / VIP profiles', value: ownerCount, helper: 'Track owner journeys and hospitality engagement.' },
    { label: 'Outstanding tokens', value: totalTokens, helper: 'Current token liability across all wallets.' },
    { label: 'Open swingers', value: swingers.filter((item) => item.status === 'issued').length, helper: 'Issued but not yet fulfilled or converted.' },
  ];

  const handleExport = () => {
    const csv = toCsv(
      behaviorEvents.map((event) => ({
        attendee: event.attendeeName,
        action: event.actionType,
        qr: event.qrLabel,
        time: formatDateTime(event.timestamp),
        tokenDelta: event.tokenDelta,
        notes: event.notes,
      })),
    );
    downloadCsv('raceqr-behavior-export.csv', csv);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Trackside racing atmosphere"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">
              Trackside operations desk
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Venue intelligence for check-in, rewards and owner engagement</h1>
            <p className="text-base text-white/80">
              RaceQR Wallet gives operators a clean race-day workspace to capture attendance, reward behaviors, manage
              owner swinger redemptions and keep a trusted audit trail from gate to winner's circle.
            </p>
          </div>
          <Button onClick={handleExport} className="w-full bg-amber-200 text-[#1c2b22] hover:bg-amber-100 lg:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export behavior CSV
          </Button>
        </div>
      </section>

      <DashboardMetrics metrics={metrics} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan a venue QR code
          </CardTitle>
          <CardDescription>Open the in-app scanner to record entry points, redemptions and engagement moments.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            The scanner is designed for mobile staff and attendees to capture on-site QR interactions without leaving RaceQR Wallet.
          </div>
          <Button onClick={() => navigate('/scan')} className="w-full md:w-auto">
            <QrCode className="mr-2 h-4 w-4" />
            Open QR scanner
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-primary" />
              Recent behavior timeline
            </CardTitle>
            <CardDescription>Entry, venue scans, redemptions and follow-up signals generated today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.length ? (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{event.attendeeName}</p>
                      <p className="text-sm text-muted-foreground">{event.qrLabel} · {event.notes}</p>
                    </div>
                    <Badge variant={event.tokenDelta > 0 ? 'default' : 'secondary'}>
                      {event.tokenDelta > 0 ? `+${event.tokenDelta} tokens` : event.actionType}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                No event activity has been captured yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Engagement mix
            </CardTitle>
            <CardDescription>Use this quick view to identify where attendees are converting deeper into the venue journey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Entrance scans</span>
                <span className="font-semibold">{behaviorEvents.filter((item) => item.actionType === 'registration' || item.actionType === 'check-in').length}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><ScanLine className="h-4 w-4" /> Venue interactions</span>
                <span className="font-semibold">{behaviorEvents.filter((item) => item.actionType === 'qr-scan').length}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Redemptions</span>
                <span className="font-semibold">{behaviorEvents.filter((item) => item.actionType === 'token-redemption' || item.actionType === 'swinger-redeemed').length}</span>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Follow-up insight</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {ownerCount > 0
                  ? `${ownerCount} owner profiles are already present. Promote stable tours and survey QR codes to convert guests into deeper industry interest.`
                  : 'No owner profiles yet. Encourage secretaries to tag owners at registration for better lounge targeting.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Audit and compliance log</CardTitle>
          <CardDescription>Every staff-authenticated allocation and access decision is captured for trust and reconciliation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length ? (
                auditLogs.slice(0, 8).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.actorName}</TableCell>
                    <TableCell className="capitalize">{log.action.replace('_', ' ')}</TableCell>
                    <TableCell className="capitalize">{log.targetType}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audited staff actions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}