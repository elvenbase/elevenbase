import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Download } from 'lucide-react';
import { usePngExportSettings } from '@/hooks/usePngExportSettings';
import { Link } from 'react-router-dom';

const PngSettingsManagement = () => {
  const { pngExportSettings, createPngExportSetting, updatePngExportSetting, deletePngExportSetting, setDefaultSetting } = usePngExportSettings();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    field_lines_color: '#ffffff',
    field_lines_thickness: 2,
    jersey_numbers_color: '#000000',
    jersey_numbers_shadow: '2px 2px 4px rgba(0,0,0,0.9)',
    use_player_avatars: false,
    name_box_color: '#ffffff',
    name_text_color: '#000000',
    avatar_background_color: '#1a2332'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updatePngExportSetting(editingId, formData);
        setEditingId(null);
      } else {
        await createPngExportSetting(formData);
        setIsCreating(false);
      }
      setFormData({
        name: '',
        field_lines_color: '#ffffff',
        field_lines_thickness: 2,
        jersey_numbers_color: '#000000',
        jersey_numbers_shadow: '2px 2px 4px rgba(0,0,0,0.9)',
        use_player_avatars: false,
        name_box_color: '#ffffff',
        name_text_color: '#000000',
        avatar_background_color: '#1a2332'
      });
    } catch (error) {
      console.error('Errore nel salvare le impostazioni:', error);
    }
  };

  const handleEdit = (setting: any) => {
    setEditingId(setting.id);
    setFormData({
      name: setting.name,
      field_lines_color: setting.field_lines_color,
      field_lines_thickness: setting.field_lines_thickness,
      jersey_numbers_color: setting.jersey_numbers_color,
      jersey_numbers_shadow: setting.jersey_numbers_shadow,
      use_player_avatars: setting.use_player_avatars,
      name_box_color: setting.name_box_color,
      name_text_color: setting.name_text_color,
      avatar_background_color: setting.avatar_background_color
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare queste impostazioni?')) {
      try {
        await deletePngExportSetting(id);
      } catch (error) {
        console.error('Errore nell\'eliminare le impostazioni:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      field_lines_color: '#ffffff',
      field_lines_thickness: 2,
      jersey_numbers_color: '#000000',
      jersey_numbers_shadow: '2px 2px 4px rgba(0,0,0,0.9)',
      use_player_avatars: false,
      name_box_color: '#ffffff',
      name_text_color: '#000000',
      avatar_background_color: '#1a2332'
    });
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
          <h1 className="text-3xl font-bold">Impostazioni PNG</h1>
          <p className="text-muted-foreground">
            Configura le impostazioni per l'esportazione PNG delle formazioni
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Form per creare/modificare */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Modifica Impostazioni' : 'Nuove Impostazioni'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Preset</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Preset Standard"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_lines_color">Colore Linee Campo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="field_lines_color"
                        type="color"
                        value={formData.field_lines_color}
                        onChange={(e) => setFormData({ ...formData, field_lines_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.field_lines_color}
                        onChange={(e) => setFormData({ ...formData, field_lines_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="field_lines_thickness">Spessore Linee</Label>
                    <Input
                      id="field_lines_thickness"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.field_lines_thickness}
                      onChange={(e) => setFormData({ ...formData, field_lines_thickness: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jersey_numbers_color">Colore Numeri Maglia</Label>
                    <div className="flex gap-2">
                      <Input
                        id="jersey_numbers_color"
                        type="color"
                        value={formData.jersey_numbers_color}
                        onChange={(e) => setFormData({ ...formData, jersey_numbers_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.jersey_numbers_color}
                        onChange={(e) => setFormData({ ...formData, jersey_numbers_color: e.target.value })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="jersey_numbers_shadow">Ombra Numeri</Label>
                    <Input
                      id="jersey_numbers_shadow"
                      value={formData.jersey_numbers_shadow}
                      onChange={(e) => setFormData({ ...formData, jersey_numbers_shadow: e.target.value })}
                      placeholder="2px 2px 4px rgba(0,0,0,0.9)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name_box_color">Colore Box Nome</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name_box_color"
                        type="color"
                        value={formData.name_box_color}
                        onChange={(e) => setFormData({ ...formData, name_box_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.name_box_color}
                        onChange={(e) => setFormData({ ...formData, name_box_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name_text_color">Colore Testo Nome</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name_text_color"
                        type="color"
                        value={formData.name_text_color}
                        onChange={(e) => setFormData({ ...formData, name_text_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.name_text_color}
                        onChange={(e) => setFormData({ ...formData, name_text_color: e.target.value })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="avatar_background_color">Colore Sfondo Avatar</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar_background_color"
                      type="color"
                      value={formData.avatar_background_color}
                      onChange={(e) => setFormData({ ...formData, avatar_background_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.avatar_background_color}
                      onChange={(e) => setFormData({ ...formData, avatar_background_color: e.target.value })}
                      placeholder="#1a2332"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use_player_avatars"
                    checked={formData.use_player_avatars}
                    onChange={(e) => setFormData({ ...formData, use_player_avatars: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="use_player_avatars">Usa avatar dei giocatori</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Aggiorna' : 'Crea'} Preset
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annulla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista impostazioni */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preset Esistenti</CardTitle>
              <CardDescription>
                {pngExportSettings?.length || 0} preset configurati
              </CardDescription>
            </div>
            {!isCreating && !editingId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Preset
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {pngExportSettings && pngExportSettings.length > 0 ? (
              <div className="grid gap-4">
                {pngExportSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: setting.field_lines_color }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: setting.jersey_numbers_color }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: setting.name_box_color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{setting.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Linee: {setting.field_lines_thickness}px • Avatar: {setting.use_player_avatars ? 'Sì' : 'No'}
                        </p>
                      </div>
                      {setting.is_default && (
                        <Badge variant="default">Predefinito</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!setting.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultSetting(setting.id)}
                        >
                          Imposta Predefinito
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(setting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessun preset configurato</p>
                <p className="text-sm">Crea il tuo primo preset per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PngSettingsManagement; 