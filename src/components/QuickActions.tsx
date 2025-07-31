
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  UserPlus, 
  Calendar, 
  Trophy, 
  FileText,
  Timer,
  Target
} from "lucide-react";
import { PlayerForm } from "@/components/forms/PlayerForm";
import { TrainingForm } from "@/components/forms/TrainingForm";
import { CompetitionForm } from "@/components/forms/CompetitionForm";
import { TrialistForm } from "@/components/forms/TrialistForm";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: "Aggiungi Giocatore",
      description: "Registra un nuovo membro",
      icon: UserPlus,
      color: "bg-primary",
      component: PlayerForm
    },
    {
      title: "Programma Allenamento",
      description: "Crea nuova sessione",
      icon: Calendar,
      color: "bg-accent",
      component: TrainingForm
    },
    {
      title: "Nuova Competizione",
      description: "Registra torneo",
      icon: Trophy,
      color: "bg-warning",
      component: CompetitionForm
    },
    {
      title: "Rapporto Match",
      description: "Inserisci risultati",
      icon: FileText,
      color: "bg-success",
      action: () => navigate('/competitions') // Per ora redirect a competitions
    },
    {
      title: "Gestione Presenze",
      description: "Segna presenze",
      icon: Timer,
      color: "bg-destructive",
      action: () => navigate('/training') // Per ora redirect a training
    },
    {
      title: "Valuta Candidato",
      description: "Note di valutazione",
      icon: Target,
      color: "bg-secondary",
      component: TrialistForm
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
          const FormComponent = action.component;
          
          if (FormComponent) {
            return (
              <FormComponent key={index}>
                <Button
                  variant="ghost"
                  className="h-auto p-3 justify-start space-x-3 hover:bg-muted hover:shadow-sm transition-colors w-full"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              </FormComponent>
            );
          }
          
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
