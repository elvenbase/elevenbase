import { PlayerTemplateRow } from './bulkImportTemplateService';

export interface PlayerConflict {
  type: 'jersey_duplicate' | 'email_duplicate' | 'phone_duplicate' | 'name_similar';
  severity: 'error' | 'warning';
  message: string;
  existingPlayer?: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    email?: string;
    phone?: string;
  };
}

export interface PlayerPreview extends PlayerTemplateRow {
  rowIndex: number;
  conflicts: PlayerConflict[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface BusinessValidationResult {
  valid: boolean;
  canImport: boolean;
  totalPlayers: number;
  playersWithErrors: number;
  playersWithWarnings: number;
  globalErrors: string[];
  globalWarnings: string[];
  players: PlayerPreview[];
}

export interface ExistingTeamData {
  players: Array<{
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    email?: string;
    phone?: string;
    status: string;
  }>;
}

class BulkImportBusinessValidator {
  /**
   * Validazione completa business con controllo conflitti
   */
  async validateForImport(
    templatePlayers: PlayerTemplateRow[],
    existingTeamData: ExistingTeamData
  ): Promise<BusinessValidationResult> {
    const globalErrors: string[] = [];
    const globalWarnings: string[] = [];
    const players: PlayerPreview[] = [];

    // Controlli globali preliminari
    if (templatePlayers.length === 0) {
      globalErrors.push('Nessun giocatore da importare');
      return this.buildEmptyResult(globalErrors, globalWarnings);
    }

    if (templatePlayers.length > 30) {
      globalErrors.push(`Troppi giocatori: ${templatePlayers.length} (max 30 per import)`);
    }

    // Processa ogni giocatore
    templatePlayers.forEach((player, index) => {
      const playerPreview = this.validateSinglePlayer(
        player, 
        index, 
        templatePlayers, 
        existingTeamData
      );
      players.push(playerPreview);
    });

    // Calcola statistiche
    const playersWithErrors = players.filter(p => p.hasErrors).length;
    const playersWithWarnings = players.filter(p => p.hasWarnings).length;

    // Controlli aggiuntivi globali
    this.performGlobalChecks(players, globalErrors, globalWarnings);

    const valid = globalErrors.length === 0 && playersWithErrors === 0;
    const canImport = valid; // Solo se completamente valido

    return {
      valid,
      canImport,
      totalPlayers: players.length,
      playersWithErrors,
      playersWithWarnings,
      globalErrors,
      globalWarnings,
      players
    };
  }

  /**
   * Validazione singolo giocatore con conflict detection
   */
  private validateSinglePlayer(
    player: PlayerTemplateRow,
    index: number,
    allTemplatePlayers: PlayerTemplateRow[],
    existingTeamData: ExistingTeamData
  ): PlayerPreview {
    const conflicts: PlayerConflict[] = [];

    // 1. Controllo jersey number vs giocatori esistenti
    if (player.jersey_number) {
      const jerseyNum = parseInt(player.jersey_number);
      const existingWithJersey = existingTeamData.players.find(
        p => p.jersey_number === jerseyNum && p.status !== 'inactive'
      );
      
      if (existingWithJersey) {
        conflicts.push({
          type: 'jersey_duplicate',
          severity: 'error',
          message: `Numero maglia ${jerseyNum} già usato da ${existingWithJersey.first_name} ${existingWithJersey.last_name}`,
          existingPlayer: existingWithJersey
        });
      }
    }

    // 2. Controllo email vs giocatori esistenti
    if (player.email && player.email.trim()) {
      const existingWithEmail = existingTeamData.players.find(
        p => p.email && p.email.toLowerCase() === player.email.toLowerCase() && p.status !== 'inactive'
      );
      
      if (existingWithEmail) {
        conflicts.push({
          type: 'email_duplicate',
          severity: 'error',
          message: `Email già utilizzata da ${existingWithEmail.first_name} ${existingWithEmail.last_name}`,
          existingPlayer: existingWithEmail
        });
      }
    }

    // 3. Controllo telefono vs giocatori esistenti
    if (player.phone && player.phone.trim()) {
      const normalizedPhone = this.normalizePhone(player.phone);
      const existingWithPhone = existingTeamData.players.find(p => {
        return p.phone && this.normalizePhone(p.phone) === normalizedPhone && p.status !== 'inactive';
      });
      
      if (existingWithPhone) {
        conflicts.push({
          type: 'phone_duplicate',
          severity: 'warning',
          message: `Telefono simile a ${existingWithPhone.first_name} ${existingWithPhone.last_name}`,
          existingPlayer: existingWithPhone
        });
      }
    }

    // 4. Controllo nomi simili (warning)
    const similarNamePlayer = this.findSimilarNamePlayer(player, existingTeamData.players);
    if (similarNamePlayer) {
      conflicts.push({
        type: 'name_similar',
        severity: 'warning',
        message: `Nome simile a giocatore esistente: ${similarNamePlayer.first_name} ${similarNamePlayer.last_name}`,
        existingPlayer: similarNamePlayer
      });
    }

    // 5. Controllo duplicati interni al template
    this.checkInternalDuplicates(player, index, allTemplatePlayers, conflicts);

    const hasErrors = conflicts.some(c => c.severity === 'error');
    const hasWarnings = conflicts.some(c => c.severity === 'warning');

    return {
      ...player,
      rowIndex: index + 6, // Riga reale nel file (dopo metadata + header)
      conflicts,
      hasErrors,
      hasWarnings
    };
  }

  /**
   * Controlli duplicati interni al template
   */
  private checkInternalDuplicates(
    currentPlayer: PlayerTemplateRow,
    currentIndex: number,
    allPlayers: PlayerTemplateRow[],
    conflicts: PlayerConflict[]
  ): void {
    allPlayers.forEach((otherPlayer, otherIndex) => {
      if (currentIndex === otherIndex) return;

      // Jersey duplicato nel template
      if (currentPlayer.jersey_number && otherPlayer.jersey_number && 
          currentPlayer.jersey_number === otherPlayer.jersey_number) {
        conflicts.push({
          type: 'jersey_duplicate',
          severity: 'error',
          message: `Numero maglia ${currentPlayer.jersey_number} duplicato nel template (riga ${otherIndex + 6})`
        });
      }

      // Email duplicata nel template
      if (currentPlayer.email && otherPlayer.email && 
          currentPlayer.email.toLowerCase() === otherPlayer.email.toLowerCase()) {
        conflicts.push({
          type: 'email_duplicate',
          severity: 'error',
          message: `Email duplicata nel template (riga ${otherIndex + 6})`
        });
      }
    });
  }

  /**
   * Controlli globali aggiuntivi
   */
  private performGlobalChecks(
    players: PlayerPreview[],
    globalErrors: string[],
    globalWarnings: string[]
  ): void {
    // Controllo distribuzione ruoli
    const roleDistribution = this.analyzeRoleDistribution(players);
    if (roleDistribution.warnings.length > 0) {
      globalWarnings.push(...roleDistribution.warnings);
    }

    // Controllo numeri maglia consecutivi
    const jerseyAnalysis = this.analyzeJerseyNumbers(players);
    if (jerseyAnalysis.warnings.length > 0) {
      globalWarnings.push(...jerseyAnalysis.warnings);
    }

    // Controllo età se disponibile
    const ageAnalysis = this.analyzeBirthDates(players);
    if (ageAnalysis.warnings.length > 0) {
      globalWarnings.push(...ageAnalysis.warnings);
    }
  }

  /**
   * Analisi distribuzione ruoli
   */
  private analyzeRoleDistribution(players: PlayerPreview[]): { warnings: string[] } {
    const warnings: string[] = [];
    const roles = players.map(p => p.player_role).filter(r => r && r.trim());
    
    if (roles.length > 0) {
      const roleCount = roles.reduce((acc, role) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Avvisi per distribuzione ruoli
      if (roleCount['starter'] && roleCount['starter'] > 11) {
        warnings.push(`Molti giocatori titolari: ${roleCount['starter']} (normale ~11)`);
      }
      
      if (roleCount['bench'] && roleCount['bench'] < 3) {
        warnings.push(`Poche riserve: ${roleCount['bench']} (consigliato almeno 3-5)`);
      }
    }

    return { warnings };
  }

  /**
   * Analisi numeri maglia
   */
  private analyzeJerseyNumbers(players: PlayerPreview[]): { warnings: string[] } {
    const warnings: string[] = [];
    const jerseyNumbers = players
      .map(p => parseInt(p.jersey_number))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (jerseyNumbers.length > 0) {
      // Controllo gap troppo grandi
      const gaps = [];
      for (let i = 1; i < jerseyNumbers.length; i++) {
        const gap = jerseyNumbers[i] - jerseyNumbers[i - 1];
        if (gap > 10) {
          gaps.push(gap);
        }
      }

      if (gaps.length > 0) {
        warnings.push('Numeri maglia con gap significativi - considera una numerazione più compatta');
      }

      // Controllo numeri alti
      const highNumbers = jerseyNumbers.filter(n => n > 50);
      if (highNumbers.length > jerseyNumbers.length * 0.3) {
        warnings.push('Molti numeri maglia alti (>50) - considera numeri più bassi per facilità');
      }
    }

    return { warnings };
  }

  /**
   * Analisi date di nascita
   */
  private analyzeBirthDates(players: PlayerPreview[]): { warnings: string[] } {
    const warnings: string[] = [];
    const birthDates = players
      .map(p => p.birth_date)
      .filter(d => d && this.isValidDate(d))
      .map(d => new Date(d!));

    if (birthDates.length > 0) {
      const currentYear = new Date().getFullYear();
      const ages = birthDates.map(d => currentYear - d.getFullYear());
      
      const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);

      if (maxAge - minAge > 15) {
        warnings.push(`Ampio range di età: ${minAge}-${maxAge} anni (differenza ${maxAge - minAge} anni)`);
      }

      if (avgAge < 16) {
        warnings.push('Team molto giovane - considera regolamenti categoria giovanile');
      }

      if (avgAge > 35) {
        warnings.push('Team con età elevata - considera gestione fisica');
      }
    }

    return { warnings };
  }

  /**
   * Trova giocatore con nome simile
   */
  private findSimilarNamePlayer(
    newPlayer: PlayerTemplateRow,
    existingPlayers: ExistingTeamData['players']
  ): ExistingTeamData['players'][0] | null {
    const newFullName = `${newPlayer.first_name} ${newPlayer.last_name}`.toLowerCase();
    
    for (const existing of existingPlayers) {
      if (existing.status === 'inactive') continue;
      
      const existingFullName = `${existing.first_name} ${existing.last_name}`.toLowerCase();
      
      // Controllo nome identico
      if (newFullName === existingFullName) {
        return existing;
      }
      
      // Controllo similarità (almeno 80% simile)
      const similarity = this.calculateStringSimilarity(newFullName, existingFullName);
      if (similarity > 0.8) {
        return existing;
      }
    }
    
    return null;
  }

  /**
   * Calcola similarità tra stringhe (Levenshtein distance based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcola Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Normalizza numero di telefono per confronto
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+39/, '');
  }

  /**
   * Verifica validità data
   */
  private isValidDate(dateString: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Costruisce risultato vuoto per errori preliminari
   */
  private buildEmptyResult(
    globalErrors: string[],
    globalWarnings: string[]
  ): BusinessValidationResult {
    return {
      valid: false,
      canImport: false,
      totalPlayers: 0,
      playersWithErrors: 0,
      playersWithWarnings: 0,
      globalErrors,
      globalWarnings,
      players: []
    };
  }

  /**
   * Genera statistiche di riepilogo per UI
   */
  generateSummaryStats(result: BusinessValidationResult): {
    readyToImport: number;
    needsAttention: number;
    hasConflicts: number;
    byStatus: Record<string, number>;
    byPosition: Record<string, number>;
  } {
    const readyToImport = result.players.filter(p => !p.hasErrors && !p.hasWarnings).length;
    const needsAttention = result.players.filter(p => p.hasWarnings && !p.hasErrors).length;
    const hasConflicts = result.players.filter(p => p.hasErrors).length;

    const byStatus = result.players.reduce((acc, player) => {
      const status = player.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPosition = result.players.reduce((acc, player) => {
      const position = player.position || 'unknown';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      readyToImport,
      needsAttention,
      hasConflicts,
      byStatus,
      byPosition
    };
  }
}

// Export singleton instance
export const bulkImportBusinessValidator = new BulkImportBusinessValidator();
export default bulkImportBusinessValidator;