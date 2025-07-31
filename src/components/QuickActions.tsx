import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  Calendar, 
  Trophy, 
  FileText,
  Timer,
  Target
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      title: "Aggiungi Giocatore",
      description: "Registra un nuovo membro della rosa",
      icon: UserPlus,
      color: "bg-primary",
      action: () => console.log("Add player")
    },
    {
      title: "Programma Allenamento",
      description: "Crea una nuova sessione di training",
      icon: Calendar,
      color: "bg-accent",
      action: () => console.log("Schedule training")
    },
    {
      title: "Nuova Competizione",
      description: "Registra torneo o campionato",
      icon: Trophy,
      color: "bg-warning",
      action: () => console.log("New competition")
    },
    {
      title: "Rapporto Match",
      description: "Inserisci risultati partita",
      icon: FileText,
      color: "bg-success",
      action: () => console.log("Match report")
    },
    {
      title: "Presenza Rapida",
      description: "Segna presenze allenamento",
      icon: Timer,
      color: "bg-destructive",
      action: () => console.log("Quick attendance")
    },
    {
      title: "Valuta Trialist",
      description: "Aggiungi note di valutazione",
      icon: Target,
      color: "bg-secondary",
      action: () => console.log("Evaluate trialist")
    }
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Azioni Rapide</h3>
        <p className="text-sm text-muted-foreground">Gestisci rapidamente le operazioni più comuni</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 flex-col space-y-2 hover:bg-muted hover:shadow-card transition-smooth"
              onClick={action.action}
            >
              <div className={`p-3 rounded-xl ${action.color} text-white shadow-glow`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;