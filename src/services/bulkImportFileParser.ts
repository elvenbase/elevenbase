import * as XLSX from 'sheetjs-style';
import { PlayerTemplateRow, TemplateMetadata } from './bulkImportTemplateService';
import { supabase } from '@/integrations/supabase/client';

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedFileData {
  metadata: TemplateMetadata;
  players: PlayerTemplateRow[];
  validation: FileValidationResult;
}

export interface FileSecurityCheck {
  isSecure: boolean;
  threats: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

class BulkImportFileParser {
  private readonly TEMPLATE_VERSION = 'v1.0';
  private readonly MAX_PLAYERS = 30;
  private readonly MAX_FILE_SIZE_EXCEL = 2 * 1024 * 1024; // 2MB
  private readonly MAX_FILE_SIZE_CSV = 500 * 1024; // 500KB
  
  private readonly ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/csv' // .csv alternative
  ];

  /**
   * Validazione sicurezza file PRIMA del parsing
   */
  performSecurityCheck(file: File): FileSecurityCheck {
    const threats: string[] = [];
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };

    // Controllo estensione file
    const extension = file.name.toLowerCase().split('.').pop();
    if (!['xlsx', 'csv'].includes(extension || '')) {
      threats.push(`Estensione file non supportata: ${extension}`);
    }

