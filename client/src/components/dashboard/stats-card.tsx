import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  change?: number;
  changeLabel?: string;
  highlight?: string;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  change,
  changeLabel,
  highlight,
  isLoading = false,
}: StatsCardProps) {
  // Determine if change is positive, negative or neutral
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
            )}
          </div>
          <div className={`${iconBgColor} p-3 rounded-full`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        
        {isLoading ? (
          <Skeleton className="mt-4 h-4 w-28" />
        ) : (
          <div className="mt-4 flex items-center">
            {change !== undefined && (
              <span
                className={`flex items-center text-sm font-medium ${
                  isPositive
                    ? "text-green-500"
                    : isNegative
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : isNegative ? (
                  <ArrowDown className="mr-1 h-3 w-3" />
                ) : null}
                {Math.abs(change)}%
              </span>
            )}
            
            {highlight && (
              <span className="text-yellow-500 flex items-center text-sm font-medium ml-2">
                {highlight}
              </span>
            )}
            
            {changeLabel && (
              <span className="text-gray-500 text-sm ml-2">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
