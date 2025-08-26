import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp, 
  Info,
  Download,
  Upload,
  Clock,
  Shield
} from 'lucide-react';
import { ParsedFileData } from '@/services/bulkImportFileParser';
import bulkImportBusinessValidator, { 
  BusinessValidationResult, 
  PlayerPreview, 
  PlayerConflict,
  ExistingTeamData 
} from '@/services/bulkImportBusinessValidator';

interface ImportPreviewProps {
  teamId: string;
  teamName: string;
  fileData: ParsedFileData;
  existingPlayers: ExistingTeamData['players'];
  onConfirmImport: (validationResult: BusinessValidationResult) => void;
  onCancel: () => void;
  className?: string;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({
  teamId,
  teamName,
  fileData,
  existingPlayers,
  onConfirmImport,
  onCancel,
  className = ''
}) => {
  const [validationResult, setValidationResult] = useState<BusinessValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  /**
   * Esegui validazione business al mount
   */
  useEffect(() => {
    performBusinessValidation();
  }, [fileData, existingPlayers]);

  /**
   * Validazione business completa
   */
  const performBusinessValidation = async () => {
    setIsValidating(true);
    
    try {
      const result = await bulkImportBusinessValidator.validateForImport(
        fileData.players,
        { players: existingPlayers }
      );
      
      setValidationResult(result);
      
      if (result.playersWithErrors > 0) {
        toast({
          title: "Conflitti rilevati",
          description: `${result.playersWithErrors} giocatori hanno conflitti che impediscono l'import`,
          variant: "destructive"
        });
      } else if (result.playersWithWarnings > 0) {
        toast({
          title: "Avvisi trovati", 
          description: `${result.playersWithWarnings} giocatori hanno avvisi da verificare`,
        });
      } else {
        toast({
          title: "Validazione completata",
          description: `Tutti i ${result.totalPlayers} giocatori sono pronti per l'import`,
        });
      }
    } catch (error) {
      console.error('Errore validazione business:', error);
      toast({
        title: "Errore validazione",
        description: "Si è verificato un errore durante la validazione",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Conferma import
   */
  const handleConfirmImport = () => {
    if (validationResult && validationResult.canImport) {
      onConfirmImport(validationResult);
      setIsConfirmDialogOpen(false);
    }
  };

  /**
   * Render conflict icon
   */
  const renderConflictIcon = (conflicts: PlayerConflict[]) => {
    const hasErrors = conflicts.some(c => c.severity === 'error');
    const hasWarnings = conflicts.some(c => c.severity === 'warning');
    
    if (hasErrors) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else if (hasWarnings) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  /**
   * Render status badge
   */
  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      'active': { variant: 'default', label: 'Attivo' },
      'inactive': { variant: 'secondary', label: 'Inattivo' },
      'injured': { variant: 'destructive', label: 'Infortunato' },
      'suspended': { variant: 'outline', label: 'Sospeso' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Render conflict details
   */
  const renderConflictDetails = (conflicts: PlayerConflict[]) => {
    if (conflicts.length === 0) return null;
    
    return (
      <div className="space-y-1">
        {conflicts.map((conflict, index) => (
          <div 
            key={index}
            className={`text-xs p-2 rounded ${
              conflict.severity === 'error' 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}
          >
            {conflict.message}
          </div>
        ))}
      </div>
    );
  };

  if (isValidating) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Clock className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
            <div>
              <div className="font-medium">Validazione in corso...</div>
              <div className="text-sm text-muted-foreground">
                Controllo conflitti con giocatori esistenti
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <div className="font-medium">Errore validazione</div>
            <div className="text-sm text-muted-foreground">Impossibile processare i dati</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summaryStats = bulkImportBusinessValidator.generateSummaryStats(validationResult);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Anteprima Import
        </CardTitle>
        <CardDescription>
          Verifica i dati prima di importare {validationResult.totalPlayers} giocatori in <strong>{teamName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{summaryStats.readyToImport}</div>
                  <div className="text-sm text-muted-foreground">Pronti</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{summaryStats.needsAttention}</div>
                  <div className="text-sm text-muted-foreground">Avvisi</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{summaryStats.hasConflicts}</div>
                  <div className="text-sm text-muted-foreground">Conflitti</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Alerts */}
        {validationResult.globalErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>Errori globali:</strong>
              <ul className="list-disc list-inside mt-1">
                {validationResult.globalErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationResult.globalWarnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>Avvisi globali:</strong>
              <ul className="list-disc list-inside mt-1">
                {validationResult.globalWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Players Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dettaglio Giocatori</h3>
            <Badge variant="outline">
              {validationResult.totalPlayers} giocatori
            </Badge>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-20">Maglia</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Conflitti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResult.players.map((player, index) => (
                  <TableRow 
                    key={index}
                    className={
                      player.hasErrors 
                        ? 'bg-red-50 hover:bg-red-100' 
                        : player.hasWarnings 
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-muted/50'
                    }
                  >
                    <TableCell>
                      {renderConflictIcon(player.conflicts)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {player.first_name} {player.last_name}
                      {player.birth_date && (
                        <div className="text-xs text-muted-foreground">
                          {player.birth_date}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{player.jersey_number}</Badge>
                    </TableCell>
                    <TableCell>{player.position || '-'}</TableCell>
                    <TableCell>{player.player_role || '-'}</TableCell>
                    <TableCell>{renderStatusBadge(player.status)}</TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-xs">
                        {player.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-24 truncate text-xs">
                        {player.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.conflicts.length > 0 ? (
                        <div className="space-y-1">
                          {renderConflictDetails(player.conflicts)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nessuno</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Import Status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Status Import</span>
          </div>
          
          {validationResult.canImport ? (
            <div className="text-sm text-green-800">
              ✅ <strong>Pronto per l'import</strong> - Tutti i controlli superati
            </div>
          ) : (
            <div className="text-sm text-red-800">
              ❌ <strong>Import bloccato</strong> - Risolvi i conflitti prima di procedere
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annulla
          </Button>
          
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex-1"
                disabled={!validationResult.canImport}
              >
                <Upload className="h-4 w-4 mr-2" />
                Conferma Import
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conferma Import Giocatori</DialogTitle>
                <DialogDescription>
                  Stai per importare {validationResult.totalPlayers} giocatori nel team {teamName}.
                  Questa operazione non può essere annullata.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Riepilogo Import:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Giocatori: {validationResult.totalPlayers}</div>
                    <div>• Team: {teamName}</div>
                    <div>• Pronti: {summaryStats.readyToImport}</div>
                    <div>• Con avvisi: {summaryStats.needsAttention}</div>
                  </div>
                </div>
                
                {Object.entries(summaryStats.byStatus).length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Per Status:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(summaryStats.byStatus).map(([status, count]) => (
                        <Badge key={status} variant="outline">
                          {status}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleConfirmImport}>
                  Conferma Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportPreview;