
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
      description: "Registra un nuovo membro",
      icon: UserPlus,
      color: "bg-primary",
      action: () => console.log("Add player")
    },
    {
      title: "Programma Allenamento",
      description: "Crea nuova sessione",
      icon: Calendar,
      color: "bg-accent",
      action: () => console.log("Schedule training")
    },
    {
      title: "Nuova Competizione",
      description: "Registra torneo",
      icon: Trophy,
      color: "bg-warning",
      action: () => console.log("New competition")
    },
    {
      title: "Rapporto Match",
      description: "Inserisci risultati",
      icon: FileText,
      color: "bg-success",
      action: () => console.log("Match report")
    },
    {
      title: "Gestione Presenze",
      description: "Segna presenze",
      icon: Timer,
      color: "bg-destructive",
      action: () => console.log("Attendance")
    },
    {
      title: "Valuta Candidato",
      description: "Note di valutazione",
      icon: Target,
      color: "bg-secondary",
      action: () => console.log("Evaluate candidate")
    }
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Azioni Rapide</h3>
        <p className="text-sm text-muted-foreground">Gestisci le operazioni più comuni</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-3 justify-start space-x-3 hover:bg-muted hover:shadow-sm transition-colors"
              onClick={action.action}
            >
              <div className={`p-2 rounded-lg ${action.color} text-white flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-left">
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
