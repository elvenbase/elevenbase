import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, BarChart3, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { usePlayersWithAttendance, useDeletePlayer } from '@/hooks/useSupabaseData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { PlayerForm } from '@/components/forms/PlayerForm';
import EditPlayerForm from '@/components/forms/EditPlayerForm';
import PlayerStatsModal from '@/components/forms/PlayerStatsModal';

type SortField = 'name' | 'jersey_number' | 'position' | 'phone' | 'presences' | 'tardiness' | 'attendanceRate' | 'status';
type SortDirection = 'asc' | 'desc';

const Squad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  
  const { data: players = [], isLoading } = usePlayersWithAttendance(dateRange?.from, dateRange?.to);
  const deletePlayer = useDeletePlayer();

  const formatWhatsAppLink = (phone: string, firstName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Ciao%20${firstName}`;
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
    try {
      await deletePlayer.mutateAsync(playerId);
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Rosa Squadra</CardTitle>
          <CardDescription>
            Gestisci i giocatori della squadra con statistiche presenze e ritardi
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
                <label className="text-sm font-medium mb-2 block">Periodo di analisi presenze:</label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  placeholder="Seleziona periodo"
                />
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className="text-sm text-muted-foreground pt-6">
                  Statistiche calcolate per il periodo selezionato
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
            <div className="overflow-x-auto">
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
                        Presenze {getSortIcon('presences')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('tardiness')} className="h-auto p-0 font-semibold">
                        Ritardi {getSortIcon('tardiness')}
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
                        <div>
                          <div>{player.first_name} {player.last_name}</div>
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
                          
                          <Button variant="outline" size="sm" onClick={() => {}}>
                            <BarChart3 className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Questa azione eliminerà definitivamente il giocatore {player.first_name} {player.last_name} dal database.
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Squad;