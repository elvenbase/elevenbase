import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds';
import { Link } from 'react-router-dom';

const AvatarBackgroundManagement = () => {
  const { avatarBackgrounds, createAvatarBackground, updateAvatarBackground, deleteAvatarBackground } = useAvatarBackgrounds();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#1a2332',
    is_default: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateAvatarBackground(editingId, formData);
        setEditingId(null);
      } else {
        await createAvatarBackground(formData);
        setIsCreating(false);
      }
      setFormData({ name: '', color: '#1a2332', is_default: false });
    } catch (error) {
      console.error('Errore nel salvare lo sfondo:', error);
    }
  };

  const handleEdit = (background: any) => {
    setEditingId(background.id);
    setFormData({
      name: background.name,
      color: background.color,
      is_default: background.is_default
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo sfondo?')) {
      try {
        await deleteAvatarBackground(id);
      } catch (error) {
        console.error('Errore nell\'eliminare lo sfondo:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', color: '#1a2332', is_default: false });
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
          <h1 className="text-3xl font-bold">Gestione Sfondi Avatar</h1>
          <p className="text-muted-foreground">
            Crea e gestisci sfondi colorati per gli avatar dei giocatori
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Form per creare/modificare */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Modifica Sfondo' : 'Nuovo Sfondo'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Sfondo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Blu Scuro"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="color">Colore</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#1a2332"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_default">Imposta come predefinito</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Aggiorna' : 'Crea'} Sfondo
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annulla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista sfondi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sfondi Esistenti</CardTitle>
              <CardDescription>
                {avatarBackgrounds?.length || 0} sfondi configurati
              </CardDescription>
            </div>
            {!isCreating && !editingId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Sfondo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {avatarBackgrounds && avatarBackgrounds.length > 0 ? (
              <div className="grid gap-4">
                {avatarBackgrounds.map((background) => (
                  <div
                    key={background.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: background.color }}
                      />
                      <div>
                        <h3 className="font-semibold">{background.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {background.color}
                        </p>
                      </div>
                      {background.is_default && (
                        <Badge variant="default">Predefinito</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(background)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(background.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuno sfondo configurato</p>
                <p className="text-sm">Crea il tuo primo sfondo per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvatarBackgroundManagement; 