
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
import { useTrainingAttendance, usePlayers } from '@/hooks/useSupabaseData';

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

  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    noResponse: players.length - attendance.length,
    totalPlayers: players.length
  };

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {session.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <TrainingForm 
                session={session} 
                mode="edit" 
                onOpenChange={setEditModalOpen}
              >
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              </TrainingForm>
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDateTime(session.session_date, session.start_time)}
              {session.end_time && ` - ${session.end_time}`}
            </div>
            
            {(session.communication_type || session.location) && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {session.communication_type ? 
                  (session.communication_type === 'altro' && session.communication_details ? 
                    session.communication_details : 
                    session.communication_type.charAt(0).toUpperCase() + session.communication_type.slice(1)
                  ) : 
                  session.location
                }
              </div>
            )}
            
            {session.description && (
              <p className="mt-2">{session.description}</p>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Presenze
            </TabsTrigger>
            <TabsTrigger value="lineup" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Formazioni
            </TabsTrigger>
            <TabsTrigger value="public-link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Pubblico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceForm
              sessionId={session.id}
              sessionTitle={session.title}
            />
          </TabsContent>

          <TabsContent value="lineup" className="mt-6">
            <LineupManager 
              sessionId={session.id}
              presentPlayers={players?.filter(player => {
                const playerAttendance = attendance?.find(a => a.player_id === player.id);
                return playerAttendance?.status === 'present';
              }) || []}
            />
          </TabsContent>

          <TabsContent value="public-link" className="mt-6">
            <PublicLinkSharing
              session={session}
              attendanceStats={publicLinkStats}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
