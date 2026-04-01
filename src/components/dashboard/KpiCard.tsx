/**
 * KpiCard — A compact metric tile showing a label, value, and optional trend.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number | string;
  change?: number;
  icon?: LucideIcon;
  loading?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, change, icon: Icon, loading, onClick }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("transition-colors", onClick && "cursor-pointer hover:bg-accent")}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {change != null && change !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                change > 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
