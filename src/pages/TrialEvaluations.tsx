import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Minus, Circle, Save, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrialists, useCreateQuickTrialEvaluation, useUpdateTrialistStatusFromQuickEvaluation } from '@/hooks/useSupabaseData';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { toast } from 'sonner';

const TrialEvaluations = () => {
  const navigate = useNavigate();
  const { data: trialists = [] } = useTrialists();
  const createEvaluation = useCreateQuickTrialEvaluation();
  const updateTrialistStatus = useUpdateTrialistStatusFromQuickEvaluation();
  const { getAvatarBackground } = useAvatarColor();

  // Filtra solo i trialists "in_prova"
  const activeTrialists = trialists.filter(t => t.status === 'in_prova');

  const [currentStep, setCurrentStep] = useState<'select' | 'evaluate' | 'decide'>('select');
  const [selectedTrialists, setSelectedTrialists] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, {
    personality_ratings: number[];
    ability_ratings: number[];
    flexibility_ratings: number[];
    notes: string;
  }>>({});
  const [finalDecisions, setFinalDecisions] = useState<Record<string, 'in_prova' | 'promosso' | 'archiviato'>>({});

  const toggleTrialistSelection = (trialistId: string) => {
    setSelectedTrialists(prev => 
      prev.includes(trialistId) 
        ? prev.filter(id => id !== trialistId)
        : [...prev, trialistId]
    );
  };

  const addRating = (trialistId: string, category: 'personality' | 'ability' | 'flexibility', rating: number) => {
    setEvaluations(prev => ({
      ...prev,
      [trialistId]: {
        ...prev[trialistId] || { personality_ratings: [], ability_ratings: [], flexibility_ratings: [], notes: '' },
        [`${category}_ratings`]: [
          ...(prev[trialistId]?.[`${category}_ratings`] || []),
          rating
        ]
      }
    }));
  };

  const updateNotes = (trialistId: string, notes: string) => {
    setEvaluations(prev => ({
      ...prev,
      [trialistId]: {
        ...prev[trialistId] || { personality_ratings: [], ability_ratings: [], flexibility_ratings: [], notes: '' },
        notes
      }
    }));
  };

  const getRatingCounts = (ratings: number[]) => {
    const positive = ratings.filter(r => r === 1).length;
    const negative = ratings.filter(r => r === -1).length;
    const neutral = ratings.filter(r => r === 0).length;
    return { positive, negative, neutral };
  };

  const proceedToEvaluation = () => {
    if (selectedTrialists.length === 0) {
      toast.error('Seleziona almeno un trialist per procedere');
      return;
    }
    setCurrentStep('evaluate');
  };

  const proceedToDecision = () => {
    setCurrentStep('decide');
    // Inizializza le decisioni finali
    const decisions: Record<string, 'in_prova' | 'promosso' | 'archiviato'> = {};
    selectedTrialists.forEach(id => {
      decisions[id] = 'in_prova';
    });
    setFinalDecisions(decisions);
  };

  const saveEvaluations = async () => {
    try {
      // Salva le valutazioni
      for (const trialistId of selectedTrialists) {
        const evaluation = evaluations[trialistId];
        if (evaluation) {
          await createEvaluation.mutateAsync({
            trialist_id: trialistId,
            personality_ratings: evaluation.personality_ratings,
            ability_ratings: evaluation.ability_ratings,
            flexibility_ratings: evaluation.flexibility_ratings,
            final_decision: finalDecisions[trialistId] || 'in_prova',
            notes: evaluation.notes || null
          });
        }

        // Aggiorna lo status se diverso da "in_prova"
        const finalDecision = finalDecisions[trialistId];
        if (finalDecision && finalDecision !== 'in_prova') {
          try {
            await updateTrialistStatus.mutateAsync({
              trialist_id: trialistId,
              status: finalDecision
            });
          } catch (error) {
            console.error(`Errore aggiornamento status per ${trialistId}:`, error);
          }
        }
      }

      toast.success('Valutazioni salvate con successo!');
      navigate('/trials');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast.error('Errore nel salvataggio delle valutazioni');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/trials')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Trials
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Valutazione Provinanti</h1>
              <p className="text-sm text-muted-foreground">
                {currentStep === 'select' && 'Seleziona i provinanti da valutare'}
                {currentStep === 'evaluate' && 'Assegna valutazioni durante la sessione'}
                {currentStep === 'decide' && 'Decisioni finali per ogni provinante'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">Selezione</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'evaluate' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'evaluate' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">Valutazione</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'decide' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'decide' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">Decisioni</span>
            </div>
          </div>
        </div>

        {/* Step 1: Selection */}
        {currentStep === 'select' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Provinanti</CardTitle>
              </CardHeader>
              <CardContent>
                {activeTrialists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessun provinante "in prova" disponibile
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeTrialists.map((trialist) => (
                      <Card 
                        key={trialist.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTrialists.includes(trialist.id) 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTrialistSelection(trialist.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={trialist.avatar_url || undefined} />
                              <AvatarFallback 
                                className="font-bold text-white"
                                style={getAvatarBackground(trialist.first_name + trialist.last_name, false)}
                              >
                                {trialist.first_name.charAt(0)}{trialist.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {trialist.first_name} {trialist.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {trialist.position || 'Posizione non specificata'}
                              </p>
                            </div>
                            {selectedTrialists.includes(trialist.id) && (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTrialists.length > 0 && (
              <div className="flex justify-center">
                <Button onClick={proceedToEvaluation} size="lg">
                  Procedi con {selectedTrialists.length} provinante{selectedTrialists.length !== 1 ? 'i' : ''}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Evaluation */}
        {currentStep === 'evaluate' && (
          <div className="space-y-6">
            {selectedTrialists.map((trialistId) => {
              const trialist = trialists.find(t => t.id === trialistId);
              if (!trialist) return null;

              const evaluation = evaluations[trialistId] || { personality_ratings: [], ability_ratings: [], flexibility_ratings: [], notes: '' };
              const personalityCounts = getRatingCounts(evaluation.personality_ratings);
              const abilityCounts = getRatingCounts(evaluation.ability_ratings);
              const flexibilityCounts = getRatingCounts(evaluation.flexibility_ratings);

              return (
                <Card key={trialistId}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={trialist.avatar_url || undefined} />
                        <AvatarFallback 
                          className="font-bold text-white"
                          style={getAvatarBackground(trialist.first_name + trialist.last_name, false)}
                        >
                          {trialist.first_name.charAt(0)}{trialist.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{trialist.first_name} {trialist.last_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{trialist.position}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personality */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Personalità</h4>
                        <div className="flex items-center space-x-2">
                          {personalityCounts.positive > 0 && <Badge variant="default" className="bg-green-600">+{personalityCounts.positive}</Badge>}
                          {personalityCounts.negative > 0 && <Badge variant="destructive">-{personalityCounts.negative}</Badge>}
                          {personalityCounts.neutral > 0 && <Badge variant="secondary">○{personalityCounts.neutral}</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-green-50 hover:bg-green-100 border-green-200"
                          onClick={() => addRating(trialistId, 'personality', 1)}
                        >
                          <Plus className="h-6 w-6 text-green-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-gray-50 hover:bg-gray-100 border-gray-200"
                          onClick={() => addRating(trialistId, 'personality', 0)}
                        >
                          <Circle className="h-6 w-6 text-gray-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-red-50 hover:bg-red-100 border-red-200"
                          onClick={() => addRating(trialistId, 'personality', -1)}
                        >
                          <Minus className="h-6 w-6 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Ability */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Capacità</h4>
                        <div className="flex items-center space-x-2">
                          {abilityCounts.positive > 0 && <Badge variant="default" className="bg-green-600">+{abilityCounts.positive}</Badge>}
                          {abilityCounts.negative > 0 && <Badge variant="destructive">-{abilityCounts.negative}</Badge>}
                          {abilityCounts.neutral > 0 && <Badge variant="secondary">○{abilityCounts.neutral}</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-green-50 hover:bg-green-100 border-green-200"
                          onClick={() => addRating(trialistId, 'ability', 1)}
                        >
                          <Plus className="h-6 w-6 text-green-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-gray-50 hover:bg-gray-100 border-gray-200"
                          onClick={() => addRating(trialistId, 'ability', 0)}
                        >
                          <Circle className="h-6 w-6 text-gray-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-red-50 hover:bg-red-100 border-red-200"
                          onClick={() => addRating(trialistId, 'ability', -1)}
                        >
                          <Minus className="h-6 w-6 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Flexibility */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Flessibilità</h4>
                        <div className="flex items-center space-x-2">
                          {flexibilityCounts.positive > 0 && <Badge variant="default" className="bg-green-600">+{flexibilityCounts.positive}</Badge>}
                          {flexibilityCounts.negative > 0 && <Badge variant="destructive">-{flexibilityCounts.negative}</Badge>}
                          {flexibilityCounts.neutral > 0 && <Badge variant="secondary">○{flexibilityCounts.neutral}</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-green-50 hover:bg-green-100 border-green-200"
                          onClick={() => addRating(trialistId, 'flexibility', 1)}
                        >
                          <Plus className="h-6 w-6 text-green-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-gray-50 hover:bg-gray-100 border-gray-200"
                          onClick={() => addRating(trialistId, 'flexibility', 0)}
                        >
                          <Circle className="h-6 w-6 text-gray-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="flex-1 h-16 bg-red-50 hover:bg-red-100 border-red-200"
                          onClick={() => addRating(trialistId, 'flexibility', -1)}
                        >
                          <Minus className="h-6 w-6 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="font-medium mb-3">Note</h4>
                      <Textarea
                        placeholder="Aggiungi note per questo provinante..."
                        value={evaluation.notes}
                        onChange={(e) => updateNotes(trialistId, e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep('select')}>
                Indietro
              </Button>
              <Button onClick={proceedToDecision}>
                Procedi alle Decisioni
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Final Decisions */}
        {currentStep === 'decide' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Decisioni Finali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTrialists.map((trialistId) => {
                  const trialist = trialists.find(t => t.id === trialistId);
                  if (!trialist) return null;

                  return (
                    <div key={trialistId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={trialist.avatar_url || undefined} />
                          <AvatarFallback 
                            className="font-bold text-white"
                            style={getAvatarBackground(trialist.first_name + trialist.last_name, false)}
                          >
                            {trialist.first_name.charAt(0)}{trialist.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{trialist.first_name} {trialist.last_name}</h4>
                          <p className="text-sm text-muted-foreground">{trialist.position}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={finalDecisions[trialistId] === 'in_prova' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'in_prova' }))}
                        >
                          In Prova
                        </Button>
                        <Button
                          variant={finalDecisions[trialistId] === 'promosso' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'promosso' }))}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Promosso
                        </Button>
                        <Button
                          variant={finalDecisions[trialistId] === 'archiviato' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'archiviato' }))}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Archiviato
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep('evaluate')}>
                Indietro
              </Button>
              <Button 
                onClick={saveEvaluations} 
                disabled={createEvaluation.isPending || updateTrialistStatus.isPending}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {createEvaluation.isPending ? 'Salvataggio...' : 'Salva Valutazioni'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialEvaluations;