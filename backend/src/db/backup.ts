import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../crypto_education.db');
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

async function createBackup() {
  console.log(`[Backup] Source database: ${DB_PATH}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error(`[Backup Error] Database file not found at: ${DB_PATH}`);
    process.exit(1);
  }

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // Generate ISO-friendly timestamp for filename: YYYY-MM-DD_HH-mm-ss
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:T]/g, '-').split('.')[0];
  const backupFileName = `crypto_education_backup_${timestamp}.db`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  const db = new Database(DB_PATH);

  try {
    // 1. Flush any pending WAL writes to the main database file
    db.pragma('wal_checkpoint(TRUNCATE)');

    // 2. Perform online SQLite backup (consistent snapshot)
    console.log(`[Backup] Creating snapshot to: ${backupFilePath}...`);
    await db.backup(backupFilePath);

    // 3. Verify backup health & stats
    const stats = fs.statSync(backupFilePath);
    const backupDb = new Database(backupFilePath, { readonly: true });
    
    const postCount = (backupDb.prepare('SELECT count(*) as count FROM posts').get() as { count: number }).count;
    const catCount = (backupDb.prepare('SELECT count(*) as count FROM categories').get() as { count: number }).count;
    const adminCount = (backupDb.prepare('SELECT count(*) as count FROM admins').get() as { count: number }).count;
    backupDb.close();

    console.log('\n========================================');
    console.log('✅ DATABASE BACKUP CREATED SUCCESSFULLY');
    console.log('========================================');
    console.log(`File:       ${backupFilePath}`);
    console.log(`Size:       ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`Posts:      ${postCount}`);
    console.log(`Categories: ${catCount}`);
    console.log(`Admins:     ${adminCount}`);
    console.log('========================================\n');
  } catch (err: any) {
    console.error(`[Backup Error] Failed to create backup:`, err);
    process.exit(1);
  } finally {
    db.close();
  }
}

createBackup();
