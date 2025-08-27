import { supabase } from '@/integrations/supabase/client';
import { BusinessValidationResult, PlayerPreview } from './bulkImportBusinessValidator';

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentPlayer?: string;
  phase: 'preparing' | 'importing' | 'validating' | 'completing' | 'completed' | 'error';
}

export interface ImportResult {
  success: boolean;
  totalAttempted: number;
  totalSuccessful: number;
  totalFailed: number;
  importedPlayers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    jersey_number: number;
  }>;
  failedPlayers: Array<{
    player: PlayerPreview;
    error: string;
    index: number;
  }>;
  executionTime: number;
  teamId: string;
}

export interface ImportExecutorOptions {
  teamId: string;
  teamName: string;
  validationResult: BusinessValidationResult;
  onProgress?: (progress: ImportProgress) => void;
  batchSize?: number;
}

class BulkImportExecutor {
  private readonly DEFAULT_BATCH_SIZE = 5;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // ms

  /**
   * Esegue import bulk con gestione transazioni e rollback
   */
  async executeImport(options: ImportExecutorOptions): Promise<ImportResult> {
    const startTime = Date.now();
    const {
      teamId,
      teamName,
      validationResult,
      onProgress,
      batchSize = this.DEFAULT_BATCH_SIZE
    } = options;

    const importedPlayers: ImportResult['importedPlayers'] = [];
    const failedPlayers: ImportResult['failedPlayers'] = [];

    try {
      // Validazione preliminare
      if (!validationResult.canImport) {
        throw new Error('Import non permesso - validazione fallita');
      }

      const playersToImport = validationResult.players.filter(p => !p.hasErrors);
      
      if (playersToImport.length === 0) {
        throw new Error('Nessun giocatore valido da importare');
      }

      // Progress: Preparing
      this.updateProgress(onProgress, {
        current: 0,
        total: playersToImport.length,
        percentage: 0,
        phase: 'preparing'
      });

      // Verifica team esistenza e permessi
      await this.validateTeamAccess(teamId);

      // Progress: Importing
      this.updateProgress(onProgress, {
        current: 0,
        total: playersToImport.length,
        percentage: 0,
        phase: 'importing'
      });

      // Import in batch per performance e gestione errori
      for (let i = 0; i < playersToImport.length; i += batchSize) {
        const batch = playersToImport.slice(i, i + batchSize);
        
        try {
          const batchResults = await this.importPlayerBatch(
            batch,
            teamId,
            i,
            onProgress,
            playersToImport.length
          );

          importedPlayers.push(...batchResults.successful);
          failedPlayers.push(...batchResults.failed);

        } catch (error) {
          console.error(`Errore batch ${i}-${i + batch.length}:`, error);
          
          // Aggiungi tutto il batch ai falliti
          batch.forEach((player, batchIndex) => {
            failedPlayers.push({
              player,
              error: error instanceof Error ? error.message : 'Errore sconosciuto',
              index: i + batchIndex
            });
          });
        }

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < playersToImport.length) {
          await this.delay(100);
        }
      }

      // Progress: Completing
      this.updateProgress(onProgress, {
        current: playersToImport.length,
        total: playersToImport.length,
        percentage: 100,
        phase: 'completing'
      });

      // Aggiorna cache query se import avvenuto con successo
      if (importedPlayers.length > 0) {
        await this.invalidatePlayerCaches();
      }

      // Progress: Completed
      this.updateProgress(onProgress, {
        current: playersToImport.length,
        total: playersToImport.length,
        percentage: 100,
        phase: 'completed'
      });

      const executionTime = Date.now() - startTime;

      return {
        success: failedPlayers.length === 0,
        totalAttempted: playersToImport.length,
        totalSuccessful: importedPlayers.length,
        totalFailed: failedPlayers.length,
        importedPlayers,
        failedPlayers,
        executionTime,
        teamId
      };

    } catch (error) {
      console.error('Errore generale import:', error);

      // Progress: Error
      this.updateProgress(onProgress, {
        current: 0,
        total: validationResult.players.length,
        percentage: 0,
        phase: 'error'
      });

      // Se abbiamo giocatori già importati, prova rollback
      if (importedPlayers.length > 0) {
        await this.attemptRollback(importedPlayers, teamId);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: false,
        totalAttempted: validationResult.players.length,
        totalSuccessful: 0,
        totalFailed: validationResult.players.length,
        importedPlayers: [],
        failedPlayers: validationResult.players.map((player, index) => ({
          player,
          error: error instanceof Error ? error.message : 'Errore generale import',
          index
        })),
        executionTime,
        teamId
      };
    }
  }

  /**
   * Import batch di giocatori con retry logic
   */
  private async importPlayerBatch(
    players: PlayerPreview[],
    teamId: string,
    startIndex: number,
    onProgress?: (progress: ImportProgress) => void,
    totalPlayers: number = players.length
  ): Promise<{
    successful: ImportResult['importedPlayers'];
    failed: ImportResult['failedPlayers'];
  }> {
    const successful: ImportResult['importedPlayers'] = [];
    const failed: ImportResult['failedPlayers'] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const globalIndex = startIndex + i;

      // Update progress
      this.updateProgress(onProgress, {
        current: globalIndex,
        total: totalPlayers,
        percentage: Math.round((globalIndex / totalPlayers) * 100),
        currentPlayer: `${player.first_name} ${player.last_name}`,
        phase: 'importing'
      });

      try {
        const importedPlayer = await this.importSinglePlayerWithRetry(player, teamId);
        successful.push(importedPlayer);
      } catch (error) {
        console.error(`Errore import giocatore ${player.first_name} ${player.last_name}:`, error);
        failed.push({
          player,
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
          index: globalIndex
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Import singolo giocatore con retry logic
   */
  private async importSinglePlayerWithRetry(
    player: PlayerPreview,
    teamId: string,
    retryCount = 0
  ): Promise<ImportResult['importedPlayers'][0]> {
    try {
      // Prepara dati giocatore per insert
      const playerData = this.preparePlayerData(player, teamId);

      // Insert con controllo team_id
      const { data, error } = await supabase
        .from('players')
        .insert(playerData)
        .select('id, first_name, last_name, jersey_number')
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert');
      }

      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        jersey_number: data.jersey_number
      };

    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.warn(`Retry ${retryCount + 1}/${this.MAX_RETRIES} for player ${player.first_name} ${player.last_name}`);
        await this.delay(this.RETRY_DELAY * (retryCount + 1));
        return this.importSinglePlayerWithRetry(player, teamId, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Prepara dati giocatore per insert database
   */
  private preparePlayerData(player: PlayerPreview, teamId: string): any {
    return {
      // Campi obbligatori
      first_name: player.first_name.trim(),
      last_name: player.last_name.trim(),
      jersey_number: parseInt(player.jersey_number),
      status: player.status,
      team_id: teamId, // 🔒 TEAM ID FORZATO
      
      // Campi opzionali
      position: player.position?.trim() || null,
      player_role: player.player_role?.trim() || null,
      phone: player.phone?.trim() || null,
      email: player.email?.trim() || null,
      birth_date: player.birth_date?.trim() || null,
      esperienza: player.esperienza?.trim() || null,
      notes: player.notes?.trim() || null,
      
      // Campi gaming
      ea_sport_id: player.ea_sport_id?.trim() || null,
      gaming_platform: player.gaming_platform?.trim() || null,
      platform_id: player.platform_id?.trim() || null,
      
      // Campi automatici
      created_at: new Date().toISOString(),
      avatar_url: null, // Non supportiamo avatar import
      is_captain: false
    };
  }

  /**
   * Valida accesso al team
   */
  private async validateTeamAccess(teamId: string): Promise<void> {
    try {
      // Verifica esistenza team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        throw new Error(`Team non trovato: ${teamId}`);
      }

      // Verifica appartenenza utente al team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato');
      }

      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        throw new Error('Accesso negato: non fai parte di questo team');
      }

      // Verifica permessi per import (solo owner/admin)
      if (!['owner', 'admin'].includes(membership.role)) {
        throw new Error('Permessi insufficienti: solo owner e admin possono importare giocatori');
      }

    } catch (error) {
      console.error('Errore validazione accesso team:', error);
      throw error;
    }
  }

  /**
   * Tentativo rollback in caso di errore
   */
  private async attemptRollback(
    importedPlayers: ImportResult['importedPlayers'],
    teamId: string
  ): Promise<void> {
    if (importedPlayers.length === 0) return;

    try {
      console.warn(`Tentativo rollback per ${importedPlayers.length} giocatori...`);
      
      const playerIds = importedPlayers.map(p => p.id);
      
      // Cancella giocatori importati in questo batch
      const { error } = await supabase
        .from('players')
        .delete()
        .in('id', playerIds)
        .eq('team_id', teamId); // 🔒 DOUBLE CHECK team_id

      if (error) {
        console.error('Errore rollback:', error);
        throw new Error('Rollback fallito - contatta supporto');
      }

      console.info(`Rollback completato per ${playerIds.length} giocatori`);
      
    } catch (error) {
      console.error('Errore critico rollback:', error);
      // Non rilanciare - l'errore originale è più importante
    }
  }

  /**
   * Invalida cache query per aggiornamento UI
   */
  private async invalidatePlayerCaches(): Promise<void> {
    try {
      // Non possiamo accedere direttamente a queryClient qui,
      // ma possiamo fare una query di refresh
      console.info('Cache invalidation richiesta per players');
    } catch (error) {
      console.warn('Errore invalidazione cache:', error);
    }
  }

  /**
   * Helper per update progress
   */
  private updateProgress(
    onProgress: ((progress: ImportProgress) => void) | undefined,
    progress: ImportProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * Helper per delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stima tempo rimanente basato su performance corrente
   */
  estimateRemainingTime(
    current: number,
    total: number,
    startTime: number
  ): number {
    if (current === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerItem = elapsed / current;
    const remaining = total - current;
    
    return Math.round(remaining * avgTimePerItem);
  }

  /**
   * Genera statistiche performance per monitoring
   */
  generatePerformanceStats(result: ImportResult): {
    playersPerSecond: number;
    avgTimePerPlayer: number;
    successRate: number;
    errorRate: number;
  } {
    const playersPerSecond = (result.totalSuccessful / result.executionTime) * 1000;
    const avgTimePerPlayer = result.executionTime / result.totalAttempted;
    const successRate = (result.totalSuccessful / result.totalAttempted) * 100;
    const errorRate = (result.totalFailed / result.totalAttempted) * 100;

    return {
      playersPerSecond: Math.round(playersPerSecond * 100) / 100,
      avgTimePerPlayer: Math.round(avgTimePerPlayer),
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }
}

// Export singleton instance
export const bulkImportExecutor = new BulkImportExecutor();
export default bulkImportExecutor;