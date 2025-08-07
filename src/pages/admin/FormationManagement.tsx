import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useCustomFormations } from '@/hooks/useCustomFormations';
import { Link } from 'react-router-dom';

const FormationManagement = () => {
  const { formations, createFormation, updateFormation, deleteFormation } = useCustomFormations();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    defenders: 4,
    midfielders: 4,
    forwards: 2
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateFormation(editingId, formData);
        setEditingId(null);
      } else {
        await createFormation(formData);
        setIsCreating(false);
      }
      setFormData({ name: '', defenders: 4, midfielders: 4, forwards: 2 });
    } catch (error) {
      console.error('Errore nel salvare la formazione:', error);
    }
  };

  const handleEdit = (formation: any) => {
    setEditingId(formation.id);
    setFormData({
      name: formation.name,
      defenders: formation.defenders,
      midfielders: formation.midfielders,
      forwards: formation.forwards
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa formazione?')) {
      try {
        await deleteFormation(id);
      } catch (error) {
        console.error('Errore nell\'eliminare la formazione:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', defenders: 4, midfielders: 4, forwards: 2 });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ad Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestione Formazioni</h1>
          <p className="text-muted-foreground">
            Crea e gestisci formazioni personalizzate per le tue squadre
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Form per creare/modificare */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Modifica Formazione' : 'Nuova Formazione'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Formazione</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. 4-3-3 Attacco"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defenders">Difensori</Label>
                    <Input
                      id="defenders"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.defenders}
                      onChange={(e) => setFormData({ ...formData, defenders: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="midfielders">Centrocampisti</Label>
                    <Input
                      id="midfielders"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.midfielders}
                      onChange={(e) => setFormData({ ...formData, midfielders: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="forwards">Attaccanti</Label>
                    <Input
                      id="forwards"
                      type="number"
                      min="1"
                      max="4"
                      value={formData.forwards}
                      onChange={(e) => setFormData({ ...formData, forwards: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Aggiorna' : 'Crea'} Formazione
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annulla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista formazioni */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Formazioni Esistenti</CardTitle>
              <CardDescription>
                {formations?.length || 0} formazioni configurate
              </CardDescription>
            </div>
            {!isCreating && !editingId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Formazione
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {formations && formations.length > 0 ? (
              <div className="grid gap-4">
                {formations.map((formation) => (
                  <div
                    key={formation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{formation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formation.defenders}-{formation.midfielders}-{formation.forwards}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {formation.defenders + formation.midfielders + formation.forwards} giocatori
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(formation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(formation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna formazione personalizzata configurata</p>
                <p className="text-sm">Crea la tua prima formazione per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormationManagement; 