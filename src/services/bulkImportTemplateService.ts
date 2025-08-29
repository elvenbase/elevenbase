import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateMetadata {
  teamId: string;
  teamName: string;
  generatedAt: string;
  version: string;
}

export interface PlayerTemplateRow {
  first_name: string;
  last_name: string;
  jersey_number: number | string;
  position?: string;
  player_role?: string;
  status: 'active' | 'inactive' | 'injured' | 'suspended';
  phone?: string;
  birth_date?: string;
  email?: string;
  esperienza?: string;
  notes?: string;
  // Campi Gaming
  ea_sport_id?: string;
  gaming_platform?: string;
  platform_id?: string;
}

class BulkImportTemplateService {
  private readonly TEMPLATE_VERSION = 'v1.0';
  private readonly MAX_PLAYERS = 30;

  /**
   * Fetch ruoli validi dal sistema centralizzato
   */
  private async fetchValidRoles(): Promise<string[]> {
    try {
      const { data: rolesData, error } = await supabase
        .from('field_options')
        .select('option_value, option_label')
        .eq('field_name', 'player_role')
        .order('sort_order');

      if (error) {
        console.error('Errore nel fetch ruoli:', error);
        return [];
      }

      return rolesData?.map(r => r.option_value) || [];
    } catch (error) {
      console.error('Errore nel fetch ruoli:', error);
      return [];
    }
  }

  /**
   * Genera template Excel (.xlsx) per l'import bulk giocatori
   */
  generateExcelTemplate(metadata: TemplateMetadata): void {
    const workbook = XLSX.utils.book_new();
    
    // Crea worksheet
    const worksheetData: any[][] = [];
    
    // Riga 1: Template metadata
    worksheetData.push(['ELEVENBASE_TEMPLATE', this.TEMPLATE_VERSION, 'PLAYERS_IMPORT']);
    
    // Riga 2: Team info
    worksheetData.push(['TEAM_ID', metadata.teamId, 'GENERATED_AT', metadata.generatedAt]);
    
    // Riga 3: Limiti
    worksheetData.push(['MAX_PLAYERS', this.MAX_PLAYERS, 'FORMAT', 'XLSX']);
    
    // Riga 4: Vuota (separatore)
    worksheetData.push([]);
    
    // Riga 5: Sezione ruoli validi
    worksheetData.push(['=== RUOLI VALIDI ===']);
    worksheetData.push(['difensore_centrale, terzino_destro, terzino_sinistro, esterno_destro_basso, esterno_sinistro_basso, mediano, regista, mezzala, interno_centrocampo, trequartista, ala_destra, ala_sinistra, seconda_punta, falso_nove, centravanti']);
    worksheetData.push([]);
    
    // Riga 8: Sezione gaming platforms
    worksheetData.push(['=== GAMING PLATFORMS ===']);
    worksheetData.push(['PC, PS5, Xbox, Nintendo Switch']);
    worksheetData.push([]);
    
    // Riga 11: Header colonne
    worksheetData.push([
      'first_name*',
      'last_name*', 
      'jersey_number*',
      'position',
      'player_role',
      'status*',
      'phone',
      'birth_date',
      'email',
      'esperienza',
      'notes',
      'ea_sport_id',
      'gaming_platform',
      'platform_id'
    ]);
    
    // Riga 12-13: Solo 2 esempi puliti
    worksheetData.push([
      'Mario',
      'Rossi',
      10,
      'Centrocampo',
      'regista',
      'active',
      '+39123456789',
      '1995-03-15',
      'mario.rossi@email.com',
      'Professionale',
      'Capitano squadra',
      'MarioRossi_EA',
      'PS5',
      'PSNMarioRossi'
    ]);
    
    worksheetData.push([
      'Luigi',
      'Bianchi',
      7,
      'Attacco',
      'centravanti',
      'active',
      '',
      '',
      '',
      '',
      '',
      '',
      'PC',
      ''
    ]);
    
    // Crea worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Styling e protezioni
    this.styleExcelWorksheet(worksheet);
    
    // Aggiungi worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giocatori');
    
    // Genera e scarica file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `template_giocatori_${metadata.teamName}_${this.formatDate(new Date())}.xlsx`);
  }

  /**
   * Genera template CSV per l'import bulk giocatori
   */
  generateCSVTemplate(metadata: TemplateMetadata): void {
    const csvContent = this.buildCSVContent(metadata);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(blob, `template_giocatori_${metadata.teamName}_${this.formatDate(new Date())}.csv`);
  }

