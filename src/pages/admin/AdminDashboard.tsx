import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  Image, 
  Layout, 
  ArrowRight,
  Shield,
  Shirt,
  UserCog
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const adminSections = [
    {
      title: 'Gestione Utenti',
      description: 'Gestisci utenti, ruoli e permessi del sistema',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      badge: 'Utenti'
    },
    {
      title: 'Gestione Formazioni',
      description: 'Crea e personalizza formazioni per le tue squadre',
      icon: Layout,
      href: '/admin/formations',
      color: 'bg-green-500',
      badge: 'Formazioni'
    },
          {
        title: 'Gestione Maglie',
        description: 'Configura template di maglie e colori',
        icon: Shirt,
        href: '/admin/jerseys',
        color: 'bg-purple-500',
        badge: 'Maglie'
      },
    {
      title: 'Gestione Sfondi Avatar',
      description: 'Personalizza gli sfondi degli avatar dei giocatori',
      icon: Image,
      href: '/admin/avatar-backgrounds',
      color: 'bg-orange-500',
      badge: 'Avatar'
    },
    {
      title: 'Impostazioni PNG',
      description: 'Configura l\'esportazione PNG delle formazioni',
      icon: Settings,
      href: '/admin/png-settings',
      color: 'bg-red-500',
      badge: 'PNG'
    },
          {
        title: 'Opzioni Giocatori',
        description: 'Gestisci le opzioni dinamiche dei form (ruoli, posizioni, status)',
        icon: UserCog,
        href: '/field-options',
        color: 'bg-indigo-500',
        badge: 'Giocatori'
      },
      {
        title: 'Avversari',
        description: 'Anagrafica squadre avversarie e loghi',
        icon: Users,
        href: '/admin/opponents',
        color: 'bg-cyan-600',
        badge: 'Opponenti'
      }
  ];

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Area Amministrativa</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestisci tutte le configurazioni e impostazioni del sistema
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Badge variant="outline">Admin</Badge>
          <span>•</span>
          <span>Accesso completo al sistema</span>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.href} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {section.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to={section.href}>
                  <Button 
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <span className="text-sm">Accedi</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Informazioni Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3 text-xs sm:text-sm">
              <div>
                <h4 className="font-semibold mb-2">Permessi</h4>
                <p className="text-muted-foreground">
                  Hai accesso completo a tutte le funzioni amministrative del sistema
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Configurazioni</h4>
                <p className="text-muted-foreground">
                  Personalizza formazioni, maglie, avatar e impostazioni di esportazione
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Gestione</h4>
                <p className="text-muted-foreground">
                  Amministra utenti e configura le opzioni dinamiche dei form
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 