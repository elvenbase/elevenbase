import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, CheckCircle, XCircle, Clock, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreateAttendance, useTrainingAttendance, usePlayers, useUpdatePlayerStatistics } from '@/hooks/useSupabaseData';

interface AttendanceFormProps {
  sessionId: string;
  sessionTitle: string;
  children?: React.ReactNode;
  sessionClosed?: boolean;
  onSessionClosed?: () => void;
}

const AttendanceForm = ({ 
  sessionId, 
  sessionTitle, 
  children, 
  sessionClosed = false,
  onSessionClosed 
}: AttendanceFormProps) => {
  const [open, setOpen] = useState(false);
  const { data: players = [] } = usePlayers();
  const { data: existingAttendance = [] } = useTrainingAttendance(sessionId);
  const createAttendance = useCreateAttendance();
  const updateStatistics = useUpdatePlayerStatistics();

  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: 'present' | 'absent' | 'late';
    arrival_time?: string;
    notes?: string;
  }>>({});

  const handleStatusChange = (playerId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status
      }
    }));
  };

  const handleArrivalTimeChange = (playerId: string, time: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        arrival_time: time
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      const attendanceRecords = Object.entries(attendanceData).map(([playerId, data]) => ({
        session_id: sessionId,
        player_id: playerId,
        status: data.status,
        arrival_time: data.arrival_time,
        notes: data.notes
      }));

      for (const record of attendanceRecords) {
        await createAttendance.mutateAsync(record);
      }

      setAttendanceData({});
      toast.success('Presenze salvate con successo!');
      setOpen(false);
    } catch (error) {
      console.error('Errore nel salvare le presenze:', error);
      toast.error('Errore nel salvare le presenze');
    }
  };

  const handleCloseSession = async () => {
    try {
      // Salva le presenze prima di chiudere
      await handleSubmit();
      
      // Chiudi la sessione
      const { error } = await supabase
        .from('training_sessions')
        .update({ is_closed: true })
        .eq('id', sessionId);

      if (error) throw error;

      // Aggiorna le statistiche dei giocatori
      await updateStatistics.mutateAsync({ sessionId });

      toast.success('Sessione chiusa e statistiche aggiornate!');
      onSessionClosed?.();
      setOpen(false);
    } catch (error) {
      console.error('Errore nel chiudere la sessione:', error);
      toast.error('Errore nel chiudere la sessione');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success/20 text-success';
      case 'late': return 'bg-warning/20 text-warning';
      case 'absent': return 'bg-destructive/20 text-destructive';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatus = (playerId: string) => {
    const existingRecord = existingAttendance.find(a => a.player_id === playerId);
    return attendanceData[playerId]?.status || existingRecord?.status || '';
  };

  const getArrivalTime = (playerId: string) => {
    const existingRecord = existingAttendance.find(a => a.player_id === playerId);
    return attendanceData[playerId]?.arrival_time || existingRecord?.arrival_time || '';
  };

  const presentCount = Object.values(attendanceData).filter(a => a.status === 'present').length + 
                      existingAttendance.filter(a => a.status === 'present').length;
  const lateCount = Object.values(attendanceData).filter(a => a.status === 'late').length + 
                    existingAttendance.filter(a => a.status === 'late').length;
  const absentCount = Object.values(attendanceData).filter(a => a.status === 'absent').length + 
                      existingAttendance.filter(a => a.status === 'absent').length;

  return (
    <>
      {children ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Presenze - {sessionTitle}
              </DialogTitle>
            </DialogHeader>
            
            {/* Riepilogo */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Presenti</span>
                </div>
                <p className="text-2xl font-bold text-success">{presentCount}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">In ritardo</span>
                </div>
                <p className="text-2xl font-bold text-warning">{lateCount}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Assenti</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{absentCount}</p>
              </div>
            </div>

            {/* Lista giocatori */}
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{player.first_name} {player.last_name}</p>
                      {player.jersey_number && (
                        <Badge variant="outline" className="mt-1">#{player.jersey_number}</Badge>
                      )}
                    </div>
                    {getStatus(player.id) && (
                      <Badge className={getStatusColor(getStatus(player.id))}>
                        {getStatusIcon(getStatus(player.id))}
                        <span className="ml-1">
                          {getStatus(player.id) === 'present' ? 'Presente' :
                           getStatus(player.id) === 'late' ? 'In ritardo' : 'Assente'}
                        </span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={getStatus(player.id)}
                      onValueChange={(status: 'present' | 'absent' | 'late') => handleStatusChange(player.id, status)}
                      disabled={sessionClosed}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Presente</SelectItem>
                        <SelectItem value="absent">Assente</SelectItem>
                        <SelectItem value="late">In ritardo</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {getStatus(player.id) === 'late' && (
                      <Input
                        type="time"
                        value={getArrivalTime(player.id)}
                        onChange={(e) => handleArrivalTimeChange(player.id, e.target.value)}
                        className="w-32"
                        disabled={sessionClosed}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Azioni */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={sessionClosed}>
                Salva Presenze
              </Button>
              {!sessionClosed && (
                <Button onClick={handleCloseSession} variant="destructive" className="flex-1">
                  <Lock className="mr-2 h-4 w-4" />
                  Chiudi Sessione
                </Button>
              )}
            </div>
            
            {sessionClosed && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  ⚠️ Sessione chiusa - Le modifiche non sono più consentite
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};

export { AttendanceForm };