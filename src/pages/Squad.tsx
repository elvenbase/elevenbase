
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Edit, Search, Filter } from "lucide-react";
import { players } from "@/data/players";

const Squad = () => {
  const activePlayers = players.filter(player => player.status === 'active');

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
          <Button variant="hero" className="space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Aggiungi Giocatore</span>
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Button variant="outline" className="space-x-2">
            <Search className="h-4 w-4" />
            <span>Cerca</span>
          </Button>
          <Button variant="outline" className="space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filtri</span>
          </Button>
        </div>

        <Card className="bg-card border-border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">
                  Giocatori Attivi ({activePlayers.length})
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
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.firstName}</TableCell>
                    <TableCell>{player.lastName}</TableCell>
                    <TableCell>
                      {player.jerseyNumber ? (
                        <Badge variant="outline">#{player.jerseyNumber}</Badge>
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
                        variant={player.status === 'active' ? 'default' : 'secondary'}
                        className={player.status === 'active' ? 'bg-success/20 text-success' : ''}
                      >
                        {player.status === 'active' ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Squad;