  /**
   * Costruisce il contenuto del CSV
   */
  private buildCSVContent(metadata: TemplateMetadata): string {
    const lines: string[] = [];
    
    // Metadata come commenti
    lines.push(`# ELEVENBASE_TEMPLATE,${this.TEMPLATE_VERSION},PLAYERS_IMPORT`);
    lines.push(`# TEAM_ID,${metadata.teamId},GENERATED_AT,${metadata.generatedAt}`);
    lines.push(`# MAX_PLAYERS,${this.MAX_PLAYERS},FORMAT,CSV`);
    lines.push('#');
    lines.push('# RUOLI VALIDI: difensore_centrale, terzino_destro, terzino_sinistro, esterno_destro_basso, esterno_sinistro_basso,');
    lines.push('# mediano, regista, mezzala, interno_centrocampo, trequartista, ala_destra, ala_sinistra, seconda_punta, falso_nove, centravanti');
    lines.push('#');
    
    // Gaming platforms info
    lines.push('# GAMING PLATFORMS: PC, PS5, Xbox, Nintendo Switch');
    lines.push('#');
    
    // Header con campi gaming
    lines.push('first_name*,last_name*,jersey_number*,position,player_role,status*,phone,birth_date,email,esperienza,notes,ea_sport_id,gaming_platform,platform_id');
    
    // Esempi puliti
    lines.push('Mario,Rossi,10,Centrocampo,regista,active,+39123456789,1995-03-15,mario.rossi@email.com,Professionale,"Capitano squadra",MarioRossi_EA,PS5,PSNMarioRossi');
    lines.push('Luigi,Bianchi,7,Attacco,centravanti,active,,,,,,,PC,');
    
    return lines.join('\n');
  }

  /**
   * Costruisce il contenuto del CSV con ruoli dinamici
   */
  private async buildCSVContentDynamic(metadata: TemplateMetadata): Promise<string> {
    const lines: string[] = [];
    
    // Fetch ruoli dinamici
    const validRoles = await this.fetchValidRoles();
    const rolesText = validRoles.length > 0 ? validRoles.join(', ') : 'Caricamento ruoli fallito';
    
    // Metadata come commenti
    lines.push(`# ELEVENBASE_TEMPLATE,${this.TEMPLATE_VERSION},PLAYERS_IMPORT`);
    lines.push(`# TEAM_ID,${metadata.teamId},GENERATED_AT,${metadata.generatedAt}`);
    lines.push(`# MAX_PLAYERS,${this.MAX_PLAYERS},FORMAT,CSV`);
    lines.push('#');
    lines.push(`# RUOLI VALIDI: ${rolesText}`);
    lines.push('#');
    lines.push('# GAMING PLATFORMS: PC, PS5, Xbox, Nintendo Switch');
    lines.push('#');
    
    // Header
    lines.push('first_name*,last_name*,jersey_number*,position,player_role,status*,phone,birth_date,email,esperienza,notes,ea_sport_id,gaming_platform,platform_id');
    
    // Esempi con ruoli dinamici
    const exampleRole1 = validRoles.includes('regista') ? 'regista' : (validRoles[0] || 'ruolo_esempio');
    const exampleRole2 = validRoles.includes('centravanti') ? 'centravanti' : (validRoles[1] || 'ruolo_esempio_2');
    
    lines.push(`Mario,Rossi,10,Centrocampo,${exampleRole1},active,+39123456789,1995-03-15,mario.rossi@email.com,Professionale,"Capitano squadra",MarioRossi_EA,PS5,PSNMarioRossi`);
    lines.push(`Luigi,Bianchi,7,Attacco,${exampleRole2},active,,,,,,,PC,`);
    
    return lines.join('\n');
  }

  /**
   * Genera template Excel (.xlsx) con ruoli dinamici - VERSIONE ASINCRONA
   */
  async generateExcelTemplateAsync(metadata: TemplateMetadata): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    // Fetch ruoli dinamici
    const validRoles = await this.fetchValidRoles();
    const rolesText = validRoles.length > 0 ? validRoles.join(', ') : 'Caricamento ruoli fallito';
    
    const worksheetData: any[][] = [];
    
    // Riga 1: Template metadata
    worksheetData.push(['ELEVENBASE_TEMPLATE', this.TEMPLATE_VERSION, 'PLAYERS_IMPORT']);
    
    // Riga 2: Team info
    worksheetData.push(['TEAM_ID', metadata.teamId, 'GENERATED_AT', metadata.generatedAt]);
    
    // Riga 3: Limiti
    worksheetData.push(['MAX_PLAYERS', this.MAX_PLAYERS, 'FORMAT', 'XLSX']);
    
    // Riga 4: Vuota (separatore)
    worksheetData.push([]);
    
