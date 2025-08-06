import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Minus, Plus } from 'lucide-react';
import { useQuickTrialEvaluations } from '@/hooks/useSupabaseData';

interface QuickEvaluationDisplayProps {
  trialistId: string;
}

const QuickEvaluationDisplay = ({ trialistId }: QuickEvaluationDisplayProps) => {
  const { data: evaluations = [], isLoading } = useQuickTrialEvaluations(trialistId);

  const getRatingIcon = (rating: number) => {
    if (rating === 1) return <Plus className="h-3 w-3 text-green-600" />;
    if (rating === -1) return <Minus className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

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

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento valutazioni...</div>;
  }

  if (evaluations.length === 0) {
    return <div className="text-sm text-muted-foreground">Nessuna valutazione rapida</div>;
  }

  return (
    <div className="space-y-2">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="text-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">
                  {new Date(evaluation.evaluation_date).toLocaleDateString('it-IT')}
                </span>
              </div>
              {evaluation.final_decision && getDecisionBadge(evaluation.final_decision)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <div className="font-medium text-xs mb-1">Personalità</div>
                <div className="flex space-x-1">
                  {(evaluation.personality_ratings || []).map((rating, index) => (
                    <div key={index}>{getRatingIcon(rating)}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium text-xs mb-1">Capacità</div>
                <div className="flex space-x-1">
                  {(evaluation.ability_ratings || []).map((rating, index) => (
                    <div key={index}>{getRatingIcon(rating)}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium text-xs mb-1">Flessibilità</div>
                <div className="flex space-x-1">
                  {(evaluation.flexibility_ratings || []).map((rating, index) => (
                    <div key={index}>{getRatingIcon(rating)}</div>
                  ))}
                </div>
              </div>
            </div>
            {evaluation.notes && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <div className="font-medium mb-1">Note:</div>
                <div>{evaluation.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickEvaluationDisplay; 