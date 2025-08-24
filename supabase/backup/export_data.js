/**
 * BACKUP SCRIPT - Export Supabase Data to JSON
 * 
 * Questo script scarica tutti i dati importanti in file JSON locali
 * Eseguilo PRIMA della migrazione per sicurezza
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Leggi le credenziali dal file di configurazione
const SUPABASE_URL = 'https://cuthalxqxkonmfzqjdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Directory per il backup
const BACKUP_DIR = './supabase/backup/data';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function ensureBackupDir() {
  const backupPath = path.join(BACKUP_DIR, timestamp);
  await fs.mkdir(backupPath, { recursive: true });
  return backupPath;
}

async function backupTable(tableName, backupPath) {
  try {
    console.log(`📦 Backing up ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error backing up ${tableName}:`, error.message);
      return { table: tableName, status: 'error', error: error.message };
    }
    
    const fileName = path.join(backupPath, `${tableName}.json`);
    await fs.writeFile(fileName, JSON.stringify(data, null, 2));
    
    console.log(`✅ ${tableName}: ${data.length} records saved`);
    return { table: tableName, status: 'success', records: data.length };
    
  } catch (err) {
    console.error(`❌ Failed to backup ${tableName}:`, err);
    return { table: tableName, status: 'error', error: err.message };
  }
}

async function main() {
  console.log('🚀 Starting Supabase data backup...');
  console.log(`📅 Timestamp: ${timestamp}`);
  
  // Tabelle da backuppare
  const tables = [
    'players',
    'user_roles',
    'profiles',
    'training_sessions',
    'training_attendance',
    'matches',
    'match_attendance',
    'competitions',
    'trialists',
    'trial_evaluations',
    'app_settings',
    'jersey_templates',
    'custom_formations',
    'field_options',
    'avatar_backgrounds',
    'png_export_settings'
  ];
  
  try {
    // Crea directory di backup
    const backupPath = await ensureBackupDir();
    console.log(`📁 Backup directory: ${backupPath}`);
    
    // Backup di ogni tabella
    const results = [];
    for (const table of tables) {
      const result = await backupTable(table, backupPath);
      results.push(result);
    }
    
    // Salva metadata del backup
    const metadata = {
      timestamp,
      date: new Date().toISOString(),
      supabase_url: SUPABASE_URL,
      tables: results,
      total_tables: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    };
    
    await fs.writeFile(
      path.join(backupPath, '_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Report finale
    console.log('\n📊 Backup Summary:');
    console.log(`✅ Successful: ${metadata.successful}`);
    console.log(`❌ Failed: ${metadata.failed}`);
    console.log(`📁 Backup saved in: ${backupPath}`);
    
    // Crea script di restore
    await createRestoreScript(backupPath, tables);
    
  } catch (error) {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  }
}

async function createRestoreScript(backupPath, tables) {
  const restoreScript = `#!/bin/bash
# Restore script for backup ${timestamp}
# Generated automatically

echo "⚠️  WARNING: This will restore data from backup ${timestamp}"
echo "Make sure you know what you're doing!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# You'll need to implement the actual restore logic
# This is just a template

BACKUP_PATH="${backupPath}"

# For each table, you would:
# 1. Read the JSON file
# 2. Connect to Supabase
# 3. Insert the data

echo "Restore script needs to be implemented based on your needs"
echo "Data is available in: $BACKUP_PATH"
`;

  await fs.writeFile(
    path.join(backupPath, 'restore.sh'),
    restoreScript,
    { mode: 0o755 }
  );
  
  console.log(`📝 Restore script created: ${backupPath}/restore.sh`);
}

// Esegui il backup
main().catch(console.error);