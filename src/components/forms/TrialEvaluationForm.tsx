import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTrialEvaluation, useTrialEvaluations } from '@/hooks/useSupabaseData';
import { Star, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrialEvaluationFormProps {
  trialistId: string;
  trialistName: string;
  children?: React.ReactNode;
}

export const TrialEvaluationForm = ({ trialistId, trialistName, children }: TrialEvaluationFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    technical_score: '',
    physical_score: '',
    tactical_score: '',
    attitude_score: '',
    notes: '',
    evaluation_date: new Date().toISOString().split('T')[0]
  });

  const createEvaluation = useCreateTrialEvaluation();
  const { data: evaluations = [] } = useTrialEvaluations(trialistId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const evaluationData = {
      trialist_id: trialistId,
      technical_score: formData.technical_score ? parseInt(formData.technical_score) : undefined,
      physical_score: formData.physical_score ? parseInt(formData.physical_score) : undefined,
      tactical_score: formData.tactical_score ? parseInt(formData.tactical_score) : undefined,
      attitude_score: formData.attitude_score ? parseInt(formData.attitude_score) : undefined,
      notes: formData.notes || undefined,
      evaluation_date: formData.evaluation_date
    };

    await createEvaluation.mutateAsync(evaluationData);
    setFormData({
      technical_score: '',
      physical_score: '',
      tactical_score: '',
      attitude_score: '',
      notes: '',
      evaluation_date: new Date().toISOString().split('T')[0]
    });
    setOpen(false);
  };

  const getLatestEvaluation = () => {
    return evaluations[0]; // Already ordered by date desc
  };

  const latestEvaluation = getLatestEvaluation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="space-x-1">
            <Star className="h-3 w-3" />
            <span>Valuta</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Valutazione - {trialistName}</DialogTitle>
        </DialogHeader>

        {latestEvaluation && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Ultima valutazione</span>
              <Badge variant="outline">
                {new Date(latestEvaluation.evaluation_date).toLocaleDateString()}
              </Badge>
            </div>
            {latestEvaluation.overall_rating && (
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="font-bold">{latestEvaluation.overall_rating.toFixed(1)}/5</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(latestEvaluation.overall_rating || 0)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="evaluation_date">Data Valutazione</Label>
            <Input
              id="evaluation_date"
              type="date"
              value={formData.evaluation_date}
              onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="technical_score">Tecnica (1-5)</Label>
              <Input
                id="technical_score"
                type="number"
                min="1"
                max="5"
                value={formData.technical_score}
                onChange={(e) => setFormData({ ...formData, technical_score: e.target.value })}
                placeholder="1-5"
              />
            </div>
            <div>
              <Label htmlFor="physical_score">Fisico (1-5)</Label>
              <Input
                id="physical_score"
                type="number"
                min="1"
                max="5"
                value={formData.physical_score}
                onChange={(e) => setFormData({ ...formData, physical_score: e.target.value })}
                placeholder="1-5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tactical_score">Tattica (1-5)</Label>
              <Input
                id="tactical_score"
                type="number"
                min="1"
                max="5"
                value={formData.tactical_score}
                onChange={(e) => setFormData({ ...formData, tactical_score: e.target.value })}
                placeholder="1-5"
              />
            </div>
            <div>
              <Label htmlFor="attitude_score">Atteggiamento (1-5)</Label>
              <Input
                id="attitude_score"
                type="number"
                min="1"
                max="5"
                value={formData.attitude_score}
                onChange={(e) => setFormData({ ...formData, attitude_score: e.target.value })}
                placeholder="1-5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note sulla valutazione..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createEvaluation.isPending}>
              {createEvaluation.isPending ? 'Salvataggio...' : 'Salva Valutazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};