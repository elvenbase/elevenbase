import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTrialists, useUpdateTrialistStatus, useDeleteTrialist, useTrialEvaluations } from '@/hooks/useSupabaseData';
import { User, Star, ArrowRight, Archive, Trash2, Award } from 'lucide-react';
import EditTrialistForm from '@/components/forms/EditTrialistForm';
import { TrialEvaluationForm } from '@/components/forms/TrialEvaluationForm';

// Separate component for trialist cards
const TrialistCard = ({ 
  trialist, 
  columnId, 
  onDragStart, 
  onStatusChange, 
  onDelete 
}: {
  trialist: any;
  columnId: string;
  onDragStart: (e: React.DragEvent, trialist: any) => void;
  onStatusChange: (id: string, status: 'in_prova' | 'promosso' | 'archiviato') => void;
  onDelete: (id: string) => void;
}) => {
  const { data: evaluations = [] } = useTrialEvaluations(trialist.id);
  const latestEvaluation = evaluations[0];

  return (
    <Card
      className="p-4 bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart(e, trialist)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={trialist.avatar_url || undefined} 
              alt={`${trialist.first_name} ${trialist.last_name}`} 
            />
            <AvatarFallback>
              {trialist.first_name[0]}{trialist.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {trialist.first_name} {trialist.last_name}
            </p>
            {trialist.position && (
              <Badge variant="secondary" className="text-xs">
                {trialist.position}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <TrialEvaluationForm 
            trialistId={trialist.id}
            trialistName={`${trialist.first_name} ${trialist.last_name}`}
          >
            <Button variant="outline" size="sm" className="p-1 h-6 w-6">
              <Star className="h-3 w-3 text-primary" />
            </Button>
          </TrialEvaluationForm>
          <EditTrialistForm trialist={trialist} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(trialist.id)}
            className="p-1 h-6 w-6"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>

      {latestEvaluation && (
        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">Valutazione</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold">{latestEvaluation.overall_rating?.toFixed(1)}/5</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-2 w-2 ${
                    star <= Math.round(latestEvaluation.overall_rating || 0)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(latestEvaluation.evaluation_date).toLocaleDateString()}
          </span>
        </div>
      )}

      {trialist.notes && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {trialist.notes}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Inizio: {new Date(trialist.trial_start_date).toLocaleDateString()}
        </span>
        {trialist.email && (
          <span>{trialist.email}</span>
        )}
      </div>

      <div className="flex items-center space-x-1 mt-3">
        {columnId === 'in_prova' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onStatusChange(trialist.id, 'promosso')}
            >
              <Star className="h-3 w-3 mr-1" />
              Promuovi
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onStatusChange(trialist.id, 'archiviato')}
            >
              <Archive className="h-3 w-3 mr-1" />
              Archivia
            </Button>
          </>
        )}
        {columnId === 'promosso' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onStatusChange(trialist.id, 'in_prova')}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Riporta in prova
          </Button>
        )}
        {columnId === 'archiviato' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onStatusChange(trialist.id, 'in_prova')}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Riattiva
          </Button>
        )}
      </div>
    </Card>
  );
};

const TrialsKanban = () => {
  const { data: trialists = [], isLoading } = useTrialists();
  const updateTrialistStatus = useUpdateTrialistStatus();
  const deleteTrialist = useDeleteTrialist();
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const columns = [
    {
      id: 'in_prova',
      title: 'In Prova',
      color: 'bg-warning/10 border-warning/20',
      titleColor: 'text-warning',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'promosso',
      title: 'Promossi',
      color: 'bg-success/10 border-success/20',
      titleColor: 'text-success',
      icon: <Star className="h-4 w-4" />
    },
    {
      id: 'archiviato',
      title: 'Archiviati',
      color: 'bg-muted/50 border-border',
      titleColor: 'text-muted-foreground',
      icon: <Archive className="h-4 w-4" />
    }
  ];

  const getTrialistsByStatus = (status: string) => {
    return trialists.filter(trialist => trialist.status === status);
  };

  const handleDragStart = (e: React.DragEvent, trialist: any) => {
    setDraggedItem(trialist);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.status !== newStatus) {
      await updateTrialistStatus.mutateAsync({
        id: draggedItem.id,
        status: newStatus as 'in_prova' | 'promosso' | 'archiviato'
      });
    }
    
    setDraggedItem(null);
  };

  const handleStatusChange = async (trialistId: string, newStatus: 'in_prova' | 'promosso' | 'archiviato') => {
    await updateTrialistStatus.mutateAsync({
      id: trialistId,
      status: newStatus
    });
  };

  const handleDeleteTrialist = async (trialistId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo trialist? Questa azione non può essere annullata.')) {
      await deleteTrialist.mutateAsync(trialistId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Kanban Trials
          </h1>
          <p className="text-muted-foreground">
            Gestisci il processo di valutazione trascinando i candidati tra le colonne
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <Card 
              key={column.id} 
              className={`p-4 ${column.color} min-h-[600px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`flex items-center space-x-2 mb-4 ${column.titleColor}`}>
                {column.icon}
                <h3 className="text-lg font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-auto">
                  {getTrialistsByStatus(column.id).length}
                </Badge>
              </div>

              <div className="space-y-3">
                {getTrialistsByStatus(column.id).map((trialist) => (
                  <TrialistCard 
                    key={trialist.id} 
                    trialist={trialist} 
                    columnId={column.id}
                    onDragStart={handleDragStart}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTrialist}
                  />
                ))}

                {getTrialistsByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nessun candidato</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrialsKanban;