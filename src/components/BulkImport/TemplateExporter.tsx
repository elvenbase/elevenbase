import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, FileText, Info, Users } from 'lucide-react';
import bulkImportTemplateService, { TemplateMetadata } from '@/services/bulkImportTemplateService';

interface TemplateExporterProps {
  teamId: string;
  teamName: string;
  onTemplateDownloaded?: () => void;
  className?: string;
}

const TemplateExporter: React.FC<TemplateExporterProps> = ({ 
  teamId, 
  teamName, 
  onTemplateDownloaded,
  className = '' 
}) => {
  const [isGenerating, setIsGenerating] = useState<'excel' | 'csv' | null>(null);
  const { toast } = useToast();

  const generateTemplate = async (format: 'excel' | 'csv') => {
    try {
      setIsGenerating(format);

      // Prepara metadati
      const metadata: TemplateMetadata = {
        teamId,
        teamName: teamName.replace(/[^a-zA-Z0-9]/g, '_'), // Sanitize per nome file
        generatedAt: new Date().toISOString(),
        version: 'v1.0'
      };

      // Valida metadati
      const validation = bulkImportTemplateService.validateMetadata(metadata);
      if (!validation.valid) {
        throw new Error(`Metadati non validi: ${validation.errors.join(', ')}`);
      }

      // Genera template
      if (format === 'excel') {
        bulkImportTemplateService.generateExcelTemplate(metadata);
        toast({
          title: "Template Excel generato",
          description: `File template_giocatori_${metadata.teamName}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx scaricato`,
        });
      } else {
        bulkImportTemplateService.generateCSVTemplate(metadata);
        toast({
          title: "Template CSV generato", 
          description: `File template_giocatori_${metadata.teamName}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv scaricato`,
        });
      }

      // Notifica che il template è stato scaricato
      onTemplateDownloaded?.();

    } catch (error) {
      console.error('Errore generazione template:', error);
      toast({
        title: "Errore nella generazione",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Esporta Template
        </CardTitle>
        <CardDescription>
          Scarica il template per importare fino a 30 giocatori nella rosa di <strong>{teamName}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">Come utilizzare il template:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Scarica il template Excel o CSV</li>
              <li>Compila i campi obbligatori (*) per ogni giocatore</li>
              <li>Non modificare le prime 3 righe di metadati</li>
              <li>Salva e carica il file nell'area di import</li>
            </ol>
          </div>
        </div>

        {/* Campi obbligatori */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Campi obbligatori:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">first_name*</Badge>
            <Badge variant="secondary" className="text-xs">last_name*</Badge>
            <Badge variant="secondary" className="text-xs">jersey_number*</Badge>
            <Badge variant="secondary" className="text-xs">status*</Badge>
          </div>
        </div>

        {/* Campi opzionali */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Campi opzionali:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">position</Badge>
            <Badge variant="outline" className="text-xs">player_role</Badge>
            <Badge variant="outline" className="text-xs">phone</Badge>
            <Badge variant="outline" className="text-xs">birth_date</Badge>
            <Badge variant="outline" className="text-xs">email</Badge>
            <Badge variant="outline" className="text-xs">esperienza</Badge>
            <Badge variant="outline" className="text-xs">notes</Badge>
          </div>
        </div>

        {/* Status validi */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Status validi:</h4>
          <div className="flex flex-wrap gap-2">
            {bulkImportTemplateService.getAvailableStatuses().map(status => (
              <Badge key={status.value} variant="outline" className="text-xs">
                {status.value} ({status.label})
              </Badge>
            ))}
          </div>
        </div>

        {/* Pulsanti Download */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          {/* Excel Template */}
          <Button
            onClick={() => generateTemplate('excel')}
            disabled={isGenerating !== null}
            className="h-auto p-4 flex flex-col items-center gap-2"
            variant="outline"
          >
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <div className="font-medium">
                {isGenerating === 'excel' ? 'Generando...' : 'Template Excel'}
              </div>
              <div className="text-xs text-muted-foreground">
                Formato .xlsx con styling
              </div>
            </div>
          </Button>

          {/* CSV Template */}
          <Button
            onClick={() => generateTemplate('csv')}
            disabled={isGenerating !== null}
            className="h-auto p-4 flex flex-col items-center gap-2"
            variant="outline"
          >
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="text-center">
              <div className="font-medium">
                {isGenerating === 'csv' ? 'Generando...' : 'Template CSV'}
              </div>
              <div className="text-xs text-muted-foreground">
                Formato .csv leggero
              </div>
            </div>
          </Button>
        </div>

        {/* Limiti */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Max 30 giocatori per import</span>
          </div>
          <div>Team: {teamName}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateExporter;