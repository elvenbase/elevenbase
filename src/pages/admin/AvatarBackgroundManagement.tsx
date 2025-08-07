import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AvatarManager } from '@/components/AvatarManager';
import { Link } from 'react-router-dom';

const AvatarBackgroundManagement = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ad Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestione Sfondi Avatar</h1>
          <p className="text-muted-foreground">
            Personalizza gli sfondi degli avatar dei giocatori
          </p>
        </div>
      </div>

      <AvatarManager />
    </div>
  );
};

export default AvatarBackgroundManagement; 