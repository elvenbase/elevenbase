import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCheck, UserX, UserPlus, Shield, Clock, CheckCircle, XCircle, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'founder' | 'admin' | 'player';
  status: 'active' | 'pending' | 'suspended';
  ea_sports_id?: string;
  joined_at: string;
  approved_at?: string;
  invited_by?: string;
  approved_by?: string;
  notes?: string;
  user?: {
    email: string;
    profiles?: {
      first_name?: string;
      last_name?: string;
    };
  };
  inviter?: {
    email: string;
  };
  approver?: {
    email: string;
  };
}

interface TeamInvite {
  id: string;
  code: string;
  role: 'admin' | 'player';
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    email: string;
  };
}

const UserManagement = () => {
  const { user: currentUser, registrationStatus } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modals
  const [isCreateInviteOpen, setIsCreateInviteOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Form states
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'player'>('player');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState(1);
  const [newInviteExpireDays, setNewInviteExpireDays] = useState(7);
  const [approvalNotes, setApprovalNotes] = useState('');

  const currentTeamId = registrationStatus?.team_id;

  useEffect(() => {
    if (currentTeamId) {
      fetchTeamMembers();
      fetchTeamInvites();
    }
  }, [currentTeamId]);

  const fetchTeamMembers = async () => {
    if (!currentTeamId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:auth.users!user_id(email),
          inviter:auth.users!invited_by(email),
          approver:auth.users!approved_by(email)
        `)
        .eq('team_id', currentTeamId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast.error('Errore nel caricamento membri del team');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamInvites = async () => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          creator:auth.users!created_by(email)
        `)
        .eq('team_id', currentTeamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamInvites(data || []);
    } catch (error: any) {
      console.error('Error fetching team invites:', error);
    }
  };

  const createInvite = async () => {
    if (!currentTeamId) {
      toast.error('Team ID non trovato');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('generate_team_invite', {
        _team_id: currentTeamId,
        _role: newInviteRole,
        _max_uses: newInviteMaxUses,
        _expires_days: newInviteExpireDays
      });

      if (error) throw error;

      toast.success(`Codice invito ${newInviteRole} creato: ${data.code}`);
      setIsCreateInviteOpen(false);
      fetchTeamInvites();
      
      // Reset form
      setNewInviteRole('player');
      setNewInviteMaxUses(1);
      setNewInviteExpireDays(7);
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast.error(error.message || 'Errore nella creazione del codice invito');
    }
  };

  const approveMember = async (approve: boolean) => {
    if (!selectedMember) return;

    try {
      if (approve) {
        const { error } = await supabase.rpc('approve_team_member', {
          _member_id: selectedMember.id,
          _notes: approvalNotes || null
        });
        if (error) throw error;
        toast.success('Membro approvato con successo');
      } else {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', selectedMember.id);
        if (error) throw error;
        toast.success('Richiesta rifiutata');
      }

      setIsApprovalModalOpen(false);
      setSelectedMember(null);
      setApprovalNotes('');
      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error('Errore nell\'elaborazione della richiesta');
    }
  };

  const suspendMember = async (memberId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          status: suspend ? 'suspended' : 'active',
          notes: suspend ? 'Sospeso manualmente' : 'Riattivato manualmente'
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success(suspend ? 'Membro sospeso' : 'Membro riattivato');
      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error updating member status:', error);
      toast.error('Errore nell\'aggiornamento dello status');
    }
  };

  const copyInviteLink = (code: string, role: string) => {
    const link = `${window.location.origin}/register-invite?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link invito ${role} copiato!`);
  };

  const toggleInvite = async (inviteId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('team_invites')
        .update({ is_active: !isActive })
        .eq('id', inviteId);

      if (error) throw error;
      
      toast.success(`Invito ${!isActive ? 'attivato' : 'disattivato'}`);
      fetchTeamInvites();
    } catch (error: any) {
      console.error('Error toggling invite:', error);
      toast.error('Errore nell\'aggiornamento dell\'invito');
    }
  };

  // Filtering
  const filteredMembers = teamMembers.filter(member => {
    const searchMatch = !searchTerm || 
      member.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.ea_sports_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'all' || member.status === statusFilter;
    const roleMatch = roleFilter === 'all' || member.role === roleFilter;
    
    return searchMatch && statusMatch && roleMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Attivo</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />In Attesa</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Sospeso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'founder':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Founder</Badge>;
      case 'admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><UserCheck className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'player':
        return <Badge variant="outline">🎮 Player</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (!currentUser || !currentTeamId) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Accesso non autorizzato o team non trovato</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Team</h1>
          <p className="text-gray-600">
            Team: <span className="font-medium">{registrationStatus?.team_name}</span>
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateInviteOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Crea Invito
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{teamMembers.filter(m => m.status === 'active').length}</div>
            <p className="text-sm text-gray-600">Membri Attivi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{teamMembers.filter(m => m.status === 'pending').length}</div>
            <p className="text-sm text-gray-600">In Attesa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{teamMembers.filter(m => m.status === 'suspended').length}</div>
            <p className="text-sm text-gray-600">Sospesi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{teamInvites.filter(i => i.is_active).length}</div>
            <p className="text-sm text-gray-600">Inviti Attivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Cerca per email, nome o EA Sports ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli Status</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="pending">In Attesa</SelectItem>
                <SelectItem value="suspended">Sospesi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Ruoli</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="player">Player</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => { fetchTeamMembers(); fetchTeamInvites(); }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membri del Team ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Gestisci i membri del tuo team: approva, sospendi o rimuovi utenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento membri...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>EA Sports ID</TableHead>
                    <TableHead>Registrato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.user?.email}</div>
                          {(member.user?.profiles?.first_name || member.user?.profiles?.last_name) && (
                            <div className="text-sm text-gray-500">
                              {member.user?.profiles?.first_name} {member.user?.profiles?.last_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {member.ea_sports_id ? (
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {member.ea_sports_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(member.joined_at).toLocaleDateString('it-IT')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsApprovalModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {member.status === 'active' && member.role !== 'founder' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendMember(member.id, true)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {member.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendMember(member.id, false)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nessun membro trovato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Codici Invito ({teamInvites.length})</CardTitle>
          <CardDescription>
            Gestisci i codici invito per far entrare nuovi membri nel team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Utilizzi</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {invite.code}
                      </span>
                    </TableCell>
                    <TableCell>{getRoleBadge(invite.role)}</TableCell>
                    <TableCell>
                      <span className={invite.used_count >= invite.max_uses ? 'text-red-600' : 'text-green-600'}>
                        {invite.used_count}/{invite.max_uses}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(invite.expires_at).toLocaleDateString('it-IT')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invite.is_active && new Date(invite.expires_at) > new Date() && invite.used_count < invite.max_uses ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary">Inattivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invite.code, invite.role)}
                          className="flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copia Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleInvite(invite.id, invite.is_active)}
                          className={invite.is_active ? 'text-red-600' : 'text-green-600'}
                        >
                          {invite.is_active ? 'Disattiva' : 'Attiva'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {teamInvites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nessun invito creato
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Invite Modal */}
      <Dialog open={isCreateInviteOpen} onOpenChange={setIsCreateInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Nuovo Invito</DialogTitle>
            <DialogDescription>
              Genera un codice invito per aggiungere nuovi membri al team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ruolo</label>
              <Select value={newInviteRole} onValueChange={(value: 'admin' | 'player') => setNewInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Utilizzi Massimi</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={newInviteMaxUses}
                onChange={(e) => setNewInviteMaxUses(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Scadenza (giorni)</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={newInviteExpireDays}
                onChange={(e) => setNewInviteExpireDays(parseInt(e.target.value) || 7)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInviteOpen(false)}>
              Annulla
            </Button>
            <Button onClick={createInvite}>
              Crea Invito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approva Membro</DialogTitle>
            <DialogDescription>
              Vuoi approvare {selectedMember?.user?.email} come {selectedMember?.role}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Aggiungi note per l'approvazione..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => approveMember(false)}
              className="text-red-600 hover:text-red-700"
            >
              Rifiuta
            </Button>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => approveMember(true)}>
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;