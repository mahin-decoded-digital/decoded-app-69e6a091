import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><SearchX className="h-6 w-6 text-primary" /> Page not found</CardTitle>
          <CardDescription>The route you requested is not part of the RaceQR operational workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Return to the dashboard to continue managing event arrivals, wallet rewards, QR checkpoints and staff actions.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
