import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shirt } from 'lucide-react';
import { JerseyManager } from '@/components/JerseyManager';
import { Link } from 'react-router-dom';

const JerseyManagement = () => {
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shirt className="h-8 w-8 text-primary" />
            Gestione Maglie
          </h1>
          <p className="text-muted-foreground">
            Crea e gestisci template di maglie per le tue squadre
          </p>
        </div>
      </div>

      <JerseyManager />
    </div>
  );
};

export default JerseyManagement; 