import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Search, Filter, Trash2 } from "lucide-react";
import { usePlayers, useDeletePlayer } from "@/hooks/useSupabaseData";
import { PlayerForm } from "@/components/forms/PlayerForm";
import EditPlayerForm from "@/components/forms/EditPlayerForm";
import PlayerStatsModal from "@/components/forms/PlayerStatsModal";

const Squad = () => {
  const { data: players = [], isLoading } = usePlayers();
  const deletePlayer = useDeletePlayer();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchTerm === "" || 
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.jersey_number?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || player.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer.mutateAsync(playerId);
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Rosa
            </h1>
            <p className="text-muted-foreground">
              Gestione giocatori e composizione squadra
            </p>
          </div>
          <PlayerForm>
            <Button variant="hero" className="space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Aggiungi Giocatore</span>
            </Button>
          </PlayerForm>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cerca giocatori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="inactive">Inattivi</SelectItem>
                <SelectItem value="injured">Infortunati</SelectItem>
                <SelectItem value="suspended">Squalificati</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-card border-border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">
                  Giocatori ({filteredPlayers.length})
                </h3>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Caricamento...
                    </TableCell>
                  </TableRow>
                ) : filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm || statusFilter !== "all" ? 
                        "Nessun giocatore trovato con i filtri applicati" : 
                        "Nessun giocatore trovato. Aggiungi il primo giocatore!"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.first_name}</TableCell>
                      <TableCell>{player.last_name}</TableCell>
                      <TableCell>
                        {player.jersey_number ? (
                          <Badge variant="outline">#{player.jersey_number}</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {player.position ? (
                          <Badge variant="secondary">{player.position}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Da assegnare</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            player.status === 'active' ? 'default' :
                            player.status === 'injured' ? 'destructive' :
                            player.status === 'suspended' ? 'secondary' : 'outline'
                          }
                          className={
                            player.status === 'active' ? 'bg-success/20 text-success' :
                            player.status === 'injured' ? 'bg-destructive/20 text-destructive' : ''
                          }
                        >
                          {player.status === 'active' ? 'Attivo' :
                           player.status === 'injured' ? 'Infortunato' :
                           player.status === 'suspended' ? 'Squalificato' : 'Inattivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
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
                                <AlertDialogTitle>Elimina Giocatore</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare {player.first_name} {player.last_name}? 
                                  Questa azione non può essere annullata.
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Squad;