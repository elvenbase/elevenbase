import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PngExportSettingsManager } from '@/components/PngExportSettingsManager';
import { Link } from 'react-router-dom';

const PngSettingsManagement = () => {
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
          <h1 className="text-3xl font-bold">Impostazioni PNG</h1>
          <p className="text-muted-foreground">
            Configura le impostazioni per l'esportazione PNG delle formazioni
          </p>
        </div>
      </div>

      <PngExportSettingsManager />
    </div>
  );
};

export default PngSettingsManagement; 