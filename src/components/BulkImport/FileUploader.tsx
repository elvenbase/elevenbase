import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  Shield,
  Clock
} from 'lucide-react';
import bulkImportFileParser, { 
  ParsedFileData, 
  FileSecurityCheck 
} from '@/services/bulkImportFileParser';

interface FileUploaderProps {
  teamId: string;
  teamName: string;
  onFileProcessed: (data: ParsedFileData) => void;
  onFileCleared: () => void;
  className?: string;
}

interface UploadState {
  file: File | null;
  isProcessing: boolean;
  securityCheck: FileSecurityCheck | null;
  parseResult: ParsedFileData | null;
  progress: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  teamId,
  teamName,
  onFileProcessed,
  onFileCleared,
  className = ''
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isProcessing: false,
    securityCheck: null,
    parseResult: null,
    progress: 0
  });

  const { toast } = useToast();

  /**
   * Gestione file drop/select
   */
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Reset stato precedente
    setUploadState(prev => ({
      ...prev,
      file: null,
      securityCheck: null,
      parseResult: null,
      progress: 0
    }));
    onFileCleared();

    // Controllo file rifiutati
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => 
        `${rejection.file.name}: ${rejection.errors.map((e: any) => e.message).join(', ')}`
      );
      toast({
        title: "File rifiutati",
        description: errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    // Prendi solo il primo file
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadState(prev => ({ ...prev, file, isProcessing: true, progress: 10 }));

    try {
      // Step 1: Security Check
      setUploadState(prev => ({ ...prev, progress: 30 }));
      const securityCheck = bulkImportFileParser.performSecurityCheck(file);
      setUploadState(prev => ({ ...prev, securityCheck, progress: 50 }));

      if (!securityCheck.isSecure) {
        toast({
          title: "File non sicuro",
          description: securityCheck.threats.join('\n'),
          variant: "destructive"
        });
        setUploadState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Step 2: Parsing e validazione
      setUploadState(prev => ({ ...prev, progress: 80 }));
      const parseResult = await bulkImportFileParser.parseFile(file, teamId);
      setUploadState(prev => ({ 
        ...prev, 
        parseResult, 
        progress: 100, 
        isProcessing: false 
      }));

      // Notifica risultato
      if (parseResult.validation.valid) {
        toast({
          title: "File processato con successo",
          description: `${parseResult.players.length} giocatori trovati`,
        });
        onFileProcessed(parseResult);
      } else {
        toast({
          title: "Errori nel file",
          description: `${parseResult.validation.errors.length} errori trovati`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Errore processamento file:', error);
      toast({
        title: "Errore processamento",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive"
      });
      setUploadState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [teamId, toast, onFileProcessed, onFileCleared]);

  /**
   * Configurazione dropzone
   */
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
    disabled: uploadState.isProcessing
  });

  /**
   * Reset upload
   */
  const clearFile = () => {
    setUploadState({
      file: null,
      isProcessing: false,
      securityCheck: null,
      parseResult: null,
      progress: 0
    });
    onFileCleared();
  };

  /**
   * Render dropzone style
   */
  const getDropzoneStyle = () => {
    const baseStyle = "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors";
    
    if (isDragReject) return `${baseStyle} border-red-300 bg-red-50`;
    if (isDragAccept) return `${baseStyle} border-green-300 bg-green-50`;
    if (isDragActive) return `${baseStyle} border-blue-300 bg-blue-50`;
    if (uploadState.isProcessing) return `${baseStyle} border-gray-300 bg-gray-50 cursor-not-allowed`;
    return `${baseStyle} border-gray-300 hover:border-blue-400 hover:bg-blue-50`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Carica File Template
        </CardTitle>
        <CardDescription>
          Carica il template compilato per il team <strong>{teamName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Team */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            <strong>Team ID:</strong> {teamId.substring(0, 8)}...
          </span>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} className={getDropzoneStyle()}>
          <input {...getInputProps()} />
          
          {uploadState.isProcessing ? (
            <div className="space-y-4">
              <Clock className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
              <div>
                <div className="font-medium">Processando file...</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Controlli di sicurezza e validazione in corso
                </div>
                <Progress value={uploadState.progress} className="mt-2 max-w-xs mx-auto" />
              </div>
            </div>
          ) : uploadState.file ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div>
                <div className="font-medium">File caricato</div>
                <div className="text-sm text-muted-foreground">{uploadState.file.name}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isDragActive ? (
                <>
                  <Upload className="h-12 w-12 mx-auto text-blue-600" />
                  <div className="font-medium text-blue-700">
                    Rilascia qui il file...
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center gap-4">
                    <FileSpreadsheet className="h-10 w-10 text-green-600" />
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      Trascina qui il template o clicca per selezionare
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Supporta file Excel (.xlsx) e CSV (.csv) - Max 2MB
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Security Check Results */}
        {uploadState.securityCheck && (
          <Alert className={uploadState.securityCheck.isSecure ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {uploadState.securityCheck.isSecure ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {uploadState.securityCheck.isSecure ? (
                <div>
                  <strong>File sicuro</strong> - Tutti i controlli superati
                  <div className="text-xs mt-1 text-muted-foreground">
                    {uploadState.securityCheck.fileInfo.name} • {(uploadState.securityCheck.fileInfo.size / 1024).toFixed(1)}KB
                  </div>
                </div>
              ) : (
                <div>
                  <strong>Problemi di sicurezza rilevati:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {uploadState.securityCheck.threats.map((threat, index) => (
                      <li key={index}>{threat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Parse Results */}
        {uploadState.parseResult && (
          <div className="space-y-4">
            {/* Validation Summary */}
            <Alert className={uploadState.parseResult.validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {uploadState.parseResult.validation.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {uploadState.parseResult.validation.valid ? (
                  <div>
                    <strong>File valido!</strong> Trovati {uploadState.parseResult.players.length} giocatori
                    {uploadState.parseResult.validation.warnings.length > 0 && (
                      <div className="mt-2 text-sm">
                        <strong>Avvisi:</strong>
                        <ul className="list-disc list-inside">
                          {uploadState.parseResult.validation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <strong>Errori trovati:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm max-h-40 overflow-y-auto">
                      {uploadState.parseResult.validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Metadata Info */}
            {uploadState.parseResult.metadata.teamId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Template Team ID:</strong> {uploadState.parseResult.metadata.teamId}</div>
                  <div><strong>Versione:</strong> {uploadState.parseResult.metadata.version}</div>
                  <div><strong>Generato:</strong> {uploadState.parseResult.metadata.generatedAt}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {uploadState.file && (
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={clearFile}
              className="flex-1"
            >
              Carica altro file
            </Button>
            {uploadState.parseResult?.validation.valid && (
              <Badge variant="secondary" className="px-3 py-2">
                ✓ Pronto per l'anteprima
              </Badge>
            )}
          </div>
        )}

        {/* Help */}
        {!uploadState.file && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800">
              <strong>Suggerimenti:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Usa solo template generati da ElevenBase</li>
                <li>• Non modificare le prime 3 righe di metadati</li>
                <li>• Il template deve appartenere al team corrente</li>
                <li>• Massimo 30 giocatori per import</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploader;