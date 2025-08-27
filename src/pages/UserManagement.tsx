import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Edit, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    status?: 'active' | 'inactive';
  };
  user_roles?: Array<{
    role: 'superadmin' | 'admin' | 'coach' | 'player';
  }>;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Form states
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'superadmin' | 'admin' | 'coach' | 'player'>('player');
  const [showPassword, setShowPassword] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'admin' | 'coach' | 'player'>('player');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const { user: currentUser } = useAuth();

  const roles: Array<{
    value: 'superadmin' | 'admin' | 'coach' | 'player';
    label: string;
    color: 'default' | 'destructive' | 'outline' | 'secondary';
  }> = [
    { value: 'superadmin', label: 'Super Admin', color: 'destructive' },
    { value: 'admin', label: 'Admin', color: 'default' },
    { value: 'coach', label: 'Coach', color: 'secondary' },
    { value: 'player', label: 'Player', color: 'outline' }
  ];

  useEffect(() => {
    checkUserPermissions();
    fetchUsers();
  }, []);

  const checkUserPermissions = async () => {
    if (!currentUser) return;

    // Superadmin globale
    const { data: isSuperAdmin } = await supabase.rpc('has_role', { _user_id: currentUser.id, _role: 'superadmin' });
    if (isSuperAdmin) return;

    // Team corrente
    let currentTeamId = localStorage.getItem('currentTeamId');
    if (!currentTeamId) {
      const { data: tm } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (tm?.team_id) {
        currentTeamId = tm.team_id;
        localStorage.setItem('currentTeamId', currentTeamId);
      }
    }

    if (!currentTeamId) {
      toast.error('Nessun team corrente selezionato');
      return;
    }

    // Founder = owner è admin
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', currentTeamId)
      .maybeSingle();
    if (team?.owner_id === currentUser.id) return;

    // Permesso admin di team
    const { data: canManage } = await supabase.rpc('has_team_permission', { _team_id: currentTeamId, _permission: 'manage_team' });
    if (!canManage) {
      toast.error('Non hai i permessi per accedere a questa sezione');
      return;
    }
  };

  const generateInvite = async () => {
    try {
      let currentTeamId = localStorage.getItem('currentTeamId');
      if (!currentTeamId) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: tm } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          if (tm?.team_id) {
            currentTeamId = tm.team_id;
            localStorage.setItem('currentTeamId', currentTeamId);
          }
        }
      }

      if (!currentTeamId) throw new Error('Nessun team selezionato');

      // Genera un codice invito random locale, poi salva con RLS
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      const { error } = await supabase
        .from('team_invites')
        .insert({ team_id: currentTeamId, code, role: inviteRole });
      if (error) throw error;

      setInviteCode(code);
      toast.success('Codice invito generato');
    } catch (err: any) {
      console.error('Errore generazione invito:', err);
      toast.error('Errore nella generazione del codice invito');
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Team corrente
      let currentTeamId = localStorage.getItem('currentTeamId');
      if (!currentTeamId) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: tm } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          if (tm?.team_id) {
            currentTeamId = tm.team_id;
            localStorage.setItem('currentTeamId', currentTeamId);
          }
        }
      }

      if (!currentTeamId) throw new Error('Nessun team selezionato');

      console.log('🔍 UserManagement: Loading users for team:', currentTeamId);

      // Profili SOLO degli utenti del team corrente
      const { data: teamUsers, error: teamUsersErr } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', currentTeamId)
        .in('status', ['active', 'pending']);
      
      console.log('🔍 UserManagement: Team users found:', teamUsers);
      if (teamUsersErr) {
        console.error('🔍 UserManagement: Team users error:', teamUsersErr);
        throw teamUsersErr;
      }

      const userIds = (teamUsers || []).map(u => u.user_id);
      if (userIds.length === 0) { setUsers([]); return; }

      console.log('🔍 UserManagement: Looking for profiles with IDs:', userIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, phone, status, created_at')
        .in('id', userIds);
      
      console.log('🔍 UserManagement: Profiles found:', profiles);
      if (profilesError) {
        console.error('🔍 UserManagement: Profiles error:', profilesError);
        throw profilesError;
      }

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Ruolo di team (se esiste) per il team corrente
          const { data: teamRole } = await supabase
            .from('team_members')
            .select('role,status')
            .eq('team_id', currentTeamId!)
            .eq('user_id', profile.id)
            .maybeSingle();

          return {
            id: profile.id,
            email: profile.username || 'N/A',
            created_at: profile.created_at,
            profiles: { 
              username: profile.username,
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone: profile.phone,
              status: (profile.status as 'active' | 'inactive') || 'inactive'
            },
            user_roles: teamRole?.role ? [{ role: (teamRole.role as any) }] : []
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserUsername || !newUserPassword || !newUserFirstName || !newUserLastName) {
        toast.error('Username, nome, cognome e password sono obbligatori');
        return;
      }

      if (newUserRole === 'player' && !newUserPhone) {
        toast.error('Il telefono è obbligatorio per i giocatori');
        return;
      }

      // Generate fake email if none provided
      const email = newUserEmail || `${newUserUsername.toLowerCase()}@users.com`;
      
      // Call edge function to create user in auth system
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password: newUserPassword,
          username: newUserUsername,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          phone: newUserPhone,
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Assegna il ruolo (prima elimina quello di default creato dal trigger)
      if (data.user) {
        // Elimina il ruolo di default creato dal trigger
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', data.user.id);

        // Assegna il ruolo selezionato
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: newUserRole as any
          });

        // Se il ruolo è "player", crea anche l'entry nella tabella players
        if (newUserRole === 'player') {
          // Get current team ID for the player
          let currentTeamId = localStorage.getItem('currentTeamId');
          
          // If no team in localStorage, try to get it from current user's team membership
          if (!currentTeamId) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', currentUser.id)
                .single();
              
              if (teamMember) {
                currentTeamId = teamMember.team_id;
                localStorage.setItem('currentTeamId', currentTeamId);
              }
            }
          }

          if (!currentTeamId) {
            throw new Error('No team found - cannot create player without team association');
          }

          console.log('Creating player in UserManagement with team_id:', currentTeamId);

          await supabase
            .from('players')
            .insert({
              first_name: newUserFirstName,
              last_name: newUserLastName,
              phone: newUserPhone,
              team_id: currentTeamId
            });
        }
      }

      toast.success(`Utente creato con successo. Email: ${email}, Password: ${newUserPassword}`);
      setIsCreateModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Errore nella creazione dell\'utente: ' + error.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'superadmin' | 'admin' | 'coach' | 'player') => {
    try {

      
      // Rimuovi tutti i ruoli esistenti
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing roles:', deleteError);
      }

      // Aggiungi il nuovo ruolo
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as any
        });

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }

      toast.success('Ruolo aggiornato con successo');
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Errore nell\'aggiornamento del ruolo: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {

      
      // Call edge function to delete user from auth system and database
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Errore nell\'eliminazione dell\'utente: ' + error.message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {

      
      // Prepare update data
      const updateData: any = {
        userId: selectedUser.id
      };
      
      if (newUserUsername !== selectedUser.profiles?.username) {
        updateData.username = newUserUsername;
      }
      if (newUserFirstName !== selectedUser.profiles?.first_name) {
        updateData.firstName = newUserFirstName;
      }
      if (newUserLastName !== selectedUser.profiles?.last_name) {
        updateData.lastName = newUserLastName;
      }
      if (newUserPhone !== selectedUser.profiles?.phone) {
        updateData.phone = newUserPhone;
      }
      if (newUserEmail && newUserEmail !== selectedUser.email) {
        updateData.email = newUserEmail;
      }
      if (newUserPassword) {
        updateData.password = newUserPassword;
      }

      // Call edge function to update user
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: updateData
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Errore nell\'aggiornamento dell\'utente: ' + error.message);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewUserUsername(user.profiles?.username || '');
    setNewUserFirstName(user.profiles?.first_name || '');
    setNewUserLastName(user.profiles?.last_name || '');
    setNewUserPhone(user.profiles?.phone || '');
    setNewUserEmail(user.email || '');
    setNewUserPassword('');
    setNewUserRole(user.user_roles?.[0]?.role || 'player');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setNewUserUsername('');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserPhone('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('player');
    setShowPassword(false);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const activate = currentStatus === 'inactive';
      
      // Call edge function to activate/deactivate user
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: {
          userId,
          activate
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error('Errore nel cambiamento dello stato utente: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    
    const userRole = user.user_roles?.[0]?.role;
    return matchesSearch && userRole === roleFilter;
  });

  const getRoleBadgeColor = (role: 'superadmin' | 'admin' | 'coach' | 'player'): 'default' | 'destructive' | 'outline' | 'secondary' => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'outline';
  };

  const getRoleLabel = (role: 'superadmin' | 'admin' | 'coach' | 'player') => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Gestione Utenti
          </CardTitle>
          <CardDescription>
            Amministra gli utenti del sistema, assegna ruoli e gestisci i permessi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="Cerca utenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtra per ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i ruoli</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuovo Utente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Utente</DialogTitle>
                  <DialogDescription>
                    Inserisci i dati per creare un nuovo utente del sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder="Nome utente"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome</Label>
                      <Input
                        id="firstName"
                        value={newUserFirstName}
                        onChange={(e) => setNewUserFirstName(e.target.value)}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome</Label>
                      <Input
                        id="lastName"
                        value={newUserLastName}
                        onChange={(e) => setNewUserLastName(e.target.value)}
                        placeholder="Cognome"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono {newUserRole === 'player' && <span className="text-destructive">*</span>}</Label>
                    <Input
                      id="phone"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="+39 123 456 7890"
                      required={newUserRole === 'player'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (opzionale)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="utente@esempio.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Password sicura"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Ruolo</Label>
                    <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Crea Utente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal di Modifica */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifica Utente</DialogTitle>
                  <DialogDescription>
                    Modifica i dati dell'utente selezionato
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder="Nome utente"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-firstName">Nome</Label>
                      <Input
                        id="edit-firstName"
                        value={newUserFirstName}
                        onChange={(e) => setNewUserFirstName(e.target.value)}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName">Cognome</Label>
                      <Input
                        id="edit-lastName"
                        value={newUserLastName}
                        onChange={(e) => setNewUserLastName(e.target.value)}
                        placeholder="Cognome"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Telefono</Label>
                    <Input
                      id="edit-phone"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="utente@esempio.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-password">Nuova Password (opzionale)</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Lascia vuoto per non modificare"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleEditUser}>
                    Salva Modifiche
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Genera Invito
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Genera codice invito</DialogTitle>
                  <DialogDescription>
                    Crea un codice per unirsi alla squadra corrente con un ruolo specifico.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Ruolo assegnato</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inviteCode && (
                    <div className="p-3 rounded-md border">
                      <div className="text-sm text-muted-foreground">Codice generato</div>
                      <div className="font-mono text-lg">{inviteCode}</div>
                      <div className="text-xs text-muted-foreground mt-1">Condividi con il nuovo membro per unirsi al team.</div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Chiudi</Button>
                  <Button onClick={generateInvite}>Genera</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Caricamento utenti...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun utente trovato con i filtri selezionati.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Creato il</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.profiles?.username || '-'}</TableCell>
                      <TableCell>
                        {user.profiles?.first_name && user.profiles?.last_name 
                          ? `${user.profiles.first_name} ${user.profiles.last_name}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{user.profiles?.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(user.user_roles?.[0]?.role || 'player')}>
                          {getRoleLabel(user.user_roles?.[0]?.role || 'player')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.profiles?.status === 'active' ? 'default' : 'secondary'}>
                          {user.profiles?.status === 'active' ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleToggleUserStatus(user.id, user.profiles?.status || 'inactive')}
                           >
                             {user.profiles?.status === 'active' ? 'Disattiva' : 'Attiva'}
                           </Button>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => openEditModal(user)}
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           
                           <Select
                             value={user.user_roles?.[0]?.role || 'player'}
                             onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole as any)}
                           >
                             <SelectTrigger className="w-32 h-8">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {roles.map(role => (
                                 <SelectItem key={role.value} value={role.value}>
                                   {role.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Elimina utente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare l'utente <strong>{user.email}</strong>? 
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

export default UserManagement;