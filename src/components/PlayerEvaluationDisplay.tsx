import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award } from 'lucide-react';
import { usePlayerEvaluations } from '@/hooks/useSupabaseData';

interface PlayerEvaluationDisplayProps {
  playerId: string;
}

const PlayerEvaluationDisplay = ({ playerId }: PlayerEvaluationDisplayProps) => {
  const { data: evaluations = [], isLoading } = usePlayerEvaluations(playerId);

  const getDecisionBadge = (decision: string) => {
    const config = {
      'in_prova': { label: 'In Prova', variant: 'secondary' as const },
      'promosso': { label: 'Promosso', variant: 'default' as const },
      'archiviato': { label: 'Archiviato', variant: 'outline' as const }
    };

    const decisionConfig = config[decision as keyof typeof config] ||
      { label: decision, variant: 'outline' as const };

    return <Badge variant={decisionConfig.variant} className="text-xs">{decisionConfig.label}</Badge>;
  };

  const getRatingSummary = (ratings: number[]) => {
    const positive = (ratings || []).filter(r => r === 1).length;
    const negative = (ratings || []).filter(r => r === -1).length;
    const neutral = (ratings || []).filter(r => r === 0).length;
    return { positive, negative, neutral };
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento valutazioni...</div>;
  }

  if (evaluations.length === 0) {
    return <div className="text-sm text-muted-foreground">Nessuna valutazione dal periodo di prova</div>;
  }

  return (
    <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2">
      {evaluations.map((evaluation) => {
        const personalitySummary = getRatingSummary(evaluation.personality_ratings);
        const abilitySummary = getRatingSummary(evaluation.ability_ratings);
        const flexibilitySummary = getRatingSummary(evaluation.flexibility_ratings);

        return (
          <Card key={evaluation.id} className="text-xs p-3 lg:p-2">
            <div className="flex items-center justify-between mb-2 lg:mb-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {new Date(evaluation.evaluation_date).toLocaleDateString('it-IT')}
                </span>
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Dal periodo di prova</span>
              </div>
              <div className="flex items-center space-x-2">
                {evaluation.final_decision && getDecisionBadge(evaluation.final_decision)}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2 lg:mb-1">
              <div className="flex items-center space-x-4 lg:space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">P:</span>
                  {personalitySummary.positive > 0 && (
                    <span className="text-xs font-bold text-green-600">+{personalitySummary.positive}</span>
                  )}
                  {personalitySummary.negative > 0 && (
                    <span className="text-xs font-bold text-red-600">-{personalitySummary.negative}</span>
                  )}
                  {personalitySummary.neutral > 0 && (
                    <span className="text-xs font-bold text-gray-500">○{personalitySummary.neutral}</span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">C:</span>
                  {abilitySummary.positive > 0 && (
                    <span className="text-xs font-bold text-green-600">+{abilitySummary.positive}</span>
                  )}
                  {abilitySummary.negative > 0 && (
                    <span className="text-xs font-bold text-red-600">-{abilitySummary.negative}</span>
                  )}
                  {abilitySummary.neutral > 0 && (
                    <span className="text-xs font-bold text-gray-500">○{abilitySummary.neutral}</span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">F:</span>
                  {flexibilitySummary.positive > 0 && (
                    <span className="text-xs font-bold text-green-600">+{flexibilitySummary.positive}</span>
                  )}
                  {flexibilitySummary.negative > 0 && (
                    <span className="text-xs font-bold text-red-600">-{flexibilitySummary.negative}</span>
                  )}
                  {flexibilitySummary.neutral > 0 && (
                    <span className="text-xs font-bold text-gray-500">○{flexibilitySummary.neutral}</span>
                  )}
                </div>
              </div>
            </div>

            {evaluation.notes && (
              <div className="mt-2 p-2 bg-muted rounded text-xs lg:mt-1 lg:p-1">
                <div className="font-medium mb-1 lg:mb-0.5">Note:</div>
                <div>{evaluation.notes}</div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default PlayerEvaluationDisplay;