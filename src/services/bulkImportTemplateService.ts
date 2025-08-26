import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
}

class BulkImportTemplateService {
  private readonly TEMPLATE_VERSION = 'v1.0';
  private readonly MAX_PLAYERS = 30;

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
    
    // Riga 5: Header colonne
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
      'notes'
    ]);
    
    // Riga 6-7: Esempi
    worksheetData.push([
      'Mario',
      'Rossi',
      10,
      'Centrocampo',
      'CAM',
      'active',
      '+39123456789',
      '1995-03-15',
      'mario.rossi@email.com',
      'Professionale',
      'Capitano squadra'
    ]);
    
    worksheetData.push([
      'Luigi',
      'Bianchi',
      7,
      'Attacco',
      'CF',
      'active',
      '',
      '',
      '',
      '',
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
    
    // Header
    lines.push('first_name*,last_name*,jersey_number*,position,player_role,status*,phone,birth_date,email,esperienza,notes');
    
    // Esempi
    lines.push('Mario,Rossi,10,Centrocampo,CAM,active,+39123456789,1995-03-15,mario.rossi@email.com,Professionale,"Capitano squadra"');
    lines.push('Luigi,Bianchi,7,Attacco,CF,active,,,,,');
    
    return lines.join('\n');
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
      { wch: 20 }  // notes
    ];

    // Proteggi le prime 3 righe (metadata)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 0; row < 3; row++) {
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