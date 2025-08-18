
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Trophy, Star } from "lucide-react";
import { useTrialists, useTrialistStats } from "@/hooks/useSupabaseData";
import { TrialistFormSimple } from "@/components/forms/TrialistFormSimple";
import TrialsKanban from "@/components/TrialsKanban";
import TrialistsTable from "@/components/TrialistsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Trials = () => {
  const { data: trialistStats, isLoading } = useTrialistStats();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                Provini
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gestione trialist e processo di valutazione
              </p>
            </div>
          </div>
          
          {/* Pulsanti responsive per mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 text-sm"
              onClick={() => navigate('/trial-evaluations')}
            >
              <Star className="h-4 w-4" />
              <span>Valutazione Provinanti</span>
            </Button>
            <TrialistFormSimple>
              <Button variant="hero" className="flex items-center justify-center space-x-2 text-sm">
                <UserPlus className="h-4 w-4" />
                <span>Nuovo Trialist</span>
              </Button>
            </TrialistFormSimple>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">In Prova</h3>
              <div className="p-2 bg-warning rounded-lg">
                <UserPlus className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.inTrial || 0}
            </p>
            <p className="text-sm text-muted-foreground">Trialist attivi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Promossi</h3>
              <div className="p-2 bg-success rounded-lg">
                <Trophy className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.promoted || 0}
            </p>
            <p className="text-sm text-muted-foreground">Totale promossi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Archiviati</h3>
              <div className="p-2 bg-muted rounded-lg">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.archived || 0}
            </p>
            <p className="text-sm text-muted-foreground">Trialist archiviati</p>
          </Card>
        </div>

        <Tabs defaultValue="table" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Vista Tabella</TabsTrigger>
            <TabsTrigger value="kanban">Vista Kanban</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
            <TrialistsTable />
          </TabsContent>
          
          <TabsContent value="kanban">
            <TrialsKanban />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Trials;
