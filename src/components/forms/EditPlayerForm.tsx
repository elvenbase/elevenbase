import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useUpdatePlayer } from "@/hooks/useSupabaseData";
import { useFieldOptions } from "@/hooks/useFieldOptions";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlayerEvaluationDisplay from "@/components/PlayerEvaluationDisplay";
import PlayerSessionCounter from "@/components/PlayerSessionCounter";

interface EditPlayerFormProps {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    position?: string;
    player_role?: string;
    status: 'active' | 'inactive' | 'injured' | 'suspended';
    phone?: string;
    birth_date?: string;
    email?: string;
    esperienza?: string;
    notes?: string;
    avatar_url?: string;
    ea_sport_id?: string;
    gaming_platform?: 'PC' | 'PS5' | 'Xbox';
    platform_id?: string;
  };
  triggerAs?: 'button' | 'link';
  triggerLabel?: string;
  triggerClassName?: string;
}

const EditPlayerForm = ({ player, triggerAs = 'button', triggerLabel = 'Modifica', triggerClassName = '' }: EditPlayerFormProps) => {
  const [open, setOpen] = useState(false);
  
  // Parse existing phone number to extract prefix and number
  const parsePhone = (phone: string) => {
    if (!phone) return { prefix: '+39', number: '' };
    
    const prefixes = ['+39', '+1', '+44', '+33', '+49', '+34', '+41', '+43', '+32', '+31', '+351', '+30', '+45', '+46', '+47', '+358', '+354', '+353', '+420', '+421', '+36', '+48', '+40', '+359', '+385', '+386', '+381', '+382', '+387', '+389', '+355', '+7', '+380', '+375', '+370', '+371', '+372', '+90', '+972', '+20', '+212', '+213', '+216', '+218', '+27', '+86', '+81', '+82', '+91', '+852', '+65', '+60', '+66', '+84', '+63', '+62', '+61', '+64', '+55', '+54', '+56', '+57', '+51', '+52'];
    
    for (const prefix of prefixes) {
      if (phone.startsWith(prefix)) {
        return { prefix, number: phone.substring(prefix.length) };
      }
    }
    
    return { prefix: '+39', number: phone };
  };
  
  const { prefix: initialPrefix, number: initialNumber } = parsePhone(player.phone || '');
  
  const [formData, setFormData] = useState({
    first_name: player.first_name,
    last_name: player.last_name,
    jersey_number: player.jersey_number || '',
    position: player.position || '',
    role_code: (player as any).role_code || '',
    status: player.status || 'active',
    phone: player.phone || '',
    birth_date: player.birth_date || '',
    email: player.email || '',
    esperienza: player.esperienza || '',
    notes: player.notes || '',
    ea_sport_id: player.ea_sport_id || '',
    gaming_platform: player.gaming_platform || '',
    platform_id: player.platform_id || ''
  });
  
  const [phonePrefix, setPhonePrefix] = useState(initialPrefix);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const updatePlayer = useUpdatePlayer();
  const { toast } = useToast();

  const { getOptionsForField, loadOptions } = useFieldOptions();
  const { data: roles = [] } = useRoles();

  // Load field options when component mounts
  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open, loadOptions]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "La dimensione massima consentita è 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato non valido",
        description: "Seleziona un'immagine valida (JPG, PNG, etc.).",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `player-${player.id}/avatar-${Date.now()}.${fileExt}`;
      
      // Try player-avatars bucket first, fallback to avatars if not found
      let uploadResult = await supabase.storage
        .from('player-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      let bucketName = 'player-avatars';

      // If player-avatars bucket doesn't exist, fallback to avatars bucket
      if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {

        uploadResult = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        bucketName = 'avatars';
      }

      if (uploadResult.error) {
        console.error('Upload error:', uploadResult.error);
        throw uploadResult.error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setAvatarUrl(`${publicUrl}?v=${Date.now()}`);
      try { localStorage.setItem('playerAvatarUpdatedAt', `${player.id}:${Date.now()}`) } catch {}

      toast({
        title: "Avatar caricato",
        description: "L'immagine è stata caricata con successo.",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Errore di caricamento",
        description: "Si è verificato un errore durante il caricamento dell'immagine.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine phone prefix and number
    const fullPhone = phoneNumber ? `${phonePrefix}${phoneNumber}` : '';

    try {
      await updatePlayer.mutateAsync({
        id: player.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number.toString()) : null,
        position: null,
        role_code: (formData as any).role_code || null,
        status: formData.status,
        phone: fullPhone || null,
        birth_date: formData.birth_date || null,
        email: formData.email || null,
        esperienza: formData.esperienza || null,
        notes: formData.notes || null,
        avatar_url: avatarUrl || null,
        ea_sport_id: formData.ea_sport_id || null,
        gaming_platform: formData.gaming_platform || null,
        platform_id: formData.platform_id || null
      });

      setOpen(false);
      toast({
        title: "Giocatore aggiornato",
        description: "Le informazioni del giocatore sono state salvate.",
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento.",
        variant: "destructive"
      });
    }
  };

  const phonePrefixes = [
    { value: '+39', label: '+39 (Italia)' },
    { value: '+1', label: '+1 (USA/Canada)' },
    { value: '+44', label: '+44 (Regno Unito)' },
    { value: '+33', label: '+33 (Francia)' },
    { value: '+49', label: '+49 (Germania)' },
    { value: '+34', label: '+34 (Spagna)' },
    { value: '+41', label: '+41 (Svizzera)' },
    { value: '+43', label: '+43 (Austria)' },
    { value: '+32', label: '+32 (Belgio)' },
    { value: '+31', label: '+31 (Paesi Bassi)' }
  ];

  const gamingPlatforms = [
    "PC",
    "PS5", 
    "Xbox"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerAs === 'link' ? (
          <span className={`cursor-pointer ${triggerClassName}`}>{triggerLabel}</span>
        ) : (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Modifica Giocatore</span>
            <PlayerSessionCounter playerId={player.id} />
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div className="space-y-3">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <PlayerAvatar
                entityId={`player:${player.id}`}
                firstName={player.first_name}
                lastName={player.last_name}
                avatarUrl={avatarUrl}
                size="xl"
              />
              
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingAvatar ? 'Caricamento...' : 'Carica'}
                </Button>
                
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Rimuovi
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="jersey_number">Numero Maglia</Label>
              <Input
                id="jersey_number"
                type="number"
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="role_code">Ruolo</Label>
              <Select
                value={(formData as any).role_code}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.label} ({r.abbreviation})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Caricamento opzioni...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label>Telefono</Label>
            <div className="flex gap-2">
              <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phonePrefixes.map((prefix) => (
                    <SelectItem key={prefix.value} value={prefix.value}>
                      {prefix.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="123 456 7890"
                className="flex-1"
              />
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">📅 Data di Nascita</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">📧 Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@esempio.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          {/* Experience & Notes */}
          <div>
            <Label htmlFor="esperienza">🏆 Esperienza Sportiva</Label>
            <Textarea
              id="esperienza"
              value={formData.esperienza}
              onChange={(e) => setFormData(prev => ({ ...prev, esperienza: e.target.value }))}
              placeholder="Descrivi l'esperienza calcistica del giocatore (squadre, campionati, livelli di gioco...)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">📝 Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Note aggiuntive sul giocatore..."
              rows={3}
            />
          </div>

          {/* Valutazioni Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">⚡ Valutazioni dal Periodo di Prova</span>
            </div>
            <PlayerEvaluationDisplay playerId={player.id} />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Stato</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="inactive">Inattivo</SelectItem>
                <SelectItem value="injured">Infortunato</SelectItem>
                <SelectItem value="suspended">Squalificato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gaming Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Informazioni Gaming (opzionali)</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="ea_sport_id">EA Sports ID</Label>
                <Input
                  id="ea_sport_id"
                  value={formData.ea_sport_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, ea_sport_id: e.target.value }))}
                  placeholder="Il tuo ID EA Sports"
                />
              </div>

              <div>
                <Label htmlFor="gaming_platform">Piattaforma Gaming</Label>
                <Select
                  value={formData.gaming_platform}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gaming_platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona piattaforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {['PC','PS5','Xbox'].map((platform) => (
                      <SelectItem key={platform} value={platform as any}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.gaming_platform && formData.gaming_platform !== 'PC' && (
                <div>
                  <Label htmlFor="platform_id">
                    {formData.gaming_platform === 'PS5' ? 'PSN ID' : 'Xbox Live ID'}
                  </Label>
                  <Input
                    id="platform_id"
                    value={formData.platform_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                    placeholder={formData.gaming_platform === 'PS5' ? 'Il tuo PSN ID' : 'Il tuo Xbox Live ID'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={updatePlayer.isPending} className="flex-1">
              {updatePlayer.isPending ? 'Aggiornamento...' : 'Aggiorna'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerForm;