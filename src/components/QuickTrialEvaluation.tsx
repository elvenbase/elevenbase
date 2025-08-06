import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTrialists } from '@/hooks/useSupabaseData';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { CheckCircle, Users, Award } from 'lucide-react';

interface QuickTrialEvaluationProps {
  sessionId?: string;
  children?: React.ReactNode;
}

const QuickTrialEvaluation = ({ sessionId, children }: QuickTrialEvaluationProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTrialists, setSelectedTrialists] = useState<string[]>([]);

  const { data: trialists = [] } = useTrialists();
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

  const handleClose = () => {
    setOpen(false);
    setSelectedTrialists([]);
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
              onClick={() => {
                console.log('Provini selezionati:', selectedTrialists);
                // TODO: Prossimo step - valutazione
                handleClose();
              }}
              disabled={selectedTrialists.length === 0}
            >
              Continua ({selectedTrialists.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTrialEvaluation; 