import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerStatistics } from "@/hooks/useSupabaseData";
import { BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerStatsModalProps {
  player: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const PlayerStatsModal = ({ player }: PlayerStatsModalProps) => {
  const [open, setOpen] = useState(false);
  const { data: statistics, isLoading } = usePlayerStatistics(player.id);

  const currentSeasonStats = statistics?.[0] || {
    matches_played: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    training_attendance_rate: 0
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Statistiche - {player.first_name} {player.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prestazioni Generali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{currentSeasonStats.matches_played}</div>
                      <div className="text-sm text-muted-foreground">Partite Giocate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{currentSeasonStats.goals}</div>
                      <div className="text-sm text-muted-foreground">Goal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{currentSeasonStats.assists}</div>
                      <div className="text-sm text-muted-foreground">Assist</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-2">{Math.round(currentSeasonStats.training_attendance_rate || 0)}%</div>
                      <div className="text-sm text-muted-foreground">Presenze Allenamenti</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Disciplina</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      Cartellini Gialli: {currentSeasonStats.yellow_cards}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      Cartellini Rossi: {currentSeasonStats.red_cards}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {statistics && statistics.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessuna statistica disponibile</h3>
                    <p className="text-muted-foreground">
                      Le statistiche verranno generate automaticamente durante la stagione.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerStatsModal;