import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Users, Check, Clock } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { toast } from 'sonner';
import { usePlayers, useMatchAttendance, useUpsertMatchAttendance, useBulkUpdateMatchAttendance } from '@/hooks/useSupabaseData';

interface MatchAttendanceFormProps {
  matchId: string;
}

const MatchAttendanceForm = ({ matchId }: MatchAttendanceFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const { data: allPlayers = [] } = usePlayers();
  const { data: attendance = [], refetch } = useMatchAttendance(matchId);
  const upsert = useUpsertMatchAttendance();
  const bulkUpdate = useBulkUpdateMatchAttendance();

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.arrival_time).length;
  const noResponseCount = allPlayers.length - attendance.length;

  const handleStatusChange = async (playerId: string, status: string) => {
    try {
      setIsLoading(true);
      await upsert.mutateAsync({ match_id: matchId, player_id: playerId, status });
      toast.success('Presenza aggiornata');
      refetch();
    } catch (error: any) {
      toast.error('Errore aggiornando presenza: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLateStatusChange = async (playerId: string, isLate: boolean) => {
    try {
      await upsert.mutateAsync({ match_id: matchId, player_id: playerId, arrival_time: isLate ? '00:01:00' : null });
      refetch();
    } catch (error: any) {
      toast.error('Errore aggiornando ritardo: ' + error.message);
    }
  };

  const handleNotesChange = async (playerId: string, notes: string) => {
    try {
      await upsert.mutateAsync({ match_id: matchId, player_id: playerId, notes });
      refetch();
    } catch (error: any) {
      toast.error('Errore aggiornando note: ' + error.message);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedPlayers.length === 0) {
      toast.error('Seleziona almeno un giocatore');
      return;
    }
    try {
      setIsLoading(true);
      await bulkUpdate.mutateAsync({ match_id: matchId, player_ids: selectedPlayers, status });
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
    setSelectedPlayers(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <div className="text-sm text-muted-foreground">Presenti</div>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-sm text-muted-foreground">Assenti</div>
        </div>
        <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
          <div className="text-sm text-muted-foreground">In ritardo</div>
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
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('present')} disabled={isLoading}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Presenti
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('absent')} disabled={isLoading}>
                <XCircle className="w-4 h-4 mr-1" />
                Assenti
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPlayers([])}>
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
            <Checkbox checked={selectedPlayers.length === allPlayers.length && allPlayers.length > 0} onCheckedChange={handleSelectAll} />
          </div>
          <div className="col-span-3">Giocatore</div>
          <div className="col-span-2 text-center">Stato</div>
          <div className="col-span-1 text-center">Ritardo</div>
          <div className="col-span-5">Note</div>
        </div>

        {/* Header Mobile */}
        <div className="md:hidden p-4 bg-muted/50 font-medium text-sm flex items-center gap-4">
          <Checkbox checked={selectedPlayers.length === allPlayers.length && allPlayers.length > 0} onCheckedChange={handleSelectAll} />
          <span>Seleziona tutti</span>
        </div>

        <div className="divide-y">
          {allPlayers.map((player) => {
            const rec = attendance.find((a: any) => a.player_id === player.id)
            return (
              <div key={player.id}>
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30">
                  <div className="col-span-1 flex items-center justify-center">
                    <Checkbox checked={selectedPlayers.includes(player.id)} onCheckedChange={() => handleSelectPlayer(player.id)} />
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="sm" />
                      <div>
                        <div className="font-medium">{player.first_name} {player.last_name}</div>
                        {player.jersey_number && (
                          <div className="text-xs text-muted-foreground">#{player.jersey_number}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <Select value={rec?.status || 'present'} onValueChange={(value) => handleStatusChange(player.id, value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Presente</div></SelectItem>
                        <SelectItem value="absent"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /> Assente</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 text-center">
                    {(rec?.status === 'present') && (
                      <div className="flex items-center justify-center gap-1">
                        <input type="checkbox" checked={!!rec?.arrival_time} onChange={(e) => handleLateStatusChange(player.id, e.target.checked)} className="h-4 w-4" />
                        <span className="text-xs">Ritardo</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-5">
                    <Input placeholder="Note..." value={rec?.notes || ''} onChange={(e) => handleNotesChange(player.id, e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden p-4 space-y-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedPlayers.includes(player.id)} onCheckedChange={() => handleSelectPlayer(player.id)} />
                    <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="md" />
                    <div className="flex-1">
                      <div className="font-medium">{player.first_name} {player.last_name}</div>
                      {player.jersey_number && (<div className="text-xs text-muted-foreground">#{player.jersey_number}</div>)}
                    </div>
                    {rec && (<Badge variant="outline" className="text-xs">Registrato</Badge>)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Stato</label>
                      <Select value={rec?.status || 'present'} onValueChange={(value) => handleStatusChange(player.id, value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Seleziona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Presente</div></SelectItem>
                          <SelectItem value="absent"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /> Assente</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(rec?.status === 'present') && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Ritardo</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="checkbox" checked={!!rec?.arrival_time} onChange={(e) => handleLateStatusChange(player.id, e.target.checked)} className="h-4 w-4" />
                          <span className="text-sm">In ritardo</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Note</label>
                    <Input placeholder="Note..." value={rec?.notes || ''} onChange={(e) => handleNotesChange(player.id, e.target.value)} className="h-8 text-sm" />
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
          {allPlayers.length} giocatori totali
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { /* no explicit save needed */ }} disabled={isLoading}>
            Salva Tutto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchAttendanceForm;