
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Link, BarChart3, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AttendanceForm } from './AttendanceForm';
import { TrainingForm } from './TrainingForm';
import LineupManager from '../LineupManager';
import PublicLinkSharing from '../PublicLinkSharing';
import { useTrainingAttendance, usePlayers, useTrainingTrialistInvites } from '@/hooks/useSupabaseData';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  communication_type?: 'party' | 'discord' | 'altro' | null;
  communication_details?: string;
  is_closed: boolean;
  public_link_token?: string;
  allow_responses_until?: string;
}

interface TrainingSessionModalProps {
  session: TrainingSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionClosed?: () => void;
}

export const TrainingSessionModal = ({ 
  session, 
  open, 
  onOpenChange, 
  onSessionClosed 
}: TrainingSessionModalProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const { data: attendance = [] } = useTrainingAttendance(session?.id || '');
  const { data: trialistInvites = [] } = useTrainingTrialistInvites(session?.id || '');
  const { data: players = [] } = usePlayers();

  if (!session) return null;

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date + 'T' + time);
    return format(sessionDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it });
  };

  const getStatusBadge = () => {
    if (session.is_closed) {
      return <Badge variant="destructive">Chiusa</Badge>;
    }
    
    const sessionDateTime = new Date(session.session_date + 'T' + session.start_time);
    const now = new Date();
    
    if (sessionDateTime < now) {
      return <Badge variant="secondary">Passata</Badge>;
    } else {
      return <Badge variant="default">Programmata</Badge>;
    }
  };

  const attendanceStats = (() => {
    const playerPresent = attendance.filter(a => a.status === 'present').length;
    const playerAbsent = attendance.filter(a => a.status === 'absent').length;
    const trialistPresent = trialistInvites.filter((t: any) => t.status === 'present').length;
    const trialistAbsent = trialistInvites.filter((t: any) => t.status === 'absent').length;
    const present = playerPresent + trialistPresent;
    const absent = playerAbsent + trialistAbsent;
    const totalEntities = players.length + trialistInvites.length;
    const responded = attendance.length + trialistPresent + trialistAbsent;
    const noResponse = Math.max(0, totalEntities - responded);
    return { present, absent, late: attendance.filter(a => a.status === 'late').length, noResponse };
  })();

  const publicLinkStats = {
    present: attendanceStats.present,
    absent: attendanceStats.absent,
    noResponse: attendanceStats.noResponse,
    totalPlayers: attendanceStats.totalPlayers
  };

  const handleSessionClosed = () => {
    setRefreshKey(prev => prev + 1);
    onSessionClosed?.();
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-w-5xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl flex-1 min-w-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{session.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <TrainingForm 
                session={session} 
                mode="edit" 
                onOpenChange={setEditModalOpen}
              >
                <Button variant="outline" size="sm" className="px-2 sm:px-3">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Modifica</span>
                </Button>
              </TrainingForm>
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {formatDateTime(session.session_date, session.start_time)}
                {session.end_time && ` - ${session.end_time}`}
              </span>
            </div>
            
            {(session.communication_type || session.location) && (
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">
                  {session.communication_type ? 
                    (session.communication_type === 'altro' && session.communication_details ? 
                      session.communication_details : 
                      session.communication_type.charAt(0).toUpperCase() + session.communication_type.slice(1)
                    ) : 
                    session.location
                  }
                </span>
              </div>
            )}
            
            {session.description && (
              <p className="mt-2 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none">{session.description}</p>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="attendance" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Presenze</span>
              <span className="xs:hidden">P</span>
            </TabsTrigger>
            <TabsTrigger value="lineup" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Formazioni</span>
              <span className="xs:hidden">F</span>
            </TabsTrigger>
            <TabsTrigger value="public-link" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm">
              <Link className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Link Pubblico</span>
              <span className="xs:hidden">L</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-3 sm:mt-6">
            <AttendanceForm
              sessionId={session.id}
              sessionTitle={session.title}
            />
          </TabsContent>

          <TabsContent value="lineup" className="mt-3 sm:mt-6">
            <LineupManager 
              sessionId={session.id}
              presentPlayers={players?.filter(player => {
                const playerAttendance = attendance?.find(a => a.player_id === player.id);
                // Mostra solo i giocatori che hanno risposto e sono stati marcati come presenti
                // (sia auto-registrati che marcati dall'allenatore)
                // NON mostra giocatori senza risposta o marcati come assenti
                return playerAttendance && playerAttendance.status === 'present';
              }) || []}
            />
          </TabsContent>

          <TabsContent value="public-link" className="mt-3 sm:mt-6">
            <PublicLinkSharing
              session={session}
              attendanceStats={{ ...publicLinkStats, totalPlayers: players.length + trialistInvites.length }}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
