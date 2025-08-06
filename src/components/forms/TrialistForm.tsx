import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { useCreateTrialist } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, X, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrialistFormProps {
  children?: React.ReactNode;
}

export const TrialistForm = ({ children }: TrialistFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    position: '',
    notes: '',
    esperienza: '',
    jersey_number: '',
    ea_sport_id: '',
    gaming_platform: 'none',
    platform_id: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTrialist = useCreateTrialist();
  const { toast } = useToast();
  const { getAvatarBackground } = useAvatarColor();

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
      const fileName = `temp-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('player-avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      toast({
        title: "Avatar caricato",
        description: "L'immagine del profilo è stata caricata con successo.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Errore caricamento",
        description: "Si è verificato un errore durante il caricamento dell'immagine.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (avatarUrl && avatarUrl.includes('player-avatars')) {
      try {
        const fileName = avatarUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('player-avatars')
            .remove([`avatars/${fileName}`]);
        }
      } catch (error) {
        console.error('Error removing avatar:', error);
      }
    }
    setAvatarUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate gaming fields
    if (formData.jersey_number && (isNaN(Number(formData.jersey_number)) || Number(formData.jersey_number) < 1 || Number(formData.jersey_number) > 99)) {
      toast({
        title: "Numero maglia non valido",
        description: "Il numero di maglia deve essere tra 1 e 99.",
        variant: "destructive"
      });
      return;
    }

    if ((formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox') && !formData.platform_id) {
      toast({
        title: "Platform ID richiesto",
        description: `L'ID ${formData.gaming_platform} è richiesto per questa piattaforma.`,
        variant: "destructive"
      });
      return;
    }
    
    const trialistData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: phoneNumber ? `${phonePrefix}${phoneNumber}` : undefined,
      birth_date: formData.birth_date || undefined,
      position: formData.position || undefined,
      notes: formData.notes || undefined,
      esperienza: formData.esperienza || undefined,
      avatar_url: avatarUrl || undefined,
      jersey_number: formData.jersey_number ? Number(formData.jersey_number) : undefined,
      ea_sport_id: formData.ea_sport_id || undefined,
      gaming_platform: formData.gaming_platform && formData.gaming_platform !== 'none' ? formData.gaming_platform : undefined,
      platform_id: formData.platform_id || undefined
    };

    await createTrialist.mutateAsync(trialistData);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      birth_date: '',
      position: '',
      notes: '',
      esperienza: '',
      jersey_number: '',
      ea_sport_id: '',
      gaming_platform: 'none',
      platform_id: ''
    });
    setPhonePrefix('+39');
    setPhoneNumber('');
    setAvatarUrl('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Trialist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo Trialist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Foto Profilo</Label>
            <div className="flex items-center gap-4">
              <Avatar 
                className="h-16 w-16"
                style={getAvatarBackground(formData.first_name + formData.last_name, !!avatarUrl)}
              >
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="text-white font-bold">
                  {formData.first_name.charAt(0) || 'U'}{formData.last_name.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? "Caricamento..." : "Carica Foto"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeAvatar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {avatarUrl && (
              <p className="text-xs text-muted-foreground">
                Formato supportati: JPG, PNG (max 5MB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">📱 Telefono</Label>
              <div className="flex gap-2">
                <Select 
                  value={phonePrefix} 
                  onValueChange={setPhonePrefix}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-background border z-50">
                    <SelectItem value="+39">🇮🇹 +39</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    <SelectItem value="+33">🇫🇷 +33</SelectItem>
                    <SelectItem value="+49">🇩🇪 +49</SelectItem>
                    <SelectItem value="+34">🇪🇸 +34</SelectItem>
                    <SelectItem value="+41">🇨🇭 +41</SelectItem>
                    <SelectItem value="+43">🇦🇹 +43</SelectItem>
                    <SelectItem value="+32">🇧🇪 +32</SelectItem>
                    <SelectItem value="+31">🇳🇱 +31</SelectItem>
                    <SelectItem value="+351">🇵🇹 +351</SelectItem>
                    <SelectItem value="+30">🇬🇷 +30</SelectItem>
                    <SelectItem value="+45">🇩🇰 +45</SelectItem>
                    <SelectItem value="+46">🇸🇪 +46</SelectItem>
                    <SelectItem value="+47">🇳🇴 +47</SelectItem>
                    <SelectItem value="+358">🇫🇮 +358</SelectItem>
                    <SelectItem value="+354">🇮🇸 +354</SelectItem>
                    <SelectItem value="+353">🇮🇪 +353</SelectItem>
                    <SelectItem value="+420">🇨🇿 +420</SelectItem>
                    <SelectItem value="+421">🇸🇰 +421</SelectItem>
                    <SelectItem value="+36">🇭🇺 +36</SelectItem>
                    <SelectItem value="+48">🇵🇱 +48</SelectItem>
                    <SelectItem value="+40">🇷🇴 +40</SelectItem>
                    <SelectItem value="+359">🇧🇬 +359</SelectItem>
                    <SelectItem value="+385">🇭🇷 +385</SelectItem>
                    <SelectItem value="+386">🇸🇮 +386</SelectItem>
                    <SelectItem value="+381">🇷🇸 +381</SelectItem>
                    <SelectItem value="+382">🇲🇪 +382</SelectItem>
                    <SelectItem value="+387">🇧🇦 +387</SelectItem>
                    <SelectItem value="+389">🇲🇰 +389</SelectItem>
                    <SelectItem value="+355">🇦🇱 +355</SelectItem>
                    <SelectItem value="+7">🇷🇺 +7</SelectItem>
                    <SelectItem value="+380">🇺🇦 +380</SelectItem>
                    <SelectItem value="+375">🇧🇾 +375</SelectItem>
                    <SelectItem value="+370">🇱🇹 +370</SelectItem>
                    <SelectItem value="+371">🇱🇻 +371</SelectItem>
                    <SelectItem value="+372">🇪🇪 +372</SelectItem>
                    <SelectItem value="+90">🇹🇷 +90</SelectItem>
                    <SelectItem value="+972">🇮🇱 +972</SelectItem>
                    <SelectItem value="+20">🇪🇬 +20</SelectItem>
                    <SelectItem value="+212">🇲🇦 +212</SelectItem>
                    <SelectItem value="+213">🇩🇿 +213</SelectItem>
                    <SelectItem value="+216">🇹🇳 +216</SelectItem>
                    <SelectItem value="+218">🇱🇾 +218</SelectItem>
                    <SelectItem value="+27">🇿🇦 +27</SelectItem>
                    <SelectItem value="+86">🇨🇳 +86</SelectItem>
                    <SelectItem value="+81">🇯🇵 +81</SelectItem>
                    <SelectItem value="+82">🇰🇷 +82</SelectItem>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+852">🇭🇰 +852</SelectItem>
                    <SelectItem value="+65">🇸🇬 +65</SelectItem>
                    <SelectItem value="+60">🇲🇾 +60</SelectItem>
                    <SelectItem value="+66">🇹🇭 +66</SelectItem>
                    <SelectItem value="+84">🇻🇳 +84</SelectItem>
                    <SelectItem value="+63">🇵🇭 +63</SelectItem>
                    <SelectItem value="+62">🇮🇩 +62</SelectItem>
                    <SelectItem value="+61">🇦🇺 +61</SelectItem>
                    <SelectItem value="+64">🇳🇿 +64</SelectItem>
                    <SelectItem value="+55">🇧🇷 +55</SelectItem>
                    <SelectItem value="+54">🇦🇷 +54</SelectItem>
                    <SelectItem value="+56">🇨🇱 +56</SelectItem>
                    <SelectItem value="+57">🇨🇴 +57</SelectItem>
                    <SelectItem value="+51">🇵🇪 +51</SelectItem>
                    <SelectItem value="+52">🇲🇽 +52</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="123 456 7890"
                  className="flex-1"
                />
              </div>
              {phoneNumber && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-6 px-2"
                  >
                    <a
                      href={`https://wa.me/${`${phonePrefix}${phoneNumber}`.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Data di Nascita</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Posizione</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="es. Centrocampista"
              />
            </div>
          </div>

          {/* Gaming Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">🎮 Dati Gaming</span>
              <span className="text-xs text-muted-foreground">(opzionale)</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jersey_number">Numero Maglia</Label>
                <Input
                  id="jersey_number"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                  placeholder="1-99"
                />
              </div>
              <div>
                <Label htmlFor="gaming_platform">Piattaforma Gaming</Label>
                <Select 
                  value={formData.gaming_platform} 
                  onValueChange={(value) => setFormData({ ...formData, gaming_platform: value, platform_id: value === 'PC' || value === 'Nintendo Switch' || value === 'none' ? formData.platform_id : '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona piattaforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna</SelectItem>
                    <SelectItem value="PS5">🎮 PlayStation 5</SelectItem>
                    <SelectItem value="Xbox">🎮 Xbox Series X/S</SelectItem>
                    <SelectItem value="PC">💻 PC</SelectItem>
                    <SelectItem value="Nintendo Switch">🎮 Nintendo Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ea_sport_id">EA Sports ID</Label>
                <Input
                  id="ea_sport_id"
                  value={formData.ea_sport_id}
                  onChange={(e) => setFormData({ ...formData, ea_sport_id: e.target.value })}
                  placeholder="ID EA Sports"
                />
              </div>
              <div>
                <Label htmlFor="platform_id">
                  Platform ID 
                  {(formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox') && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Input
                  id="platform_id"
                  value={formData.platform_id}
                  onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                  placeholder={
                    formData.gaming_platform === 'PS5' ? 'PSN ID' :
                    formData.gaming_platform === 'Xbox' ? 'Xbox Gamertag' :
                    formData.gaming_platform === 'PC' ? 'Steam/Epic ID' :
                    formData.gaming_platform === 'Nintendo Switch' ? 'Nintendo ID' :
                    'ID Piattaforma'
                  }
                  required={formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox'}
                />
                {formData.gaming_platform && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.gaming_platform === 'PS5' && 'ID del tuo account PlayStation Network'}
                    {formData.gaming_platform === 'Xbox' && 'Il tuo Xbox Gamertag'}
                    {formData.gaming_platform === 'PC' && 'ID Steam, Epic Games o altro'}
                    {formData.gaming_platform === 'Nintendo Switch' && 'ID del tuo account Nintendo'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="esperienza">🏆 Esperienza Sportiva</Label>
            <Textarea
              id="esperienza"
              value={formData.esperienza}
              onChange={(e) => setFormData({ ...formData, esperienza: e.target.value })}
              placeholder="Descrivi l'esperienza calcistica del trialist (squadre, campionati, livelli di gioco...)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note aggiuntive sul trialist..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createTrialist.isPending}>
              {createTrialist.isPending ? 'Aggiunta...' : 'Aggiungi Trialist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};