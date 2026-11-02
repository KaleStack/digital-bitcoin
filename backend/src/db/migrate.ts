import { initDatabaseConnection, getDatabase } from './index.js';

async function runMigration() {
  console.log('[Migration] Running SQLite migration...');
  await initDatabaseConnection();
  const db = getDatabase();
  const journalMode = db.pragma('journal_mode', { simple: true });
  console.log(`[Migration] SQLite tables verified. Journal mode: ${journalMode}`);
  process.exit(0);
}

runMigration();
