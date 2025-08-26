import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Upload, Palette, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamData {
  id: string;
  name: string;
  fc_name: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
}

export default function TeamSettings() {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    fc_name: '',
    abbreviation: '',
    primary_color: '#3b82f6',
    secondary_color: '#ef4444'
  });

  // Check if user can edit (admin or owner)
  const userRole = localStorage.getItem('userRole');
  const canEdit = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const currentTeamId = localStorage.getItem('currentTeamId');
      if (!currentTeamId) {
        toast({
          title: 'Errore',
          description: 'Nessun team selezionato.',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', currentTeamId)
        .single();

      if (error) throw error;

      setTeamData(data);
      setFormData({
        name: data.name || '',
        fc_name: data.fc_name || '',
        abbreviation: data.abbreviation || '',
        primary_color: data.primary_color || '#3b82f6',
        secondary_color: data.secondary_color || '#ef4444'
      });
    } catch (error: any) {
      console.error('Error loading team data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati del team.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teamData || !canEdit) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          fc_name: formData.fc_name,
          abbreviation: formData.abbreviation,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color
        })
        .eq('id', teamData.id);

      if (error) throw error;

      // Update localStorage with new team name
      localStorage.setItem('currentTeamName', formData.name);

      toast({
        title: 'Successo',
        description: 'Impostazioni team aggiornate con successo!'
      });

      // Reload team data to reflect changes
      await loadTeamData();
    } catch (error: any) {
      console.error('Error saving team data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le modifiche.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !teamData || !canEdit) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `team-${teamData.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', teamData.id);

      if (updateError) throw updateError;

      toast({
        title: 'Successo',
        description: 'Logo aggiornato con successo!'
      });

      await loadTeamData();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il logo.',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team non trovato</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Impostazioni Team</h1>
            <p className="text-muted-foreground">
              Gestisci i dettagli del tuo team
            </p>
          </div>
        </div>
        
        {canEdit && (
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salva modifiche
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            ⚠️ Solo gli amministratori del team possono modificare queste impostazioni.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Team Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo Team
            </CardTitle>
            <CardDescription>
              Carica il logo ufficiale del tuo team (massimo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {teamData.logo_url ? (
                  <img 
                    src={teamData.logo_url} 
                    alt="Team Logo"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {teamData.abbreviation || teamData.name?.substring(0, 2) || 'TM'}
                  </span>
                )}
              </div>
              
              {canEdit && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={uploadingLogo}
                      className="gap-2"
                      asChild
                    >
                      <span>
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Carica Logo
                      </span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Team</CardTitle>
            <CardDescription>
              Informazioni base del team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Team</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!canEdit}
                  placeholder="es. Juventus Under 19"
                />
              </div>
              
              <div>
                <Label htmlFor="fc_name">Nome FC</Label>
                <Input
                  id="fc_name"
                  value={formData.fc_name}
                  onChange={(e) => setFormData({ ...formData, fc_name: e.target.value })}
                  disabled={!canEdit}
                  placeholder="es. Football Club Juventus"
                />
              </div>
              
              <div>
                <Label htmlFor="abbreviation">Abbreviazione</Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  disabled={!canEdit}
                  placeholder="es. JUV"
                  maxLength={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colori Sociali
            </CardTitle>
            <CardDescription>
              Scegli i colori ufficiali del team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Colore Primario</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    disabled={!canEdit}
                    className="h-10 w-16 rounded border border-border cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    disabled={!canEdit}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondary_color">Colore Secondario</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    disabled={!canEdit}
                    className="h-10 w-16 rounded border border-border cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    disabled={!canEdit}
                    placeholder="#ef4444"
                  />
                </div>
              </div>
            </div>
            
            {/* Color Preview */}
            <div className="flex items-center gap-4 pt-4">
              <span className="text-sm font-medium">Anteprima:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <div 
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: formData.secondary_color }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}