    // Controllo MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      threats.push(`MIME type non supportato: ${file.type}`);
    }

    // Controllo dimensione file
    const maxSize = extension === 'xlsx' ? this.MAX_FILE_SIZE_EXCEL : this.MAX_FILE_SIZE_CSV;
    if (file.size > maxSize) {
      threats.push(`File troppo grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Controllo nome file per caratteri pericolosi
    // eslint-disable-next-line no-control-regex
    if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
      threats.push('Nome file contiene caratteri non sicuri');
    }

    // Controllo file vuoto
    if (file.size === 0) {
      threats.push('File vuoto');
    }

    return {
      isSecure: threats.length === 0,
      threats,
      fileInfo
    };
  }

  /**
   * Parsing completo file con validazione team
   */
  async parseFile(file: File, expectedTeamId: string): Promise<ParsedFileData> {
    // 1. Security check preliminare
    const securityCheck = this.performSecurityCheck(file);
    if (!securityCheck.isSecure) {
      return {
        metadata: {} as TemplateMetadata,
        players: [],
        validation: {
          valid: false,
          errors: securityCheck.threats,
          warnings: []
        }
      };
    }

    // 2. Determina tipo file e parsea
    const extension = file.name.toLowerCase().split('.').pop();
    let parseResult: ParsedFileData;

    try {
      if (extension === 'xlsx') {
        parseResult = await this.parseExcelFile(file, expectedTeamId);
      } else if (extension === 'csv') {
        parseResult = await this.parseCSVFile(file, expectedTeamId);
      } else {
        throw new Error('Formato file non supportato');
      }

      return parseResult;
    } catch (error) {
      return {
        metadata: {} as TemplateMetadata,
        players: [],
        validation: {
          valid: false,
          errors: [`Errore parsing file: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`],
          warnings: []
        }
      };
    }
  }

  /**
   * Parsing file Excel
   */
  private async parseExcelFile(file: File, expectedTeamId: string): Promise<ParsedFileData> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendi il primo worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Converti in array di array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
          
          this.processWorksheetData(jsonData, expectedTeamId, 'XLSX').then(resolve);
        } catch (error) {
          resolve({
            metadata: {} as TemplateMetadata,
            players: [],
            validation: {
              valid: false,
              errors: [`Errore lettura Excel: ${error instanceof Error ? error.message : 'File corrotto'}`],
              warnings: []
            }
          });
        }
      };

      reader.onerror = () => {
        resolve({
          metadata: {} as TemplateMetadata,
          players: [],
          validation: {
            valid: false,
            errors: ['Errore lettura file'],
            warnings: []
          }
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parsing file CSV
   */
  private async parseCSVFile(file: File, expectedTeamId: string): Promise<ParsedFileData> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          
          // Controllo encoding UTF-8
          if (!this.isValidUTF8(csvContent)) {
            resolve({
              metadata: {} as TemplateMetadata,
              players: [],
              validation: {
                valid: false,
                errors: ['File CSV deve essere codificato in UTF-8'],
                warnings: []
              }
            });
            return;
          }

          // Parsing CSV manuale per sicurezza
          const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          const jsonData = this.parseCSVLines(lines);
          
          this.processWorksheetData(jsonData, expectedTeamId, 'CSV').then(resolve);
        } catch (error) {
          resolve({
            metadata: {} as TemplateMetadata,
            players: [],
            validation: {
              valid: false,
              errors: [`Errore lettura CSV: ${error instanceof Error ? error.message : 'File corrotto'}`],
              warnings: []
            }
          });
        }
      };

      reader.onerror = () => {
        resolve({
          metadata: {} as TemplateMetadata,
          players: [],
          validation: {
            valid: false,
            errors: ['Errore lettura file'],
            warnings: []
          }
        });
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parsing CSV manuale sicuro
   */
  private parseCSVLines(lines: string[]): any[][] {
    const result: any[][] = [];
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        // Riga commento - rimuovi # e tratta come dati
        const commentData = line.substring(1).trim();
        if (commentData) {
          result.push(this.parseCSVRow(commentData));
        }
      } else {
        result.push(this.parseCSVRow(line));
      }
    }
    
    return result;
  }

  /**
   * Parsing singola riga CSV con gestione quote
   */
  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Processa dati worksheet (comune per Excel e CSV)
   */
  private async processWorksheetData(data: any[][], expectedTeamId: string, format: 'XLSX' | 'CSV'): Promise<ParsedFileData> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validazione struttura minima
    if (data.length < 6) {
      errors.push('File troppo corto - servono almeno 6 righe');
      return {
        metadata: {} as TemplateMetadata,
        players: [],
        validation: { valid: false, errors, warnings }
      };
    }

    // Estrai e valida metadata
    const metadata = this.extractMetadata(data, format);
    const metadataValidation = this.validateMetadata(metadata, expectedTeamId);
    
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);

    // Se metadata non validi, ferma qui
    if (metadataValidation.errors.length > 0) {
      return {
        metadata,
        players: [],
        validation: { valid: false, errors, warnings }
      };
    }

    // Estrai e valida header
    const headerValidation = this.validateHeader(data);
    errors.push(...headerValidation.errors);
    warnings.push(...headerValidation.warnings);

    // Estrai dati giocatori
    const players = this.extractPlayerData(data);
    const playersValidation = await this.validatePlayersData(players);
    
    errors.push(...playersValidation.errors);
    warnings.push(...playersValidation.warnings);

    return {
      metadata,
      players,
      validation: {
        valid: errors.length === 0,
        errors,
        warnings
      }
    };
  }

  /**
   * Estrai metadata dalle prime righe
   */
  private extractMetadata(data: any[][], format: 'XLSX' | 'CSV'): TemplateMetadata {
    try {
      // Riga 1: ELEVENBASE_TEMPLATE, v1.0, PLAYERS_IMPORT
      // Riga 2: TEAM_ID, {uuid}, GENERATED_AT, {timestamp}
      // Riga 3: MAX_PLAYERS, 30, FORMAT, {format}

      return {
        teamId: data[1]?.[1] || '',
        teamName: '', // Non presente nel template
        generatedAt: data[1]?.[3] || '',
        version: data[0]?.[1] || ''
      };
    } catch (error) {
      return {} as TemplateMetadata;
    }
  }

  /**
   * Validazione metadata con controllo team
   */
  private validateMetadata(metadata: TemplateMetadata, expectedTeamId: string): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Controllo template signature
    if (metadata.version !== this.TEMPLATE_VERSION) {
      errors.push(`Versione template non supportata: ${metadata.version} (richiesta: ${this.TEMPLATE_VERSION})`);
    }

    // 🔒 CONTROLLO TEAM ID - CRITICO PER SICUREZZA
    if (!metadata.teamId) {
      errors.push('Team ID mancante nel template');
    } else if (metadata.teamId !== expectedTeamId) {
      errors.push(`SICUREZZA: Template appartiene a un altro team (${metadata.teamId} vs ${expectedTeamId})`);
    }

    // Controllo timestamp
    if (!metadata.generatedAt) {
      warnings.push('Timestamp generazione mancante');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validazione header colonne
   */
  private validateHeader(data: any[][]): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const expectedHeaders = [
      'first_name*', 'last_name*', 'jersey_number*', 'position', 
      'player_role', 'status*', 'phone', 'birth_date', 'email', 
      'esperienza', 'notes', 'ea_sport_id', 'gaming_platform', 'platform_id'
    ];

    const actualHeaders = data[4] || []; // Riga 5 (indice 4)

    // Controllo header obbligatori
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (actualHeaders[i] !== expectedHeaders[i]) {
        errors.push(`Header colonna ${i + 1} errato: trovato "${actualHeaders[i]}", atteso "${expectedHeaders[i]}"`);
      }
    }

    // Controllo colonne extra
    if (actualHeaders.length > expectedHeaders.length) {
      warnings.push(`Trovate ${actualHeaders.length - expectedHeaders.length} colonne extra che verranno ignorate`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Estrai dati giocatori dalle righe
   */
  private extractPlayerData(data: any[][]): PlayerTemplateRow[] {
    const players: PlayerTemplateRow[] = [];
    
    // Inizia dalla riga 6 (indice 5) - dopo header
    for (let i = 5; i < data.length && i < 5 + this.MAX_PLAYERS; i++) {
      const row = data[i];
      
      // Salta righe vuote
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }

      const player: PlayerTemplateRow = {
        first_name: row[0]?.toString().trim() || '',
        last_name: row[1]?.toString().trim() || '',
        jersey_number: row[2]?.toString().trim() || '',
        position: row[3]?.toString().trim() || '',
        player_role: row[4]?.toString().trim() || '',
        status: row[5]?.toString().trim() as any || 'active',
        phone: row[6]?.toString().trim() || '',
        birth_date: row[7]?.toString().trim() || '',
        email: row[8]?.toString().trim() || '',
        esperienza: row[9]?.toString().trim() || '',
        notes: row[10]?.toString().trim() || '',
        // Campi Gaming
        ea_sport_id: row[11]?.toString().trim() || '',
        gaming_platform: row[12]?.toString().trim() || '',
        platform_id: row[13]?.toString().trim() || ''
      };

      players.push(player);
    }

    return players;
  }

  /**
   * Validazione dati giocatori
   */
  private async validatePlayersData(players: PlayerTemplateRow[]): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (players.length === 0) {
      errors.push('Nessun giocatore trovato nel file');
      return { valid: false, errors, warnings };
    }

    if (players.length > this.MAX_PLAYERS) {
      errors.push(`Troppi giocatori: ${players.length} (max ${this.MAX_PLAYERS})`);
    }

    // Fetch ruoli validi dal sistema centralizzato
    let validRoles: string[] = [];
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('field_options')
        .select('option_value')
        .eq('field_name', 'player_role');

      if (rolesError) {
        warnings.push('Impossibile validare ruoli: ' + rolesError.message);
      } else {
        validRoles = rolesData?.map(r => r.option_value) || [];
      }
    } catch (error) {
      warnings.push('Errore nel fetch ruoli validi');
    }

    // Validazione per ogni giocatore
    players.forEach((player, index) => {
      const rowNum = index + 6; // Riga reale nel file

      // Campi obbligatori
      if (!player.first_name) {
        errors.push(`Riga ${rowNum}: Nome obbligatorio`);
      }
      if (!player.last_name) {
        errors.push(`Riga ${rowNum}: Cognome obbligatorio`);
      }
      if (!player.jersey_number) {
        errors.push(`Riga ${rowNum}: Numero maglia obbligatorio`);
      }
      if (!player.status) {
        errors.push(`Riga ${rowNum}: Status obbligatorio`);
      }

      // Validazioni formato
      if (player.jersey_number && (isNaN(Number(player.jersey_number)) || Number(player.jersey_number) < 1 || Number(player.jersey_number) > 99)) {
        errors.push(`Riga ${rowNum}: Numero maglia deve essere tra 1 e 99`);
      }

      if (player.status && !['active', 'inactive', 'injured', 'suspended'].includes(player.status)) {
        errors.push(`Riga ${rowNum}: Status non valido "${player.status}"`);
      }

      if (player.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)) {
        errors.push(`Riga ${rowNum}: Email non valida "${player.email}"`);
      }

      if (player.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(player.birth_date)) {
        errors.push(`Riga ${rowNum}: Data nascita deve essere formato YYYY-MM-DD`);
      }

      // Validazione ruolo contro sistema centralizzato
      if (player.player_role && player.player_role.trim()) {
        const role = player.player_role.trim();
        if (validRoles.length > 0 && !validRoles.includes(role)) {
          errors.push(`Riga ${rowNum}: Ruolo non valido "${role}". Ruoli ammessi: ${validRoles.join(', ')}`);
        }
      }

      // Validazione gaming platform
      if (player.gaming_platform && player.gaming_platform.trim()) {
        const platform = player.gaming_platform.trim();
        const validPlatforms = ['PC', 'PS5', 'Xbox', 'Nintendo Switch'];
        if (!validPlatforms.includes(platform)) {
          errors.push(`Riga ${rowNum}: Piattaforma gaming non valida "${platform}". Piattaforme ammesse: ${validPlatforms.join(', ')}`);
        }
        
        // Validazione Platform ID per console
        if ((platform === 'PS5' || platform === 'Xbox') && (!player.platform_id || !player.platform_id.trim())) {
          errors.push(`Riga ${rowNum}: Platform ID obbligatorio per ${platform}`);
        }
      }

      // Controllo injection CSV
      if (this.hasCSVInjection(player)) {
        errors.push(`Riga ${rowNum}: Rilevata possibile injection (celle che iniziano con =+@-)`);
      }
    });

    // Controllo duplicati numero maglia
    const jerseyNumbers = players.map(p => p.jersey_number).filter(n => n);
    const duplicateJerseys = jerseyNumbers.filter((num, index) => jerseyNumbers.indexOf(num) !== index);
    if (duplicateJerseys.length > 0) {
      errors.push(`Numeri maglia duplicati: ${[...new Set(duplicateJerseys)].join(', ')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Controllo CSV injection
   */
  private hasCSVInjection(player: PlayerTemplateRow): boolean {
    const dangerousChars = ['=', '+', '@', '-'];
    const fields = Object.values(player);
    
    return fields.some(field => 
      typeof field === 'string' && 
      field.length > 0 && 
      dangerousChars.includes(field.charAt(0))
    );
  }

  /**
   * Controllo encoding UTF-8
   */
  private isValidUTF8(str: string): boolean {
    try {
      // Se la stringa può essere codificata e decodificata senza errori, è UTF-8
      return str === decodeURIComponent(encodeURIComponent(str));
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const bulkImportFileParser = new BulkImportFileParser();
export default bulkImportFileParser;