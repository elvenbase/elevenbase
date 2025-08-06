import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { usePlayerEvaluationsCount } from '@/hooks/useSupabaseData';

interface PlayerSessionCounterProps {
  playerId: string;
  className?: string;
}

const PlayerSessionCounter = ({ playerId, className = '' }: PlayerSessionCounterProps) => {
  const { data: sessionCount = 0, isLoading } = usePlayerEvaluationsCount(playerId);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Award className="h-3 w-3 mr-1" />
        ...
      </Badge>
    );
  }

  if (sessionCount === 0) {
    return null; // Non mostrare nulla se non ci sono valutazioni
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs ${className}`}
      title={`${sessionCount} valutazione${sessionCount !== 1 ? 'i' : ''} dal periodo di prova`}
    >
      <Award className="h-3 w-3 mr-1" />
      {sessionCount}
    </Badge>
  );
};

export default PlayerSessionCounter;