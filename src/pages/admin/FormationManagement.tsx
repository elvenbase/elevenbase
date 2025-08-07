import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ArrowLeft, Users } from 'lucide-react';
import { useCustomFormations, CustomFormation } from '@/hooks/useCustomFormations';
import { FormationBuilder } from '@/components/FormationBuilder';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

const FormationManagement = () => {
  const { formations, loading, createFormation, updateFormation, deleteFormation } = useCustomFormations();
  const [editingFormation, setEditingFormation] = useState<CustomFormation | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = async (formationData: Omit<CustomFormation, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      if (editingFormation) {
        await updateFormation(editingFormation.id, formationData);
        setEditingFormation(null);
      } else {
        await createFormation(formationData);
        setIsCreating(false);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCancel = () => {
    setEditingFormation(null);
    setIsCreating(false);
  };

  const FormationPreview: React.FC<{ formation: CustomFormation }> = ({ formation }) => (
    <div className="relative w-full aspect-[2/3] bg-green-500 rounded-lg overflow-hidden border-2 border-white">
      {/* Field markings */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 w-12 h-12 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white transform -translate-y-1/2" />
        <div className="absolute left-1/4 right-1/4 top-0 h-8 border-b border-l border-r border-white" />
        <div className="absolute left-1/4 right-1/4 bottom-0 h-8 border-t border-l border-r border-white" />
      </div>

      {/* Positions */}
      {formation.positions.map((position) => (
        <div
          key={position.id}
          className="absolute w-4 h-4 bg-blue-600 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`
          }}
          title={position.role || position.name}
        />
      ))}
    </div>
  );

  if (isCreating || editingFormation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/formations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Lista
            </Button>
          </Link>
        </div>
        <FormationBuilder
          formation={editingFormation || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ad Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestione Formazioni</h1>
          <p className="text-muted-foreground mt-2">
            Crea e gestisci le formazioni personalizzate per la tua squadra
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold">Formazioni Personalizzate</h2>
          <p className="text-muted-foreground">
            {formations.length} formazioni configurate
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova Formazione
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="aspect-[2/3] bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : formations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna formazione</h3>
            <p className="text-muted-foreground mb-4">
              Inizia creando la tua prima formazione personalizzata
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea Prima Formazione
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <Card key={formation.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{formation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formation.defenders}-{formation.midfielders}-{formation.forwards}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFormation(formation)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina Formazione</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare la formazione "{formation.name}"? 
                            Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFormation(formation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormationPreview formation={formation} />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Totale giocatori: {formation.positions.length}</p>
                  <p>Creata: {new Date(formation.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormationManagement; 