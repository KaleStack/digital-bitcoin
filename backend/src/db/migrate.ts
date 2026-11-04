import { initDatabaseConnection, query } from './index.js';

async function runMigration() {
  console.log('[Migration] Connecting to PostgreSQL database and verifying schema...');
  const success = await initDatabaseConnection();
  if (!success) {
    console.error('[Migration Error] Could not connect to PostgreSQL. Check your DATABASE_URL.');
    process.exit(1);
  }

  const [postsCount]: any = await query('SELECT COUNT(*) as cnt FROM posts');
  const [categoriesCount]: any = await query('SELECT COUNT(*) as cnt FROM categories');
  const [adminCount]: any = await query('SELECT COUNT(*) as cnt FROM admins');

  console.log(`[Migration] PostgreSQL schema verified successfully:`);
  console.log(`- Admins:     ${adminCount?.cnt || 0}`);
  console.log(`- Categories: ${categoriesCount?.cnt || 0}`);
  console.log(`- Posts:      ${postsCount?.cnt || 0}`);
  process.exit(0);
}

runMigration();