    // Riga 5: Sezione ruoli validi
    worksheetData.push(['=== RUOLI VALIDI ===']);
    worksheetData.push([rolesText]);
    worksheetData.push([]);
    
    // Riga 8: Sezione gaming platforms
    worksheetData.push(['=== GAMING PLATFORMS ===']);
    worksheetData.push(['PC, PS5, Xbox, Nintendo Switch']);
    worksheetData.push([]);
    
    // Riga 11: Header colonne
    worksheetData.push([
      'first_name*',
      'last_name*', 
      'jersey_number*',
      'position',
      'player_role',
      'status*',
      'phone',
      'birth_date',
      'email',
      'esperienza',
      'notes',
      'ea_sport_id',
      'gaming_platform',
      'platform_id'
    ]);
    
    // Riga 12-13: Solo 2 esempi puliti con ruoli dinamici
    const exampleRole1 = validRoles.includes('regista') ? 'regista' : (validRoles[0] || 'ruolo_esempio');
    const exampleRole2 = validRoles.includes('centravanti') ? 'centravanti' : (validRoles[1] || 'ruolo_esempio_2');
    
    worksheetData.push([
      'Mario',
      'Rossi',
      10,
      'Centrocampo',
      exampleRole1,
      'active',
      '+39123456789',
      '1995-03-15',
      'mario.rossi@email.com',
      'Professionale',
      'Capitano squadra',
      'MarioRossi_EA',
      'PS5',
      'PSNMarioRossi'
    ]);
    
    worksheetData.push([
      'Luigi',
      'Bianchi',
      7,
      'Attacco',
      exampleRole2,
      'active',
      '',
      '',
      '',
      '',
      '',
      '',
      'PC',
      ''
    ]);
    
    // Crea worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Styling e protezioni
    this.styleExcelWorksheet(worksheet);
    
    // Aggiungi worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giocatori');
    
    // Genera e scarica file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `template_giocatori_${metadata.teamName}_${this.formatDate(new Date())}.xlsx`);
  }

  /**
   * Genera template CSV con ruoli dinamici - VERSIONE ASINCRONA
   */
  async generateCSVTemplateAsync(metadata: TemplateMetadata): Promise<void> {
    const csvContent = await this.buildCSVContentDynamic(metadata);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(blob, `template_giocatori_${metadata.teamName}_${this.formatDate(new Date())}.csv`);
  }

  /**
   * Applica styling al worksheet Excel
   */
  private styleExcelWorksheet(worksheet: XLSX.WorkSheet): void {
    // Imposta larghezza colonne
    worksheet['!cols'] = [
      { wch: 12 }, // first_name
      { wch: 12 }, // last_name
      { wch: 8 },  // jersey_number
      { wch: 12 }, // position
      { wch: 10 }, // player_role
      { wch: 8 },  // status
      { wch: 15 }, // phone
      { wch: 12 }, // birth_date
      { wch: 20 }, // email
      { wch: 12 }, // esperienza
      { wch: 20 }, // notes
      { wch: 15 }, // ea_sport_id
      { wch: 12 }, // gaming_platform
      { wch: 15 }  // platform_id
    ];

    // Proteggi le prime 6 righe (metadata e istruzioni)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: 'FFFFCC' } }, // Sfondo giallo
            font: { bold: true }
          };
        }
      }
    }

    // Evidenzia header colonne (riga 5, indice 4)
    for (let col = 0; col <= 10; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: 'CCE5FF' } }, // Sfondo blu chiaro
          font: { bold: true }
        };
      }
    }
  }

  /**
   * Formatta data per nome file
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * Valida metadati richiesti
   */
  validateMetadata(metadata: TemplateMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.teamId || metadata.teamId.length < 10) {
      errors.push('Team ID non valido');
    }

    if (!metadata.teamName || metadata.teamName.trim().length === 0) {
      errors.push('Nome team richiesto');
    }

    if (!metadata.generatedAt) {
      errors.push('Timestamp generazione richiesto');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Ottiene lista posizioni predefinite
   */
  getAvailablePositions(): string[] {
    return [
      'Portiere',
      'Difesa',
      'Centrocampo', 
      'Attacco'
    ];
  }

  /**
   * Ottiene lista status validi
   */
  getAvailableStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'active', label: 'Attivo' },
      { value: 'inactive', label: 'Inattivo' },
      { value: 'injured', label: 'Infortunato' },
      { value: 'suspended', label: 'Sospeso' }
    ];
  }
}

// Export singleton instance
export const bulkImportTemplateService = new BulkImportTemplateService();
export default bulkImportTemplateService;