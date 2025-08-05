
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, BarChart3, MessageSquare, ChevronDown, ChevronUp, ArrowUpDown, Filter, Settings } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { usePlayersWithAttendance, useDeletePlayer } from '@/hooks/useSupabaseData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { PlayerForm } from '@/components/forms/PlayerForm';
import EditPlayerForm from '@/components/forms/EditPlayerForm';
import PlayerStatsModal from '@/components/forms/PlayerStatsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SortField = 'name' | 'jersey_number' | 'position' | 'phone' | 'presences' | 'tardiness' | 'attendanceRate' | 'status';
type SortDirection = 'asc' | 'desc';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: number;
  position?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'injured' | 'suspended';
  avatar_url?: string;
  presences?: number;
  tardiness?: number;
  attendanceRate?: number;
  totalEvents?: number;
  ea_sports_id?: string;
  gaming_platform?: string;
  platform_id?: string;
  is_captain?: boolean; // 🔧 NUOVO: Campo capitano (opzionale per compatibilità)
}



// Mobile Player Card Component
interface MobilePlayerCardProps {
  player: Player;
  onImageClick: (player: Player) => void;
  onDelete: (playerId: string) => void;
  formatWhatsAppLink: (phone: string, name: string) => string;
}

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({ 
  player, 
  onImageClick, 
  onDelete, 
  formatWhatsAppLink
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Main Info - Always Visible - SIMPLIFIED */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <PlayerAvatar
            firstName={player.first_name}
            lastName={player.last_name}
            avatarUrl={player.avatar_url}
            size="lg"
            className="cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-lg flex-shrink-0"
            onClick={() => onImageClick(player)}
          />
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-tight">
                {player.first_name} {player.last_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {player.jersey_number && (
                  <Badge variant="outline" className="text-xs">
                    #{player.jersey_number}
                  </Badge>
                )}
                {player.is_captain && (
                  <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                    ⭐ Capitano
                  </Badge>
                )}
                <Badge 
                  variant={
                    player.status === 'active' ? 'default' :
                    player.status === 'injured' ? 'destructive' :
                    player.status === 'suspended' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {player.status === 'active' ? 'Attivo' :
                   player.status === 'inactive' ? 'Inattivo' :
                   player.status === 'injured' ? 'Infortunato' :
                   player.status === 'suspended' ? 'Squalificato' : player.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 h-10 w-10 p-0 mt-1"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t space-y-4">
          {/* Info Giocatore */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Informazioni Giocatore</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Posizione</span>
                <div className="text-sm font-medium mt-1">
                  {player.position || 'Non specificata'}
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Statistiche Allenamenti</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Presenze</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {player.presences || 0}/{player.totalEvents || 0}
                  </Badge>
                  {player.totalEvents > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({player.attendanceRate}%)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Ritardi</span>
                <div className="mt-1">
                  <Badge variant={player.tardiness > 0 ? "destructive" : "outline"} className="text-xs">
                    {player.tardiness || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Contatti</h4>
            {player.phone ? (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <span className="text-sm font-medium">{player.phone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 px-3"
                >
                  <a
                    href={formatWhatsAppLink(player.phone, player.first_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
                Telefono non specificato
              </div>
            )}
          </div>

          {/* Gaming Info */}
          {(player.ea_sport_id || player.gaming_platform) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Dati Gaming</h4>
              <div className="bg-muted/20 rounded-lg p-3 space-y-3">
                {player.ea_sport_id && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">EA Sports ID</span>
                    <div className="mt-1 font-mono text-sm bg-muted px-3 py-2 rounded border">
                      {player.ea_sport_id}
                    </div>
                  </div>
                )}
                {player.gaming_platform && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Piattaforma</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {player.gaming_platform}
                      </Badge>
                      {player.platform_id && (
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {player.platform_id}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Azioni</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <EditPlayerForm player={player} />
                <PlayerStatsModal player={player}>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistiche
                  </Button>
                </PlayerStatsModal>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina giocatore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Elimina giocatore</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione rimuoverà definitivamente <strong>{player.first_name} {player.last_name}</strong> dalla rosa della squadra. Tutti i dati associati verranno eliminati.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(player.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Elimina
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const Squad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [selectedCaptain, setSelectedCaptain] = useState<string>('none');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Stato per la modale dell'immagine del giocatore
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPlayerImage, setSelectedPlayerImage] = useState<{
    src: string;
    name: string;
    fallback: string;
  } | null>(null);
  
  const { data: players = [], isLoading } = usePlayersWithAttendance(dateRange?.from, dateRange?.to);
  const deletePlayer = useDeletePlayer();

  // Carica capitano attuale al mount e quando cambiano i players
  React.useEffect(() => {
    const currentCaptain = players.find(p => p.is_captain);
    if (currentCaptain) {
      setSelectedCaptain(currentCaptain.id);
    } else {
      setSelectedCaptain('none');
    }
  }, [players]);

  // Funzione per aggiornare il capitano
  const updateCaptain = async (newCaptainId: string) => {
    try {
      // Rimuovi is_captain da tutti i giocatori
      await supabase
        .from('players')
        .update({ is_captain: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update tutti

      // Se selezionato un capitano (non "none"), impostalo
      if (newCaptainId && newCaptainId !== 'none') {
        const { error } = await supabase
          .from('players')
          .update({ is_captain: true })
          .eq('id', newCaptainId);

        if (error) throw error;
        
        const captain = players.find(p => p.id === newCaptainId);
        toast.success(`${captain?.first_name} ${captain?.last_name} è ora il capitano`);
      } else {
        toast.success('Nessun capitano selezionato');
      }
    } catch (error) {
      console.error('🔥 ERRORE DETTAGLIATO CAPITANO:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      toast.error(`Errore nell'aggiornamento del capitano: ${error?.message || error}`);
      // Revert UI state
      const currentCaptain = players.find(p => p.is_captain);
      setSelectedCaptain(currentCaptain?.id || 'none');
    }
  };

  // Salva quando cambia la selezione del capitano
  React.useEffect(() => {
    const currentCaptain = players.find(p => p.is_captain);
    const currentCaptainId = currentCaptain?.id || 'none';
    
    // Solo se è cambiato davvero e non è il caricamento iniziale
    if (selectedCaptain !== currentCaptainId && players.length > 0) {
      updateCaptain(selectedCaptain);
    }
  }, [selectedCaptain]);

  const formatWhatsAppLink = (phone: string, firstName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Ciao%20${firstName}`;
  };

  const openImageModal = (player: Player) => {
    setSelectedPlayerImage({
      src: player.avatar_url || '',
      name: `${player.first_name} ${player.last_name}`,
      fallback: `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`
    });
    setImageModalOpen(true);
  };



  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = players.filter(player => {
      const matchesSearch = 
        player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.jersey_number && player.jersey_number.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase();
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase();
          break;
        case 'jersey_number':
          aValue = a.jersey_number || 0;
          bValue = b.jersey_number || 0;
          break;
        case 'position':
          aValue = a.position || '';
          bValue = b.position || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'presences':
          aValue = a.presences || 0;
          bValue = b.presences || 0;
          break;
        case 'tardiness':
          aValue = a.tardiness || 0;
          bValue = b.tardiness || 0;
          break;
        case 'attendanceRate':
          aValue = a.attendanceRate || 0;
          bValue = b.attendanceRate || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.last_name;
          bValue = b.last_name;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [players, searchTerm, statusFilter, sortField, sortDirection]);

  const handleDeletePlayer = async (playerId: string) => {
    console.log('🗑️ Attempting to delete player with ID:', playerId);
    try {
      console.log('🔄 Calling deletePlayer.mutateAsync...');
      await deletePlayer.mutateAsync(playerId);
      console.log('✅ Player deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting player:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Rosa Squadra</CardTitle>
          <CardDescription>
            Gestisci i giocatori della squadra con statistiche di presenze e ritardi agli allenamenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controlli principali - sempre visibili */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PlayerForm />
                <div className="w-full sm:w-auto">
                  <label className="text-sm font-medium block mb-2">Capitano squadra:</label>
                  <Select value={selectedCaptain} onValueChange={setSelectedCaptain}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Seleziona capitano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      {players.filter(p => p.status === 'active').map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.first_name} {player.last_name}
                          {player.jersey_number ? ` (#${player.jersey_number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Search - sempre visibile */}
              <div>
                <Input
                  placeholder="Cerca giocatore..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Toggle filtri avanzati */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium text-muted-foreground">
                  {filteredAndSortedPlayers.length} giocatori
                  {searchTerm && ` (filtrati)`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtri avanzati</span>
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Filtri avanzati - collassabili */}
            {showAdvancedFilters && (
              <div className="space-y-4 pt-4 border-t bg-muted/20 rounded-lg p-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Filtra per stato:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtra per stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="inactive">Inattivo</SelectItem>
                        <SelectItem value="injured">Infortunato</SelectItem>
                        <SelectItem value="suspended">Squalificato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Ordina per:</label>
                      <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nome/Cognome</SelectItem>
                          <SelectItem value="jersey_number">Numero di maglia</SelectItem>
                          <SelectItem value="position">Posizione</SelectItem>
                          <SelectItem value="phone">Telefono</SelectItem>
                          <SelectItem value="presences">Presenze allenamenti</SelectItem>
                          <SelectItem value="tardiness">Ritardi allenamenti</SelectItem>
                          <SelectItem value="attendanceRate">Percentuale presenze</SelectItem>
                          <SelectItem value="status">Stato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Direzione:</label>
                      <Select value={sortDirection} onValueChange={(value: SortDirection) => setSortDirection(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Ordine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Crescente</SelectItem>
                          <SelectItem value="desc">Decrescente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium block mb-2">Periodo analisi presenze:</label>
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      placeholder="Seleziona periodo"
                    />
                    {dateRange?.from && dateRange?.to && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Statistiche allenamenti calcolate per il periodo selezionato
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">

          {isLoading ? (
            <div className="text-center py-8">Caricamento giocatori...</div>
          ) : filteredAndSortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'Nessun giocatore trovato con i filtri selezionati.' : 'Nessun giocatore presente. Aggiungi il primo giocatore!'}
            </div>
          ) : (
            <>
              {/* Desktop Table (1100px and above) */}
              <div className="hidden xl:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nome/Cognome</TableHead>
                      <TableHead className="font-semibold">Numero</TableHead>
                      <TableHead className="font-semibold">Posizione</TableHead>
                      <TableHead className="font-semibold">Telefono</TableHead>
                      <TableHead className="font-semibold">Presenze Allenamenti</TableHead>
                      <TableHead className="font-semibold">Ritardi Allenamenti</TableHead>
                      <TableHead className="font-semibold">Stato</TableHead>
                      <TableHead className="text-right font-semibold">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              firstName={player.first_name}
                              lastName={player.last_name}
                              avatarUrl={player.avatar_url}
                              size="md"
                              className="cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-lg"
                              onClick={() => openImageModal(player)}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{player.first_name} {player.last_name}</span>
                                {player.is_captain && (
                                  <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                                    ⭐ Capitano
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {player.jersey_number && (
                            <Badge variant="outline">#{player.jersey_number}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{player.position || '-'}</TableCell>
                        <TableCell>
                          {player.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{player.phone}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-6 px-2"
                              >
                                <a
                                  href={formatWhatsAppLink(player.phone, player.first_name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {player.presences || 0}/{player.totalEvents || 0}
                            </Badge>
                            {player.totalEvents > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({player.attendanceRate}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={player.tardiness > 0 ? "destructive" : "outline"}>
                            {player.tardiness || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              player.status === 'active' ? 'default' :
                              player.status === 'injured' ? 'destructive' :
                              player.status === 'suspended' ? 'secondary' : 'outline'
                            }
                          >
                            {player.status === 'active' ? 'Attivo' :
                             player.status === 'inactive' ? 'Inattivo' :
                             player.status === 'injured' ? 'Infortunato' :
                             player.status === 'suspended' ? 'Squalificato' : player.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditPlayerForm player={player} />
                            
                            <PlayerStatsModal player={player} />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina giocatore</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione rimuoverà definitivamente <strong>{player.first_name} {player.last_name}</strong> dalla rosa della squadra. Tutti i dati associati verranno eliminati.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePlayer(player.id)}
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

              {/* Mobile Cards (under 1100px) */}
              <div className="block xl:hidden space-y-4 sm:space-y-5">
                {filteredAndSortedPlayers.map((player) => (
                  <MobilePlayerCard 
                    key={player.id}
                    player={player}
                    onImageClick={openImageModal}
                    onDelete={handleDeletePlayer}
                    formatWhatsAppLink={formatWhatsAppLink}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modale per visualizzare l'immagine del giocatore */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {selectedPlayerImage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            <div className="flex justify-center">
              {selectedPlayerImage?.src ? (
                <img
                  src={selectedPlayerImage.src}
                  alt={selectedPlayerImage.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    // Se l'immagine non carica, mostra il fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`max-w-full max-h-[60vh] w-64 h-64 rounded-lg shadow-lg flex items-center justify-center text-6xl font-bold text-white bg-gradient-to-br from-primary to-primary/80 ${
                  selectedPlayerImage?.src ? 'hidden' : 'flex'
                }`}
              >
                {selectedPlayerImage?.fallback}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Squad;
