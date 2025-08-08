import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Minus, Circle, Save, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrialists, useCreateQuickTrialEvaluation, useUpdateTrialistStatusFromQuickEvaluation } from '@/hooks/useSupabaseData';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { toast } from 'sonner';

const TrialEvaluations = () => {
  const navigate = useNavigate();
  const { data: trialists = [] } = useTrialists();
  const createEvaluation = useCreateQuickTrialEvaluation();
  const updateTrialistStatus = useUpdateTrialistStatusFromQuickEvaluation();
  const { getAvatarBackground, getAvatarFallbackStyle } = useAvatarColor();

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
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

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

        {/* Progress Steps - Mobile Optimized */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Selezione</span>
              <span className="text-xs font-medium sm:hidden">Sel.</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-border"></div>
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'evaluate' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'evaluate' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Valutazione</span>
              <span className="text-xs font-medium sm:hidden">Val.</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-border"></div>
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'decide' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'decide' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Decisioni</span>
              <span className="text-xs font-medium sm:hidden">Dec.</span>
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
                                className="font-bold"
                                style={getAvatarFallbackStyle(trialist.first_name + trialist.last_name, !!trialist.avatar_url)}
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
          <div className="space-y-3">
            {selectedTrialists.map((trialistId) => {
              const trialist = trialists.find(t => t.id === trialistId);
              if (!trialist) return null;

              const evaluation = evaluations[trialistId] || { personality_ratings: [], ability_ratings: [], flexibility_ratings: [], notes: '' };
              const personalityCounts = getRatingCounts(evaluation.personality_ratings);
              const abilityCounts = getRatingCounts(evaluation.ability_ratings);
              const flexibilityCounts = getRatingCounts(evaluation.flexibility_ratings);

              return (
                <Card key={trialistId} className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={trialist.avatar_url || undefined} />
                        <AvatarFallback 
                          className="font-bold text-xs"
                          style={getAvatarFallbackStyle(trialist.first_name + trialist.last_name, !!trialist.avatar_url)}
                        >
                          {trialist.first_name.charAt(0)}{trialist.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{trialist.first_name} {trialist.last_name}</h4>
                        <p className="text-xs text-muted-foreground">{trialist.position}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Personality Column */}
                  <div className="text-center">
                    <h5 className="font-medium text-xs mb-1">Personalità</h5>
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-green-50 hover:bg-green-100 border-green-200 p-1"
                        onClick={() => addRating(trialistId, 'personality', 1)}
                      >
                        <Plus className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-red-50 hover:bg-red-100 border-red-200 p-1"
                        onClick={() => addRating(trialistId, 'personality', -1)}
                      >
                        <Minus className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Ability Column */}
                  <div className="text-center">
                    <h5 className="font-medium text-xs mb-1">Capacità</h5>
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-green-50 hover:bg-green-100 border-green-200 p-1"
                        onClick={() => addRating(trialistId, 'ability', 1)}
                      >
                        <Plus className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-red-50 hover:bg-red-100 border-red-200 p-1"
                        onClick={() => addRating(trialistId, 'ability', -1)}
                      >
                        <Minus className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Flexibility Column */}
                  <div className="text-center">
                    <h5 className="font-medium text-xs mb-1">Flessibilità</h5>
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-green-50 hover:bg-green-100 border-green-200 p-1"
                        onClick={() => addRating(trialistId, 'flexibility', 1)}
                      >
                        <Plus className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 bg-red-50 hover:bg-red-100 border-red-200 p-1"
                        onClick={() => addRating(trialistId, 'flexibility', -1)}
                      >
                        <Minus className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Toggle per mostrare valutazioni dettagliate */}
                <div className="mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-6 text-muted-foreground"
                    onClick={() => {
                      setShowDetails(prev => ({
                        ...prev,
                        [trialistId]: !prev[trialistId]
                      }));
                    }}
                  >
                    {showDetails[trialistId] ? 'Nascondi Dettagli' : 'Mostra Dettagli'} 
                    {showDetails[trialistId] ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                </div>

                {/* Dettagli valutazioni e note (collassabile) */}
                {showDetails[trialistId] && (
                  <div className="space-y-3 p-3 bg-muted/20 rounded-md">
                    {/* Riepilogo valutazioni */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Personalità:</span>
                        <div className="flex items-center space-x-1">
                          {personalityCounts.positive > 0 && <Badge variant="default" className="bg-green-600 text-xs px-1 py-0">+{personalityCounts.positive}</Badge>}
                          {personalityCounts.negative > 0 && <Badge variant="destructive" className="text-xs px-1 py-0">-{personalityCounts.negative}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Capacità:</span>
                        <div className="flex items-center space-x-1">
                          {abilityCounts.positive > 0 && <Badge variant="default" className="bg-green-600 text-xs px-1 py-0">+{abilityCounts.positive}</Badge>}
                          {abilityCounts.negative > 0 && <Badge variant="destructive" className="text-xs px-1 py-0">-{abilityCounts.negative}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Flessibilità:</span>
                        <div className="flex items-center space-x-1">
                          {flexibilityCounts.positive > 0 && <Badge variant="default" className="bg-green-600 text-xs px-1 py-0">+{flexibilityCounts.positive}</Badge>}
                          {flexibilityCounts.negative > 0 && <Badge variant="destructive" className="text-xs px-1 py-0">-{flexibilityCounts.negative}</Badge>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Note */}
                    <div>
                      <h5 className="font-medium text-xs mb-2">Note</h5>
                      <Textarea
                        placeholder="Aggiungi note..."
                        value={evaluation.notes}
                        onChange={(e) => updateNotes(trialistId, e.target.value)}
                        rows={2}
                        style={{ fontSize: '16px' }}
                        className="text-base"
                      />
                    </div>
                  </div>
                )}
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
                            className="font-bold"
                            style={getAvatarFallbackStyle(trialist.first_name + trialist.last_name, !!trialist.avatar_url)}
                          >
                            {trialist.first_name.charAt(0)}{trialist.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{trialist.first_name} {trialist.last_name}</h4>
                          <p className="text-sm text-muted-foreground">{trialist.position}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'in_prova' }))}
                          className={`text-xs flex-1 ${
                            finalDecisions[trialistId] === 'in_prova' 
                              ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600' 
                              : 'hover:bg-yellow-50'
                          }`}
                        >
                          In Prova
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'promosso' }))}
                          className={`text-xs flex-1 ${
                            finalDecisions[trialistId] === 'promosso' 
                              ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                              : 'hover:bg-green-50'
                          }`}
                        >
                          Promosso
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFinalDecisions(prev => ({ ...prev, [trialistId]: 'archiviato' }))}
                          className={`text-xs flex-1 ${
                            finalDecisions[trialistId] === 'archiviato' 
                              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                              : 'hover:bg-red-50'
                          }`}
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