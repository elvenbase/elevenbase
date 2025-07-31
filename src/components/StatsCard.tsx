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
    <Card className={`p-6 bg-card border-border hover:shadow-glow transition-smooth ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-sm text-muted-foreground">dal mese scorso</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;