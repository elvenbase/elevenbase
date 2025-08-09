import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, description, icon: Icon, trend, className }: StatsCardProps) => {
  return (
    <Card className={`p-3 sm:p-6 bg-card border-border hover:shadow-glow transition-smooth ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-foreground whitespace-nowrap truncate" title={String(value)}>{value}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
          )}
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`text-xs sm:text-sm font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">dal mese scorso</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-primary rounded-xl shadow-glow">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;