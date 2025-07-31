import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Plus, Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useTrainingSessions, useStats } from "@/hooks/useSupabaseData";
import { TrainingForm } from "@/components/forms/TrainingForm";

const Training = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Allenamenti
            </h1>
            <p className="text-muted-foreground">
              Pianificazione sessioni e gestione presenze
            </p>
          </div>
          <TrainingForm>
            <Button variant="hero" className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Sessione</span>
            </Button>
          </TrainingForm>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sessioni Mese</h3>
              <div className="p-2 bg-accent rounded-lg shadow-accent-glow">
                <Activity className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">16</p>
            <p className="text-sm text-muted-foreground">Gennaio 2025</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Presenza Media</h3>
              <div className="p-2 bg-success rounded-lg">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">89%</p>
            <p className="text-sm text-muted-foreground">Ultimo mese</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prossima</h3>
              <div className="p-2 bg-warning rounded-lg">
                <Clock className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">Oggi</p>
            <p className="text-sm text-muted-foreground">20:00</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Giocatori Attesi</h3>
              <div className="p-2 bg-primary rounded-lg shadow-glow">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">22</p>
            <p className="text-sm text-muted-foreground">Su 24 totali</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Programmazione Sessioni</h3>
                <p className="text-sm text-muted-foreground">Pianifica allenamenti ricorrenti</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted border-l-4 border-accent">
                <h4 className="font-semibold text-foreground mb-2">Allenamento Tecnico</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Ogni Martedì e Giovedì ore 21:00
                </p>
                <div className="flex space-x-2">
                  <Button variant="gaming" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Inviti
                  </Button>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-muted border-l-4 border-warning">
                <h4 className="font-semibold text-foreground mb-2">Sessione Tattica</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Domenica ore 20:30 (prima delle partite)
                </p>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programma
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Presenze Rapide</h3>
                <p className="text-sm text-muted-foreground">Registra da bordocampo</p>
              </div>
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <h4 className="font-semibold text-foreground mb-2">Allenamento di Oggi</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Sessione Tecnica - 20:00-22:00
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm text-success">Sessione in corso</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="gaming" size="sm" className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Presenze
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Ritardi
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-2xl font-bold text-success">18</p>
                  <p className="text-xs text-muted-foreground">Presenti</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-2xl font-bold text-warning">2</p>
                  <p className="text-xs text-muted-foreground">Ritardi</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-2xl font-bold text-destructive">2</p>
                  <p className="text-xs text-muted-foreground">Assenti</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Training;