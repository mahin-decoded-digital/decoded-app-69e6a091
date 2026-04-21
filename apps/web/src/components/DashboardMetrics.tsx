import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetric } from '@/types/models';

interface DashboardMetricsProps {
  metrics: DashboardMetric[];
}

export const DashboardMetrics = ({ metrics }: DashboardMetricsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metric.value}</div>
            <p className="mt-1 text-sm text-muted-foreground">{metric.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
