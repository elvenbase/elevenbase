import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayers, useCreateAttendance, useTrainingAttendance } from '@/hooks/useSupabaseData';
import { CheckCircle, Clock, X } from 'lucide-react';

interface AttendanceFormProps {
  sessionId: string;
  sessionTitle: string;
  children?: React.ReactNode;
  sessionClosed?: boolean;
  onSessionClosed?: () => void;
}

export const AttendanceForm = ({ sessionId, sessionTitle, children }: AttendanceFormProps) => {
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

    setOpen(false);
    setAttendanceData({});
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
      case 'absent': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  const presentCount = Object.values(attendanceData).filter(a => a.status === 'present').length;
  const lateCount = Object.values(attendanceData).filter(a => a.status === 'late').length;
  const absentCount = Object.values(attendanceData).filter(a => a.status === 'absent').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <CheckCircle className="h-4 w-4 mr-2" />
            Gestisci Presenze
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Presenze - {sessionTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
            <p className="text-2xl font-bold text-success">{presentCount}</p>
            <p className="text-sm text-muted-foreground">Presenti</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-warning/10 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{lateCount}</p>
            <p className="text-sm text-muted-foreground">Ritardi</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            <p className="text-sm text-muted-foreground">Assenti</p>
          </div>
        </div>

        <div className="space-y-3">
          {players.map((player) => {
            const existingRecord = existingAttendance.find(a => a.player_id === player.id);
            const currentStatus = attendanceData[player.id]?.status || existingRecord?.status;
            
            return (
              <div key={player.id} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {player.first_name} {player.last_name}
                    </p>
                    {player.jersey_number && (
                      <Badge variant="outline" className="mt-1">
                        #{player.jersey_number}
                      </Badge>
                    )}
                  </div>
                  {currentStatus && (
                    <Badge className={getStatusColor(currentStatus)}>
                      {getStatusIcon(currentStatus)}
                      <span className="ml-1">
                        {currentStatus === 'present' ? 'Presente' :
                         currentStatus === 'late' ? 'Ritardo' : 'Assente'}
                      </span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!existingRecord && (
                    <>
                      <Select 
                        value={attendanceData[player.id]?.status || ''} 
                        onValueChange={(value: 'present' | 'absent' | 'late') => handleStatusChange(player.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Stato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Presente</SelectItem>
                          <SelectItem value="late">Ritardo</SelectItem>
                          <SelectItem value="absent">Assente</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {attendanceData[player.id]?.status === 'late' && (
                        <Input
                          type="time"
                          placeholder="Orario arrivo"
                          value={attendanceData[player.id]?.arrival_time || ''}
                          onChange={(e) => handleArrivalTimeChange(player.id, e.target.value)}
                          className="w-32"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createAttendance.isPending || Object.keys(attendanceData).length === 0}
          >
            {createAttendance.isPending ? 'Salvando...' : 'Salva Presenze'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};