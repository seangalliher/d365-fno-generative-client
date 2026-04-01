/**
 * ChartCard — A titled card wrapper for recharts visualizations.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, loading, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
