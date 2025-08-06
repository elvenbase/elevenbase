import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTrialists, useCreateQuickTrialEvaluation, useUpdateTrialistStatusFromQuickEvaluation } from '@/hooks/useSupabaseData';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { CheckCircle, Users, Award, Plus, Minus, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuickTrialEvaluationProps {
  sessionId?: string;
  children?: React.ReactNode;
}

interface TrialistEvaluation {
  trialist_id: string;
  personality_ratings: number[];
  ability_ratings: number[];
  flexibility_ratings: number[];
  final_decision: 'in_prova' | 'promosso' | 'archiviato';
  notes: string;
}

const QuickTrialEvaluation = ({ sessionId, children }: QuickTrialEvaluationProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTrialists, setSelectedTrialists] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'evaluate' | 'finalize'>('select');
  const [evaluations, setEvaluations] = useState<Record<string, TrialistEvaluation>>({});

  const { data: trialists = [] } = useTrialists();
  const createQuickEvaluation = useCreateQuickTrialEvaluation();
  const updateTrialistStatus = useUpdateTrialistStatusFromQuickEvaluation();
  const { getAvatarBackground } = useAvatarColor();

  // Filtra solo i trialist "in prova"
  const activeTrialists = trialists.filter(t => t.status === 'in_prova');

  const handleTrialistToggle = (trialistId: string) => {
    setSelectedTrialists(prev => 
      prev.includes(trialistId) 
        ? prev.filter(id => id !== trialistId)
        : [...prev, trialistId]
    );
  };

  const handleRatingAdd = (trialistId: string, field: keyof Omit<TrialistEvaluation, 'trialist_id' | 'notes'>, rating: number) => {
    setEvaluations(prev => ({
      ...prev,
      [trialistId]: {
        ...prev[trialistId],
        trialist_id: trialistId,
        [field]: [...(prev[trialistId]?.[field] || []), rating],
        notes: prev[trialistId]?.notes || ''
      }
    }));
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTrialists([]);
    setEvaluations({});
    setCurrentStep('select');
  };

  const getRatingIcon = (rating: number) => {
    if (rating === 1) return <Plus className="h-4 w-4 text-green-500" />;
    if (rating === -1) return <Minus className="h-4 w-4 text-red-500" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const handleDecisionChange = (trialistId: string, decision: 'in_prova' | 'promosso' | 'archiviato') => {
    setEvaluations(prev => ({
      ...prev,
      [trialistId]: {
        ...prev[trialistId],
        trialist_id: trialistId,
        final_decision: decision,
        personality_ratings: prev[trialistId]?.personality_ratings || [],
        ability_ratings: prev[trialistId]?.ability_ratings || [],
        flexibility_ratings: prev[trialistId]?.flexibility_ratings || [],
        notes: prev[trialistId]?.notes || ''
      }
    }));
  };

  const handleNotesChange = (trialistId: string, notes: string) => {
    setEvaluations(prev => ({
      ...prev,
      [trialistId]: {
        ...prev[trialistId],
        trialist_id: trialistId,
        notes,
        personality_ratings: prev[trialistId]?.personality_ratings || [],
        ability_ratings: prev[trialistId]?.ability_ratings || [],
        flexibility_ratings: prev[trialistId]?.flexibility_ratings || [],
        final_decision: prev[trialistId]?.final_decision || 'in_prova'
      }
    }));
  };

  const handleSaveEvaluations = async () => {
    try {
      // Salva tutte le valutazioni
      for (const trialistId of selectedTrialists) {
        const evaluation = evaluations[trialistId];
        if (evaluation) {
          try {
            await createQuickEvaluation.mutateAsync({
              trialist_id: trialistId,
              session_id: sessionId,
              personality_ratings: evaluation.personality_ratings,
              ability_ratings: evaluation.ability_ratings,
              flexibility_ratings: evaluation.flexibility_ratings,
              final_decision: evaluation.final_decision,
              notes: evaluation.notes
            });

            // Aggiorna lo status del trialist se necessario
            if (evaluation.final_decision !== 'in_prova') {
              try {
                await updateTrialistStatus.mutateAsync({
                  trialist_id: trialistId,
                  status: evaluation.final_decision
                });
                console.log(`Status aggiornato per trialist ${trialistId} a ${evaluation.final_decision}`);
              } catch (statusError) {
                console.error('Errore aggiornamento status trialist:', trialistId, statusError);
                // Non mostriamo toast per errori di status, solo log
              }
            }
          } catch (evalError) {
            console.error('Errore salvataggio valutazione per trialist:', trialistId, evalError);
            toast.error(`Errore salvataggio valutazione per trialist ${trialistId}`);
          }
        }
      }

      toast.success('Valutazioni salvate con successo!');
      handleClose();
    } catch (error) {
      toast.error('Errore generale nel salvataggio delle valutazioni');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="space-x-2">
            <Award className="h-4 w-4" />
            <span>Valutazione Provinanti</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Valutazione Rapida Provinanti</span>
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'select' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                Seleziona i provinanti da valutare ({selectedTrialists.length} selezionati)
              </p>
            </div>
              
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTrialists.map((trialist) => (
                <Card
                  key={trialist.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedTrialists.includes(trialist.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleTrialistToggle(trialist.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={trialist.avatar_url || undefined} />
                      <AvatarFallback 
                        className="text-white font-bold"
                        style={getAvatarBackground(trialist.first_name + trialist.last_name)}
                      >
                        {trialist.first_name[0]}{trialist.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {trialist.first_name} {trialist.last_name}
                      </p>
                      {trialist.position && (
                        <Badge variant="secondary" className="text-xs">
                          {trialist.position}
                        </Badge>
                      )}
                    </div>
                    {selectedTrialists.includes(trialist.id) && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {activeTrialists.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun provinante in prova al momento</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button 
                onClick={() => setCurrentStep('evaluate')}
                disabled={selectedTrialists.length === 0}
              >
                Continua ({selectedTrialists.length})
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'evaluate' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                Valuta ogni provinante sui tre criteri principali
              </p>
            </div>

            {selectedTrialists.map((trialistId) => {
              const trialist = activeTrialists.find(t => t.id === trialistId);
              const evaluation = evaluations[trialistId] || {
                trialist_id: trialistId,
                personality_ratings: [],
                ability_ratings: [],
                flexibility_ratings: [],
                final_decision: 'in_prova' as const,
                notes: ''
              };

              // Assicuriamoci che gli array esistano
              const safeEvaluation = {
                ...evaluation,
                personality_ratings: evaluation.personality_ratings || [],
                ability_ratings: evaluation.ability_ratings || [],
                flexibility_ratings: evaluation.flexibility_ratings || [],
                final_decision: evaluation.final_decision || 'in_prova',
                notes: evaluation.notes || ''
              };

              if (!trialist) return null;

              return (
                <Card key={trialistId} className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={trialist.avatar_url || undefined} />
                      <AvatarFallback 
                        className="text-white font-bold"
                        style={getAvatarBackground(trialist.first_name + trialist.last_name)}
                      >
                        {trialist.first_name[0]}{trialist.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {trialist.first_name} {trialist.last_name}
                      </h3>
                      {trialist.position && (
                        <Badge variant="secondary">{trialist.position}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating Criteria */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Personalità</label>
                      <div className="flex space-x-2">
                        {[-1, 0, 1].map((rating) => (
                          <Button
                            key={rating}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRatingAdd(trialistId, 'personality_ratings', rating)}
                          >
                            {getRatingIcon(rating)}
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {safeEvaluation.personality_ratings.map((rating, index) => (
                          <div key={index} className="p-1 bg-muted rounded">
                            {getRatingIcon(rating)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capacità</label>
                      <div className="flex space-x-2">
                        {[-1, 0, 1].map((rating) => (
                          <Button
                            key={rating}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRatingAdd(trialistId, 'ability_ratings', rating)}
                          >
                            {getRatingIcon(rating)}
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {safeEvaluation.ability_ratings.map((rating, index) => (
                          <div key={index} className="p-1 bg-muted rounded">
                            {getRatingIcon(rating)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Flessibilità</label>
                      <div className="flex space-x-2">
                        {[-1, 0, 1].map((rating) => (
                          <Button
                            key={rating}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRatingAdd(trialistId, 'flexibility_ratings', rating)}
                          >
                            {getRatingIcon(rating)}
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {safeEvaluation.flexibility_ratings.map((rating, index) => (
                          <div key={index} className="p-1 bg-muted rounded">
                            {getRatingIcon(rating)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Final Decision */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">Decisione Finale</label>
                    <div className="flex space-x-2">
                      {(['in_prova', 'promosso', 'archiviato'] as const).map((decision) => (
                        <Button
                          key={decision}
                          variant={safeEvaluation.final_decision === decision ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDecisionChange(trialistId, decision)}
                        >
                          {decision === 'promosso' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                          {decision === 'archiviato' && <XCircle className="h-4 w-4 mr-2" />}
                          <span className="capitalize">
                            {decision === 'in_prova' ? 'In Prova' : decision}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Note</label>
                    <textarea
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="Note sulla valutazione..."
                      value={safeEvaluation.notes}
                      onChange={(e) => handleNotesChange(trialistId, e.target.value)}
                      rows={2}
                    />
                  </div>
                </Card>
              );
            })}

            <div className="flex justify-between space-x-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('select')}>
                Indietro
              </Button>
              <Button 
                onClick={handleSaveEvaluations}
                disabled={createQuickEvaluation.isPending || updateTrialistStatus.isPending}
              >
                {createQuickEvaluation.isPending || updateTrialistStatus.isPending 
                  ? 'Salvataggio...' 
                  : 'Salva Valutazioni'
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickTrialEvaluation; 