import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Users, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTrainingAttendance, usePlayers } from '@/hooks/useSupabaseData';

interface AttendanceFormProps {
  sessionId: string;
  sessionTitle: string;
}

const AttendanceForm = ({ sessionId, sessionTitle }: AttendanceFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  const { data: allPlayers = [], refetch: refetchPlayers } = usePlayers();
  const { data: existingAttendance = [], refetch } = useTrainingAttendance(sessionId);

  const presentCount = existingAttendance.filter(a => a.status === 'present').length;
  const absentCount = existingAttendance.filter(a => a.status === 'absent').length;
  const selfRegisteredCount = existingAttendance.filter(a => a.self_registered).length;
  const noResponseCount = allPlayers.length - existingAttendance.length;

  const handleStatusChange = async (playerId: string, status: string) => {
    try {
      setIsLoading(true);
      
      // Controlla se esiste già un record di presenza
      const existingRecord = existingAttendance.find(a => a.player_id === playerId);
      
      if (existingRecord) {
        // Aggiorna il record esistente
        const { error } = await supabase
          .from('training_attendance')
          .update({ 
            status,
            self_registered: false // Quando l'admin conferma, non è più auto-registrazione
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Crea un nuovo record
        const { error } = await supabase
          .from('training_attendance')
          .insert({
            session_id: sessionId,
            player_id: playerId,
            status,
            self_registered: false
          });

        if (error) throw error;
      }

      toast.success('Presenza aggiornata');
      refetch();
    } catch (error: any) {
      toast.error('Errore nell\'aggiornare la presenza: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLateStatusChange = async (playerId: string, isLate: boolean) => {
    try {
      const existingRecord = existingAttendance.find(a => a.player_id === playerId);
      
      if (existingRecord) {
        const { error } = await supabase
          .from('training_attendance')
          .update({ 
            arrival_time: isLate ? '00:01:00' : null
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
        refetch();
      }
    } catch (error: any) {
      toast.error('Errore nell\'aggiornare il ritardo: ' + error.message);
    }
  };

  const handleNotesChange = async (playerId: string, notes: string) => {
    try {
      const existingRecord = existingAttendance.find(a => a.player_id === playerId);
      
      if (existingRecord) {
        const { error } = await supabase
          .from('training_attendance')
          .update({ notes })
          .eq('id', existingRecord.id);

        if (error) throw error;
        refetch();
      }
    } catch (error: any) {
      toast.error('Errore nell\'aggiornare le note: ' + error.message);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsLoading(true);
      toast.success('Tutte le modifiche sono state salvate automaticamente');
      refetch();
    } catch (error: any) {
      toast.error('Errore nel salvare: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedPlayers.length === 0) {
      toast.error('Seleziona almeno un giocatore');
      return;
    }

    try {
      setIsLoading(true);
      
      for (const playerId of selectedPlayers) {
        const existingRecord = existingAttendance.find(a => a.player_id === playerId);
        
        if (existingRecord) {
          await supabase
            .from('training_attendance')
            .update({ 
              status,
              self_registered: false
            })
            .eq('id', existingRecord.id);
        } else {
          await supabase
            .from('training_attendance')
            .insert({
              session_id: sessionId,
              player_id: playerId,
              status,
              self_registered: false
            });
        }
      }

      toast.success(`${selectedPlayers.length} giocatori aggiornati`);
      setSelectedPlayers([]);
      refetch();
    } catch (error: any) {
      toast.error('Errore nell\'aggiornamento bulk: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === allPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(allPlayers.map(p => p.id));
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleCloseSession = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('training_sessions')
        .update({ is_closed: true })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Sessione chiusa con successo');
      refetch();
    } catch (error: any) {
      toast.error('Errore nella chiusura della sessione: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <div className="text-sm text-muted-foreground">Presenti</div>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-sm text-muted-foreground">Assenti</div>
        </div>
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{selfRegisteredCount}</div>
          <div className="text-sm text-muted-foreground">Auto-registrati</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-muted-foreground">{noResponseCount}</div>
          <div className="text-sm text-muted-foreground">Non risposto</div>
        </div>
      </div>

      {/* Controlli selezione multipla */}
      {selectedPlayers.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedPlayers.length} giocatori selezionati
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkStatusChange('present')}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Presenti
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkStatusChange('absent')}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Assenti
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedPlayers([])}
              >
                Deseleziona
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabella giocatori */}
      <div className="border rounded-lg overflow-x-auto">
        {/* Header Desktop */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-muted/50 font-medium text-sm">
          <div className="col-span-1 flex items-center justify-center">
            <Checkbox 
              checked={selectedPlayers.length === allPlayers.length && allPlayers.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div className="col-span-3">Giocatore</div>
          <div className="col-span-2 text-center">Auto-registrazione</div>
          <div className="col-span-2 text-center">Conferma Presenza</div>
          <div className="col-span-1 text-center">Ritardo</div>
          <div className="col-span-3">Note</div>
        </div>
        
        {/* Header Mobile */}
        <div className="md:hidden p-4 bg-muted/50 font-medium text-sm flex items-center gap-4">
          <Checkbox 
            checked={selectedPlayers.length === allPlayers.length && allPlayers.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span>Seleziona tutti</span>
        </div>
        
        <div className="divide-y">
          {allPlayers.map((player) => {
            const attendance = existingAttendance.find(a => a.player_id === player.id)
            const isEditing = editingPlayer === player.id
            
            return (
              <div key={player.id}>
                {/* Layout Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30">
                  {/* Checkbox selezione */}
                  <div className="col-span-1 flex items-center justify-center">
                    <Checkbox 
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={() => handleSelectPlayer(player.id)}
                    />
                  </div>
                  
                  {/* Giocatore */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      {player.avatar_url ? (
                        <img 
                          src={player.avatar_url} 
                          alt={`${player.first_name} ${player.last_name}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {player.first_name} {player.last_name}
                        </div>
                        {player.jersey_number && (
                          <div className="text-xs text-muted-foreground">
                            #{player.jersey_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto-registrazione */}
                  <div className="col-span-2 text-center">
                    {attendance?.self_registered ? (
                      <Badge 
                        variant={attendance.status === 'present' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {attendance.status === 'present' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Presente
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Assente
                          </>
                        )}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non risposto</span>
                    )}
                  </div>

                  {/* Conferma Presenza */}
                  <div className="col-span-2">
                    <Select 
                      value={attendance?.status || ''} 
                      onValueChange={(value) => handleStatusChange(player.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Presente
                          </div>
                        </SelectItem>
                        <SelectItem value="absent">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Assente
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ritardo */}
                  <div className="col-span-1 text-center">
                    {attendance?.status === 'present' && (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!attendance?.arrival_time}
                          onChange={(e) => handleLateStatusChange(player.id, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-xs">Ritardo</span>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div className="col-span-3">
                    <Input
                      placeholder="Note..."
                      value={attendance?.notes || ''}
                      onChange={(e) => handleNotesChange(player.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Layout Mobile */}
                <div className="md:hidden p-4 space-y-3 hover:bg-muted/30">
                  {/* Header con checkbox e giocatore */}
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={() => handleSelectPlayer(player.id)}
                    />
                    {player.avatar_url ? (
                      <img 
                        src={player.avatar_url} 
                        alt={`${player.first_name} ${player.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {player.first_name} {player.last_name}
                      </div>
                      {player.jersey_number && (
                        <div className="text-xs text-muted-foreground">
                          #{player.jersey_number}
                        </div>
                      )}
                    </div>
                    {attendance?.self_registered && (
                      <Badge 
                        variant={attendance.status === 'present' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {attendance.status === 'present' ? 'Auto-Presente' : 'Auto-Assente'}
                      </Badge>
                    )}
                  </div>

                  {/* Controlli */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Presenza</label>
                      <Select 
                        value={attendance?.status || ''} 
                        onValueChange={(value) => handleStatusChange(player.id, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Seleziona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Presente
                            </div>
                          </SelectItem>
                          <SelectItem value="absent">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              Assente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {attendance?.status === 'present' && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Ritardo</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            checked={!!attendance?.arrival_time}
                            onChange={(e) => handleLateStatusChange(player.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">In ritardo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Note</label>
                    <Input
                      placeholder="Note..."
                      value={attendance?.notes || ''}
                      onChange={(e) => handleNotesChange(player.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Azioni */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {allPlayers.length} giocatori totali • {selfRegisteredCount} auto-registrati
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleCloseSession}
            disabled={isLoading}
          >
            <Lock className="w-4 h-4 mr-2" />
            Chiudi Sessione
          </Button>
          <Button onClick={handleSaveAll} disabled={isLoading}>
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
            Salva Tutto
          </Button>
        </div>
      </div>
    </div>
  );
};

export { AttendanceForm };