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
    
    const { data: isSuperAdmin } = await supabase
      .rpc('has_role', { 
        _user_id: currentUser.id, 
        _role: 'superadmin' 
      });

    if (!isSuperAdmin) {
      toast.error('Non hai i permessi per accedere a questa sezione');
      return;
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Recupero i profili esistenti con i ruoli
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          first_name,
          last_name,
          phone,
          created_at
        `);
      
      if (profilesError) throw profilesError;
      
      // Recupero i ruoli per ogni utente
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            id: profile.id,
            email: profile.username || 'N/A',
            created_at: profile.created_at,
            profiles: { 
              username: profile.username,
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone: profile.phone
            },
            user_roles: userRoles || []
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

      // Genera un'email temporanea basata sull'username
      const tempEmail = `${newUserUsername.toLowerCase()}@temp.carissi.com`;

      // Crea l'utente tramite signup normale
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: newUserPassword,
        options: {
          data: {
            username: newUserUsername,
            first_name: newUserFirstName,
            last_name: newUserLastName,
            phone: newUserPhone
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Il profilo viene creato automaticamente dal trigger
        // Assegna il ruolo
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: newUserRole as any
          });

        // Se il ruolo è "player", crea anche l'entry nella tabella players
        if (newUserRole === 'player') {
          await supabase
            .from('players')
            .insert({
              first_name: newUserFirstName,
              last_name: newUserLastName,
              phone: newUserPhone
            });
        }

        toast.success('Utente creato con successo');
        setIsCreateModalOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Errore nella creazione dell\'utente: ' + error.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'superadmin' | 'admin' | 'coach' | 'player') => {
    try {
      // Rimuovi tutti i ruoli esistenti
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Aggiungi il nuovo ruolo
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as any
        });

      if (error) throw error;

      toast.success('Ruolo aggiornato con successo');
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Elimina i ruoli associati
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Elimina il profilo
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      toast.success('Utente eliminato con successo');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Errore nell\'eliminazione dell\'utente');
    }
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
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="+39 123 456 7890"
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
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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