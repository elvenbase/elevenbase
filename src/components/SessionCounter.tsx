import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useQuickTrialEvaluationsCount } from '@/hooks/useSupabaseData';

interface SessionCounterProps {
  trialistId: string;
  className?: string;
}

const SessionCounter = ({ trialistId, className = '' }: SessionCounterProps) => {
  const { data: sessionCount = 0, isLoading } = useQuickTrialEvaluationsCount(trialistId);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Calendar className="h-3 w-3 mr-1" />
        ...
      </Badge>
    );
  }

  return (
    <Badge 
      variant={sessionCount > 0 ? "secondary" : "outline"} 
      className={`text-xs ${className}`}
      title={`${sessionCount} sessione${sessionCount !== 1 ? 'i' : ''} di prova`}
    >
      <Calendar className="h-3 w-3 mr-1" />
      {sessionCount}
    </Badge>
  );
};

export default SessionCounter; 