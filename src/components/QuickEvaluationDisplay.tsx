import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Minus, Plus, Trash2 } from 'lucide-react';
import { useQuickTrialEvaluations, useDeleteQuickTrialEvaluation } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface QuickEvaluationDisplayProps {
  trialistId: string;
}

const QuickEvaluationDisplay = ({ trialistId }: QuickEvaluationDisplayProps) => {
  const { data: evaluations = [], isLoading } = useQuickTrialEvaluations(trialistId);
  const deleteEvaluation = useDeleteQuickTrialEvaluation();

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

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      await deleteEvaluation.mutateAsync(evaluationId);
      toast.success('Valutazione eliminata con successo');
    } catch (error) {
      toast.error('Errore nell\'eliminazione della valutazione');
      console.error(error);
    }
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
    return <div className="text-sm text-muted-foreground">Nessuna valutazione rapida</div>;
  }

  return (
    <div className="space-y-2">
      {evaluations.map((evaluation) => {
        const personalitySummary = getRatingSummary(evaluation.personality_ratings);
        const abilitySummary = getRatingSummary(evaluation.ability_ratings);
        const flexibilitySummary = getRatingSummary(evaluation.flexibility_ratings);
        
        return (
          <Card key={evaluation.id} className="text-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {new Date(evaluation.evaluation_date).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {evaluation.final_decision && getDecisionBadge(evaluation.final_decision)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvaluation(evaluation.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Elimina valutazione"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Visualizzazione compatta dei rating */}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Personalità</div>
                  <div className="flex justify-center space-x-1">
                    {personalitySummary.positive > 0 && (
                      <Badge variant="default" className="text-xs px-1 py-0 h-4">
                        +{personalitySummary.positive}
                      </Badge>
                    )}
                    {personalitySummary.negative > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                        -{personalitySummary.negative}
                      </Badge>
                    )}
                    {personalitySummary.neutral > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                        ○{personalitySummary.neutral}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Capacità</div>
                  <div className="flex justify-center space-x-1">
                    {abilitySummary.positive > 0 && (
                      <Badge variant="default" className="text-xs px-1 py-0 h-4">
                        +{abilitySummary.positive}
                      </Badge>
                    )}
                    {abilitySummary.negative > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                        -{abilitySummary.negative}
                      </Badge>
                    )}
                    {abilitySummary.neutral > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                        ○{abilitySummary.neutral}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Flessibilità</div>
                  <div className="flex justify-center space-x-1">
                    {flexibilitySummary.positive > 0 && (
                      <Badge variant="default" className="text-xs px-1 py-0 h-4">
                        +{flexibilitySummary.positive}
                      </Badge>
                    )}
                    {flexibilitySummary.negative > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                        -{flexibilitySummary.negative}
                      </Badge>
                    )}
                    {flexibilitySummary.neutral > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                        ○{flexibilitySummary.neutral}
                      </Badge>
                    )}
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
        );
      })}
    </div>
  );
};

export default QuickEvaluationDisplay; 