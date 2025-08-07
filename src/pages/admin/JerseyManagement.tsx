import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates';
import { Link } from 'react-router-dom';

const JerseyManagement = () => {
  const { jerseyTemplates, createJerseyTemplate, updateJerseyTemplate, deleteJerseyTemplate, setDefaultJersey } = useJerseyTemplates();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#ffffff',
    secondary_color: '#000000',
    pattern: 'solid'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateJerseyTemplate(editingId, formData);
        setEditingId(null);
      } else {
        await createJerseyTemplate(formData);
        setIsCreating(false);
      }
      setFormData({ name: '', primary_color: '#ffffff', secondary_color: '#000000', pattern: 'solid' });
    } catch (error) {
      console.error('Errore nel salvare la maglia:', error);
    }
  };

  const handleEdit = (jersey: any) => {
    setEditingId(jersey.id);
    setFormData({
      name: jersey.name,
      primary_color: jersey.primary_color,
      secondary_color: jersey.secondary_color,
      pattern: jersey.pattern
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa maglia?')) {
      try {
        await deleteJerseyTemplate(id);
      } catch (error) {
        console.error('Errore nell\'eliminare la maglia:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', primary_color: '#ffffff', secondary_color: '#000000', pattern: 'solid' });
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
          <h1 className="text-3xl font-bold">Gestione Maglie</h1>
          <p className="text-muted-foreground">
            Crea e gestisci template di maglie per le tue squadre
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Form per creare/modificare */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Modifica Maglia' : 'Nuova Maglia'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Maglia</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Casa Bianca"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Colore Principale</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary_color">Colore Secondario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="pattern">Pattern</Label>
                  <select
                    id="pattern"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="solid">Solido</option>
                    <option value="stripes">Righe</option>
                    <option value="checkered">Scacchi</option>
                    <option value="dots">Punti</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Aggiorna' : 'Crea'} Maglia
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annulla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista maglie */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Maglie Esistenti</CardTitle>
              <CardDescription>
                {jerseyTemplates?.length || 0} maglie configurate
              </CardDescription>
            </div>
            {!isCreating && !editingId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Maglia
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {jerseyTemplates && jerseyTemplates.length > 0 ? (
              <div className="grid gap-4">
                {jerseyTemplates.map((jersey) => (
                  <div
                    key={jersey.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-8 rounded border"
                        style={{ 
                          backgroundColor: jersey.primary_color,
                          backgroundImage: jersey.pattern === 'stripes' ? 'linear-gradient(90deg, transparent 50%, ' + jersey.secondary_color + ' 50%)' : 'none'
                        }}
                      />
                      <div>
                        <h3 className="font-semibold">{jersey.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {jersey.pattern} • {jersey.primary_color} / {jersey.secondary_color}
                        </p>
                      </div>
                      {jersey.is_default && (
                        <Badge variant="default">Predefinita</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(jersey)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!jersey.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultJersey(jersey.id)}
                        >
                          Imposta Predefinita
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(jersey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna maglia configurata</p>
                <p className="text-sm">Crea la tua prima maglia per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JerseyManagement; 