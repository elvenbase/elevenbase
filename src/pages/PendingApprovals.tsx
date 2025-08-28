import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Shield, 
  Gamepad2, 
  Mail, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PendingMember {
  member_id: string;
  user_id: string;
  user_email: string;
  role: 'admin' | 'player';
  ea_sports_id?: string;
  joined_at: string;
  invited_by_email?: string;
}

const PendingApprovals = () => {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  const { registrationStatus } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (registrationStatus?.team_id) {
      loadPendingMembers();
    }
  }, [registrationStatus]);

  const loadPendingMembers = async () => {
    if (!registrationStatus?.team_id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_pending_approvals', {
        _team_id: registrationStatus.team_id
      });

      if (error) {
        console.error('Errore nel caricamento approvazioni:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le richieste in attesa",
          variant: "destructive"
        });
        return;
      }

      setPendingMembers(data || []);
    } catch (error) {
      console.error('Errore durante il caricamento:', error);
      toast({
        title: "Errore imprevisto",
        description: "Si è verificato un errore durante il caricamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (member: PendingMember) => {
    setActionLoading(member.member_id);
    
    try {
      const { data, error } = await supabase.rpc('approve_team_member', {
        _member_id: member.member_id,
        _notes: approvalNotes || null
      });

      if (error) {
        toast({
          title: "Errore approvazione",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ Membro approvato",
        description: `${member.user_email} è stato approvato come ${member.role}`,
      });

      // Ricarica la lista
      await loadPendingMembers();
      
      // Reset stato
      setIsApprovalDialogOpen(false);
      setSelectedMember(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Errore durante l\'approvazione:', error);
      toast({
        title: "Errore imprevisto",
        description: "Si è verificato un errore durante l'approvazione",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (member: PendingMember) => {
    setActionLoading(member.member_id);
    
    try {
      const { data, error } = await supabase.rpc('reject_team_member', {
        _member_id: member.member_id,
        _reason: rejectionReason || null
      });

      if (error) {
        toast({
          title: "Errore rifiuto",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "❌ Richiesta rifiutata",
        description: `La richiesta di ${member.user_email} è stata rifiutata`,
      });

      // Ricarica la lista
      await loadPendingMembers();
      
      // Reset stato
      setIsRejectionDialogOpen(false);
      setSelectedMember(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Errore durante il rifiuto:', error);
      toast({
        title: "Errore imprevisto",
        description: "Si è verificato un errore durante il rifiuto",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Gamepad2 className="w-3 h-3" />
        Player
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Richieste di Approvazione
            {pendingMembers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingMembers.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Gestisci le richieste di accesso al team in attesa di approvazione
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pendingMembers.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 Non ci sono richieste in attesa! Tutti i membri del team sono stati approvati.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{pendingMembers.length}</strong> {pendingMembers.length === 1 ? 'persona è in attesa' : 'persone sono in attesa'} della tua approvazione per unirsi al team.
                </AlertDescription>
              </Alert>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>EA Sports ID</TableHead>
                    <TableHead>Invitato da</TableHead>
                    <TableHead>Data Richiesta</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMembers.map((member) => (
                    <TableRow key={member.member_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{member.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(member.role)}
                      </TableCell>
                      <TableCell>
                        {member.ea_sports_id ? (
                          <Badge variant="outline" className="font-mono">
                            {member.ea_sports_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.invited_by_email ? (
                          <span className="text-sm">{member.invited_by_email}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(member.joined_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Dialog open={isApprovalDialogOpen && selectedMember?.member_id === member.member_id} onOpenChange={setIsApprovalDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedMember(member)}
                                disabled={actionLoading === member.member_id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approva
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approva {member.user_email}</DialogTitle>
                                <DialogDescription>
                                  Confermi di voler approvare {member.user_email} come {member.role} del team?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Note (opzionali)</Label>
                                  <Textarea
                                    id="notes"
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    placeholder="Aggiungi note sull'approvazione..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsApprovalDialogOpen(false);
                                    setSelectedMember(null);
                                    setApprovalNotes('');
                                  }}
                                >
                                  Annulla
                                </Button>
                                <Button
                                  onClick={() => handleApprove(member)}
                                  disabled={actionLoading === member.member_id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading === member.member_id ? "Approvando..." : "✅ Approva"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={isRejectionDialogOpen && selectedMember?.member_id === member.member_id} onOpenChange={setIsRejectionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedMember(member)}
                                disabled={actionLoading === member.member_id}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Rifiuta
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rifiuta {member.user_email}</DialogTitle>
                                <DialogDescription>
                                  Sei sicuro di voler rifiutare la richiesta di {member.user_email}? Questa azione non può essere annullata.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Motivo del rifiuto (opzionale)</Label>
                                  <Textarea
                                    id="reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Specifica il motivo del rifiuto..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsRejectionDialogOpen(false);
                                    setSelectedMember(null);
                                    setRejectionReason('');
                                  }}
                                >
                                  Annulla
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(member)}
                                  disabled={actionLoading === member.member_id}
                                >
                                  {actionLoading === member.member_id ? "Rifiutando..." : "❌ Rifiuta"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovals;