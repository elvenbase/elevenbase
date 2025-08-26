import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Eye, 
  CheckCircle, 
  Users, 
  ArrowLeft, 
  ArrowRight,
  X,
  AlertTriangle
} from 'lucide-react';

import { TemplateExporter, FileUploader, ImportPreview, ImportResults } from './index';
import { ParsedFileData } from '@/services/bulkImportFileParser';
import { BusinessValidationResult, ExistingTeamData } from '@/services/bulkImportBusinessValidator';
import { ImportResult } from '@/services/bulkImportExecutor';
import { usePlayers } from '@/hooks/useSupabaseData';

export interface BulkImportWizardProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: ImportResult) => void;
  className?: string;
}

type WizardStep = 'template' | 'upload' | 'preview' | 'import' | 'results';

interface WizardState {
  currentStep: WizardStep;
  templateDownloaded: boolean;
  fileData: ParsedFileData | null;
  validationResult: BusinessValidationResult | null;
  importResult: ImportResult | null;
  existingPlayers: ExistingTeamData['players'];
}

const BulkImportWizard: React.FC<BulkImportWizardProps> = ({
  teamId,
  teamName,
  isOpen,
  onClose,
  onSuccess,
  className = ''
}) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'template',
    templateDownloaded: false,
    fileData: null,
    validationResult: null,
    importResult: null,
    existingPlayers: []
  });

  const { toast } = useToast();
  const { data: playersData } = usePlayers();

  /**
   * Carica giocatori esistenti quando si apre il wizard
   */
  useEffect(() => {
    if (isOpen && playersData) {
      const existingPlayers = playersData.map(player => ({
        id: player.id,
        first_name: player.first_name,
        last_name: player.last_name,
        jersey_number: player.jersey_number,
        email: player.email,
        phone: player.phone,
        status: player.status
      }));

      setWizardState(prev => ({
        ...prev,
        existingPlayers
      }));
    }
  }, [isOpen, playersData]);

  /**
   * Reset wizard quando si chiude
   */
  useEffect(() => {
    if (!isOpen) {
      setWizardState({
        currentStep: 'template',
        fileData: null,
        validationResult: null,
        importResult: null,
        existingPlayers: []
      });
    }
  }, [isOpen]);

  /**
   * Gestione navigazione step
   */
  const goToStep = useCallback((step: WizardStep) => {
    setWizardState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const goToNextStep = useCallback(() => {
    const stepOrder: WizardStep[] = ['template', 'upload', 'preview', 'import', 'results'];
    const currentIndex = stepOrder.indexOf(wizardState.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  }, [wizardState.currentStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const stepOrder: WizardStep[] = ['template', 'upload', 'preview', 'import', 'results'];
    const currentIndex = stepOrder.indexOf(wizardState.currentStep);
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  }, [wizardState.currentStep, goToStep]);

  /**
   * Handler eventi step
   */
  const handleFileProcessed = useCallback((data: ParsedFileData) => {
    setWizardState(prev => ({
      ...prev,
      fileData: data,
      validationResult: null
    }));
    
    if (data.validation.valid) {
      goToNextStep();
    }
  }, [goToNextStep]);

  const handleFileCleared = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      fileData: null,
      validationResult: null
    }));
  }, []);

  const handleConfirmImport = useCallback((validationResult: BusinessValidationResult) => {
    setWizardState(prev => ({
      ...prev,
      validationResult
    }));
    goToNextStep();
  }, [goToNextStep]);

  const handleImportComplete = useCallback((result: ImportResult) => {
    setWizardState(prev => ({
      ...prev,
      importResult: result
    }));
    
    if (result.success && onSuccess) {
      onSuccess(result);
    }
    
    goToNextStep();
  }, [goToNextStep, onSuccess]);

  const handleRetryImport = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      importResult: null
    }));
    goToStep('import');
  }, [goToStep]);

  const handleStartOver = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: 'template',
      templateDownloaded: false,
      fileData: null,
      validationResult: null,
      importResult: null
    }));
  }, []);

  const handleTemplateDownloaded = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      templateDownloaded: true
    }));
  }, []);

  /**
   * Calcola progresso wizard
   */
  const getWizardProgress = (): number => {
    const stepProgress: Record<WizardStep, number> = {
      template: 0,
      upload: 25,
      preview: 50,
      import: 75,
      results: 100
    };
    return stepProgress[wizardState.currentStep];
  };

  /**
   * Verifica se step è completato
   */
  const isStepCompleted = (step: WizardStep): boolean => {
    switch (step) {
      case 'template':
        return true; // Step template sempre navigabile
      case 'upload':
        return wizardState.fileData !== null && wizardState.fileData.validation.valid;
      case 'preview':
        return wizardState.validationResult !== null && wizardState.validationResult.canImport;
      case 'import':
        return wizardState.importResult !== null;
      case 'results':
        return wizardState.importResult !== null;
      default:
        return false;
    }
  };

  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    const steps: Array<{ key: WizardStep; label: string; icon: React.ReactNode }> = [
      { key: 'template', label: 'Template', icon: <Download className="h-4 w-4" /> },
      { key: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
      { key: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
      { key: 'import', label: 'Import', icon: <Users className="h-4 w-4" /> },
      { key: 'results', label: 'Risultati', icon: <CheckCircle className="h-4 w-4" /> }
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const isActive = wizardState.currentStep === step.key;
          const isCompleted = isStepCompleted(step.key);
          const isClickable = isCompleted || (index === 0);

          return (
            <React.Fragment key={step.key}>
              <div 
                className={`flex flex-col items-center cursor-pointer transition-colors ${
                  isClickable ? 'hover:text-blue-600' : ''
                }`}
                onClick={isClickable ? () => goToStep(step.key) : undefined}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isActive 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {isCompleted && !isActive ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /**
   * Render contenuto step corrente
   */
  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'template':
        return (
          <TemplateExporter
            teamId={teamId}
            teamName={teamName}
            onTemplateDownloaded={handleTemplateDownloaded}
            className="border-0"
          />
        );

      case 'upload':
        return (
          <FileUploader
            teamId={teamId}
            teamName={teamName}
            onFileProcessed={handleFileProcessed}
            onFileCleared={handleFileCleared}
            className="border-0"
          />
        );

      case 'preview':
        return wizardState.fileData ? (
          <ImportPreview
            teamId={teamId}
            teamName={teamName}
            fileData={wizardState.fileData}
            existingPlayers={wizardState.existingPlayers}
            onConfirmImport={handleConfirmImport}
            onCancel={goToPreviousStep}
            className="border-0"
          />
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <div className="font-medium">Nessun file caricato</div>
            <div className="text-sm text-muted-foreground">Torna al passo precedente per caricare un file</div>
          </div>
        );

      case 'import':
        return wizardState.validationResult ? (
          <ImportResults
            teamId={teamId}
            teamName={teamName}
            validationResult={wizardState.validationResult}
            onComplete={handleImportComplete}
            onCancel={goToPreviousStep}
            onRetry={handleRetryImport}
            className="border-0"
          />
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <div className="font-medium">Nessuna validazione disponibile</div>
            <div className="text-sm text-muted-foreground">Torna al passo precedente per completare la preview</div>
          </div>
        );

      case 'results':
        return wizardState.importResult ? (
          <div className="text-center py-8 space-y-4">
            {wizardState.importResult.success ? (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <div className="text-xl font-bold text-green-600 mb-2">
                    Import Completato con Successo!
                  </div>
                  <div className="text-muted-foreground">
                    {wizardState.importResult.totalSuccessful} giocatori importati in {teamName}
                  </div>
                </div>
                
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={handleStartOver}>
                    Nuovo Import
                  </Button>
                  <Button onClick={onClose}>
                    Chiudi
                  </Button>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-16 w-16 mx-auto text-yellow-600" />
                <div>
                  <div className="text-xl font-bold text-yellow-600 mb-2">
                    Import Completato con Avvisi
                  </div>
                  <div className="text-muted-foreground">
                    {wizardState.importResult.totalSuccessful} successi, {wizardState.importResult.totalFailed} fallimenti
                  </div>
                </div>
                
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => goToStep('import')}>
                    Vedi Dettagli
                  </Button>
                  <Button variant="outline" onClick={handleStartOver}>
                    Nuovo Import
                  </Button>
                  <Button onClick={onClose}>
                    Chiudi
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <div className="font-medium">Nessun risultato disponibile</div>
            <div className="text-sm text-muted-foreground">Torna al passo precedente per avviare l'import</div>
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * Render wizard navigation
   */
  const renderNavigation = () => {
    const canGoBack = wizardState.currentStep !== 'template' && wizardState.currentStep !== 'import' && wizardState.currentStep !== 'results';
    
    // Determina se si può andare avanti in base allo step corrente
    const canGoNext = (() => {
      switch (wizardState.currentStep) {
        case 'template':
          return true; // Step template sempre navigabile
        case 'upload':
          return false; // Navigazione automatica dopo upload
        case 'preview':
          return false; // Navigazione automatica dopo conferma import
        case 'import':
          return false; // Navigazione automatica dopo import
        default:
          return false;
      }
    })();
    
    return (
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={!canGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Step {['template', 'upload', 'preview', 'import', 'results'].indexOf(wizardState.currentStep) + 1} di 5
          </span>
          
          {canGoNext && (
            <Button
              onClick={goToNextStep}
              className="flex items-center gap-2"
            >
              Avanti
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Bulk Giocatori
          </DialogTitle>
          <DialogDescription>
            Importa fino a 30 giocatori nel team <strong>{teamName}</strong> usando un template Excel o CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getWizardProgress()} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {getWizardProgress()}% completato
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {wizardState.currentStep !== 'results' && renderNavigation()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportWizard;