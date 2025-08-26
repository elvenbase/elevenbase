import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Clock, 
  TrendingUp,
  Download,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { ImportProgress, ImportResult } from '@/services/bulkImportExecutor';
import { BusinessValidationResult } from '@/services/bulkImportBusinessValidator';
import { useBulkImportPlayers } from '@/hooks/useSupabaseData';

interface ImportResultsProps {
  teamId: string;
  teamName: string;
  validationResult: BusinessValidationResult;
  onComplete: (result: ImportResult) => void;
  onCancel: () => void;
  onRetry: () => void;
  className?: string;
}

const ImportResults: React.FC<ImportResultsProps> = ({
  teamId,
  teamName,
  validationResult,
  onComplete,
  onCancel,
  onRetry,
  className = ''
}) => {
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: validationResult.totalPlayers,
    percentage: 0,
    phase: 'preparing'
  });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const bulkImport = useBulkImportPlayers();

  /**
   * Avvia import al mount del componente
   */
  useEffect(() => {
    startImport();
  }, []);

  /**
   * Avvia processo di import
   */
  const startImport = async () => {
    setStartTime(Date.now());
    setImportResult(null);
    setImportProgress({
      current: 0,
      total: validationResult.totalPlayers,
      percentage: 0,
      phase: 'preparing'
    });

    try {
      const result = await bulkImport.mutateAsync({
        teamId,
        teamName,
        validationResult,
        onProgress: (progress) => {
          setImportProgress(progress);
        }
      });

      setImportResult(result);
      onComplete(result);
    } catch (error) {
      console.error('Errore import:', error);
      // L'errore è già gestito dal hook
    }
  };

  /**
   * Calcola tempo rimanente stimato
   */
  const getEstimatedTimeRemaining = (): string => {
    if (importProgress.current === 0 || importProgress.phase === 'completed') {
      return '';
    }

    const elapsed = Date.now() - startTime;
    const avgTimePerItem = elapsed / importProgress.current;
    const remaining = importProgress.total - importProgress.current;
    const estimatedMs = remaining * avgTimePerItem;

    const seconds = Math.round(estimatedMs / 1000);
    if (seconds < 60) {
      return `~${seconds}s rimanenti`;
    } else {
      const minutes = Math.round(seconds / 60);
      return `~${minutes}m rimanenti`;
    }
  };

  /**
   * Render phase description
   */
  const getPhaseDescription = (phase: ImportProgress['phase']): string => {
    switch (phase) {
      case 'preparing': return 'Preparazione import...';
      case 'importing': return 'Importazione giocatori...';
      case 'validating': return 'Validazione finale...';
      case 'completing': return 'Finalizzazione...';
      case 'completed': return 'Import completato!';
      case 'error': return 'Errore durante import';
      default: return 'In corso...';
    }
  };

  /**
   * Render import progress
   */
  const renderImportProgress = () => {
    const isCompleted = importProgress.phase === 'completed' || importResult;
    const hasError = importProgress.phase === 'error' || bulkImport.isError;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasError ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600 animate-spin" />
            )}
            {getPhaseDescription(importProgress.phase)}
          </CardTitle>
          <CardDescription>
            Import di {validationResult.totalPlayers} giocatori in {teamName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {importProgress.current} di {importProgress.total} giocatori
              </span>
              <span className="text-muted-foreground">
                {importProgress.percentage}%
              </span>
            </div>
            <Progress value={importProgress.percentage} className="h-3" />
            
            {importProgress.currentPlayer && (
              <div className="text-sm text-muted-foreground">
                Processando: <strong>{importProgress.currentPlayer}</strong>
              </div>
            )}
            
            {!isCompleted && !hasError && (
              <div className="text-xs text-muted-foreground">
                {getEstimatedTimeRemaining()}
              </div>
            )}
          </div>

          {/* Loading State Info */}
          {bulkImport.isPending && !importResult && (
            <Alert className="border-blue-200 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Import in corso - non chiudere la pagina</span>
                  <div className="text-xs">
                    Batch size: 5 giocatori per volta
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  /**
   * Render import result summary
   */
  const renderImportResults = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.totalSuccessful}
                  </div>
                  <div className="text-sm text-muted-foreground">Importati</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.totalFailed}
                  </div>
                  <div className="text-sm text-muted-foreground">Falliti</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(importResult.executionTime / 1000)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Tempo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Alert */}
        {importResult.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Import completato con successo!</strong> Tutti i {importResult.totalSuccessful} giocatori sono stati aggiunti al team.
            </AlertDescription>
          </Alert>
        )}

        {/* Partial Success Alert */}
        {!importResult.success && importResult.totalSuccessful > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>Import parzialmente completato.</strong> {importResult.totalSuccessful} giocatori importati con successo, {importResult.totalFailed} fallimenti.
            </AlertDescription>
          </Alert>
        )}

        {/* Complete Failure Alert */}
        {!importResult.success && importResult.totalSuccessful === 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>Import fallito.</strong> Nessun giocatore è stato importato. Verifica i dati e riprova.
            </AlertDescription>
          </Alert>
        )}

        {/* Imported Players List */}
        {importResult.importedPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Giocatori Importati ({importResult.importedPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {importResult.importedPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {player.first_name} {player.last_name}
                        </span>
                      </div>
                      <Badge variant="outline">#{player.jersey_number}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Failed Players List */}
        {importResult.failedPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Giocatori Falliti ({importResult.failedPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {importResult.failedPlayers.map((failed, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {failed.player.first_name} {failed.player.last_name}
                        </span>
                        <Badge variant="destructive">Riga {failed.player.rowIndex}</Badge>
                      </div>
                      <div className="text-sm text-red-700">
                        {failed.error}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Progress Section */}
        {renderImportProgress()}

        {/* Results Section */}
        {renderImportResults()}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {importResult ? (
            <>
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Chiudi
              </Button>
              
              {!importResult.success && importResult.totalFailed > 0 && (
                <Button 
                  variant="outline" 
                  onClick={onRetry}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Riprova Import
                </Button>
              )}
              
              {importResult.success && (
                <Button 
                  onClick={() => {
                    // Navigate to squad page or refresh
                    window.location.reload();
                  }}
                  className="flex-1"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Vai alla Rosa
                </Button>
              )}
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={bulkImport.isPending}
              className="flex-1"
            >
              Annulla
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportResults;