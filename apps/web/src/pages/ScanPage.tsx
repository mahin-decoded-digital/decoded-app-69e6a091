import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToastBanner } from '@/components/ToastBanner';
import { useToast } from '@/hooks/use-toast';
import { useRaceQRStore } from '@/stores/raceqr-store';

const heroImage = 'https://images.pexels.com/photos/29996420/pexels-photo-29996420.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function ScanPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const activeAttendeeId = useRaceQRStore((state) => state.activeAttendeeId);
  const attendees = useRaceQRStore((state) => state.attendees);
  const venueQrs = useRaceQRStore((state) => state.venueQrs);
  const scanVenueQr = useRaceQRStore((state) => state.scanVenueQr);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQrId, setSelectedQrId] = useState(venueQrs[0]?.id ?? '');
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeAttendee = attendees.find((item) => item.id === activeAttendeeId) ?? null;

  useEffect(() => {
    if (!isScannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera scanning is not supported on this device. Use manual scan instead.');
      setCameraReady(false);
      return;
    }

    setCameraError('');
    setCameraReady(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraReady(true);
      })
      .catch(() => {
        setCameraError('Camera access was blocked. Enable permissions or use manual scan below.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isScannerOpen]);

  if (!activeAttendeeId) {
    return <Navigate to="/entrance" replace />;
  }

  const resolveQr = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) {
      return venueQrs.find((item) => item.id === selectedQrId) ?? null;
    }
    const normalized = trimmed.toLowerCase();
    return (
      venueQrs.find((item) => item.id === trimmed) ??
      venueQrs.find((item) => item.label.toLowerCase() === normalized) ??
      venueQrs.find((item) => item.location.toLowerCase() === normalized) ??
      null
    );
  };

  const handleScan = async () => {
    setScanError('');
    if (!activeAttendeeId) {
      setScanError('No attendee is active. Complete entrance check-in first.');
      return;
    }
    const qr = resolveQr();
    if (!qr) {
      setScanError('Select a valid QR checkpoint or enter a matching code.');
      return;
    }
    setIsScanning(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const result = scanVenueQr({ attendeeId: activeAttendeeId, qrId: qr.id });
    setIsScanning(false);

    if (result.success) {
      showToast({ title: 'Scan recorded', description: result.message, variant: 'default' });
      setManualCode('');
      setIsScannerOpen(false);
      return;
    }

    showToast({ title: 'Scan blocked', description: result.message, variant: 'destructive' });
  };

  return (
    <div className="space-y-8">
      <ToastBanner toast={toast} />
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#1c2b22] p-8 text-white shadow-sm">
        <img
          src={heroImage}
          alt="Trackside QR scanner"
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c2b22]/95 via-[#1c2b22]/70 to-transparent" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge variant="outline" className="border-white/30 bg-white/10 text-amber-100">RaceQR in-app scanner</Badge>
          <h1 className="text-3xl font-bold">Open the QR scanner to capture venue interactions</h1>
          <p className="text-white/80">
            Use this scanner at the track to record arrivals, enclosure entries, vendor redemptions and exit scans without leaving the RaceQR Wallet experience.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ScanLine className="h-5 w-5 text-primary" /> Launch QR scanner</CardTitle>
            <CardDescription>Use your device camera to scan a QR, or choose a checkpoint manually if needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">Active attendee</p>
              <p className="mt-2 text-muted-foreground">
                {activeAttendee ? `${activeAttendee.name} · ${activeAttendee.role}` : 'No attendee selected.'}
              </p>
            </div>
            <Button onClick={() => setIsScannerOpen(true)} className="w-full">
              <ScanLine className="mr-2 h-4 w-4" />
              Open QR code scanner
            </Button>
            <Button variant="outline" onClick={() => navigate('/entrance')} className="w-full">
              <ArrowRight className="mr-2 h-4 w-4" />
              Switch attendee at entrance
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><QrCode className="h-5 w-5 text-primary" /> Quick manual scan</CardTitle>
            <CardDescription>If the camera is unavailable, record a scan by selecting a QR checkpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-select">QR checkpoint</Label>
              <Select
                id="qr-select"
                value={selectedQrId}
                onChange={(event) => setSelectedQrId(event.target.value)}
              >
                {venueQrs.map((qr) => (
                  <option key={qr.id} value={qr.id}>
                    {qr.label} · {qr.location}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-code">Or enter code</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="Paste a QR code label or ID"
              />
            </div>
            {scanError ? <p className="text-sm text-destructive">{scanError}</p> : null}
            <Button onClick={handleScan} disabled={isScanning} className="w-full">
              {isScanning ? 'Recording scan...' : 'Record manual scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QR scanner</DialogTitle>
            <DialogDescription>Point your device at a RaceQR code to capture the interaction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <video ref={videoRef} className="h-64 w-full object-cover" />
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">Scanner status</p>
              {cameraError ? (
                <p className="text-destructive">{cameraError}</p>
              ) : (
                <p className="text-muted-foreground">{cameraReady ? 'Camera ready. Align the QR inside the frame.' : 'Requesting camera access...'}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="scanner-select">Capture location</Label>
                <Select
                  id="scanner-select"
                  value={selectedQrId}
                  onChange={(event) => setSelectedQrId(event.target.value)}
                >
                  {venueQrs.map((qr) => (
                    <option key={qr.id} value={qr.id}>
                      {qr.label} · {qr.location}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scanner-code">Manual code override</Label>
                <Input
                  id="scanner-code"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="Optional: type code from signage"
                />
              </div>
              {scanError ? <p className="text-destructive">{scanError}</p> : null}
              <Button onClick={handleScan} disabled={isScanning} className="w-full">
                {isScanning ? 'Recording scan...' : 'Confirm scan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}