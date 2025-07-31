
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdatePlayer } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditPlayerFormProps {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    position?: string;
    status: 'active' | 'inactive' | 'injured' | 'suspended';
    phone?: string;
    avatar_url?: string;
  };
}

const EditPlayerForm = ({ player }: EditPlayerFormProps) => {
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
    status: player.status,
    phone: player.phone || ''
  });
  
  const [phonePrefix, setPhonePrefix] = useState(initialPrefix);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const updatePlayer = useUpdatePlayer();
  const { toast } = useToast();

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
      const fileName = `${player.id}-${Date.now()}.${fileExt}`;
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
    console.log('Attempting to update player:', player.id, formData);
    
    try {
      await updatePlayer.mutateAsync({
        id: player.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        jersey_number: formData.jersey_number ? Number(formData.jersey_number) : undefined,
        position: formData.position || undefined,
        status: formData.status,
        phone: formData.phone || undefined,
        avatar_url: avatarUrl || undefined
      });
      setOpen(false);
      console.log('Player updated successfully');
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Giocatore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jersey_number">Numero Maglia</Label>
              <Input
                id="jersey_number"
                type="number"
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posizione</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="es. Attaccante, Centrocampista..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <div className="flex gap-2">
              <Select 
                value={phonePrefix} 
                onValueChange={(prefix) => {
                  setPhonePrefix(prefix);
                  const fullPhone = phoneNumber ? `${prefix}${phoneNumber}` : '';
                  setFormData({ ...formData, phone: fullPhone });
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
                  <SelectItem value="+1">🇨🇦 +1</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const number = e.target.value;
                  setPhoneNumber(number);
                  const fullPhone = number ? `${phonePrefix}${number}` : '';
                  setFormData({ ...formData, phone: fullPhone });
                }}
                placeholder="123 456 7890"
                className="flex-1"
              />
            </div>
            {formData.phone && (
              <p className="text-xs text-muted-foreground">
                WhatsApp: https://wa.me/{formData.phone.replace(/[^0-9]/g, '')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'injured' | 'suspended') => setFormData({ ...formData, status: value })}>
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

          <div className="space-y-2">
            <Label>Foto Profilo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback>
                  {player.first_name.charAt(0)}{player.last_name.charAt(0)}
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={updatePlayer.isPending}>
              {updatePlayer.isPending ? "Aggiornamento..." : "Salva Modifiche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerForm;
