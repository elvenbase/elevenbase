
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, BarChart3, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayersWithAttendance, useDeletePlayer } from '@/hooks/useSupabaseData';
import { useAvatarColor } from '@/hooks/useAvatarColor';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { PlayerForm } from '@/components/forms/PlayerForm';
import EditPlayerForm from '@/components/forms/EditPlayerForm';
import PlayerStatsModal from '@/components/forms/PlayerStatsModal';

type SortField = 'name' | 'jersey_number' | 'position' | 'phone' | 'presences' | 'tardiness' | 'attendanceRate' | 'status';
type SortDirection = 'asc' | 'desc';

// Mobile Player Card Component
interface MobilePlayerCardProps {
  player: any;
  onImageClick: (player: any) => void;
  onDelete: (playerId: string) => void;
  formatWhatsAppLink: (phone: string, name: string) => string;
  getAvatarBackground: (name: string) => any;
}

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({ 
  player, 
  onImageClick, 
  onDelete, 
  formatWhatsAppLink, 
  getAvatarBackground 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Main Info - Always Visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar 
            className="h-12 w-12 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-lg flex-shrink-0"
            onClick={() => onImageClick(player)}
            style={getAvatarBackground(player.first_name + player.last_name)}
          >
            <AvatarImage 
              src={player.avatar_url || undefined} 
              alt={`${player.first_name} ${player.last_name}`} 
            />
            <AvatarFallback className="text-white font-bold">
              {player.first_name.charAt(0)}{player.last_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">
                {player.first_name} {player.last_name}
              </h3>
              {player.jersey_number && (
                <Badge variant="outline" className="text-xs">
                  #{player.jersey_number}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="truncate">{player.position || 'Posizione non specificata'}</span>
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

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Stats - Always Visible */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Presenze:</span>
            <Badge variant="secondary" className="text-xs">
              {player.presences || 0}/{player.totalEvents || 0}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Ritardi:</span>
            <Badge variant={player.tardiness > 0 ? "destructive" : "outline"} className="text-xs">
              {player.tardiness || 0}
            </Badge>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <EditPlayerForm player={player}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-3 w-3" />
            </Button>
          </EditPlayerForm>
          
          <PlayerStatsModal player={player}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <BarChart3 className="h-3 w-3" />
            </Button>
          </PlayerStatsModal>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {/* Contact Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Contatti</h4>
            {player.phone ? (
              <div className="flex items-center justify-between">
                <span className="text-sm">{player.phone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 px-2"
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
              <span className="text-sm text-muted-foreground">Telefono non specificato</span>
            )}
          </div>

          {/* Detailed Stats */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Statistiche Dettagliate</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Presenze:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
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
                <span className="text-muted-foreground">Ritardi:</span>
                <div className="mt-1">
                  <Badge variant={player.tardiness > 0 ? "destructive" : "outline"}>
                    {player.tardiness || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <EditPlayerForm player={player}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              </EditPlayerForm>
              
              <PlayerStatsModal player={player}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiche
                </Button>
              </PlayerStatsModal>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
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
      )}
    </Card>
  );
};

const Squad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { getAvatarBackground } = useAvatarColor();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  
  // Stato per la modale dell'immagine del giocatore
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPlayerImage, setSelectedPlayerImage] = useState<{
    src: string;
    name: string;
    fallback: string;
  } | null>(null);
  
  const { data: players = [], isLoading } = usePlayersWithAttendance(dateRange?.from, dateRange?.to);
  const deletePlayer = useDeletePlayer();

  const formatWhatsAppLink = (phone: string, firstName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Ciao%20${firstName}`;
  };

  const openImageModal = (player: any) => {
    setSelectedPlayerImage({
      src: player.avatar_url || '',
      name: `${player.first_name} ${player.last_name}`,
      fallback: `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`
    });
    setImageModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const matchesSearch = 
        player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.jersey_number && player.jersey_number.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
          aValue = (a as any).presences || 0;
          bValue = (b as any).presences || 0;
          break;
        case 'tardiness':
          aValue = (a as any).tardiness || 0;
          bValue = (b as any).tardiness || 0;
          break;
        case 'attendanceRate':
          aValue = (a as any).attendanceRate || 0;
          bValue = (b as any).attendanceRate || 0;
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

    return filtered;
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <PlayerForm />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cerca giocatore..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div>
                <label className="text-sm font-medium mb-2 block">Periodo di analisi presenze allenamenti:</label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  placeholder="Seleziona periodo"
                />
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className="text-sm text-muted-foreground pt-6">
                  Statistiche allenamenti calcolate per il periodo selezionato
                </div>
              )}
            </div>
          </div>

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
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold">
                          Nome/Cognome {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('jersey_number')} className="h-auto p-0 font-semibold">
                          Numero {getSortIcon('jersey_number')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('position')} className="h-auto p-0 font-semibold">
                          Posizione {getSortIcon('position')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('phone')} className="h-auto p-0 font-semibold">
                          Telefono {getSortIcon('phone')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('presences')} className="h-auto p-0 font-semibold">
                          Presenze Allenamenti {getSortIcon('presences')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('tardiness')} className="h-auto p-0 font-semibold">
                          Ritardi Allenamenti {getSortIcon('tardiness')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-semibold">
                          Stato {getSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar 
                              className="h-10 w-10 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-lg"
                              onClick={() => openImageModal(player)}
                              style={getAvatarBackground(player.first_name + player.last_name)}
                            >
                              <AvatarImage 
                                src={(player as any).avatar_url || undefined} 
                                alt={`${player.first_name} ${player.last_name}`} 
                              />
                              <AvatarFallback 
                                className="text-white font-bold"
                              >
                                {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{player.first_name} {player.last_name}</div>
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
                              {(player as any).presences || 0}/{(player as any).totalEvents || 0}
                            </Badge>
                            {(player as any).totalEvents > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({(player as any).attendanceRate}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(player as any).tardiness > 0 ? "destructive" : "outline"}>
                            {(player as any).tardiness || 0}
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
              <div className="block xl:hidden space-y-3">
                {filteredAndSortedPlayers.map((player) => (
                  <MobilePlayerCard 
                    key={player.id}
                    player={player}
                    onImageClick={openImageModal}
                    onDelete={handleDeletePlayer}
                    formatWhatsAppLink={formatWhatsAppLink}
                    getAvatarBackground={getAvatarBackground}
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
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPlayerImage?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
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
