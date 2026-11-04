import { initDatabaseConnection, query } from './index.js';

async function runSeed() {
  console.log('[Seed] Connecting to PostgreSQL database and verifying seeds...');
  const success = await initDatabaseConnection();
  if (!success) {
    console.error('[Seed Error] Could not connect to PostgreSQL. Check your DATABASE_URL.');
    process.exit(1);
  }

  const [postsCount]: any = await query('SELECT COUNT(*) as cnt FROM posts');
  const [categoriesCount]: any = await query('SELECT COUNT(*) as cnt FROM categories');
  const [adminCount]: any = await query('SELECT COUNT(*) as cnt FROM admins');

  console.log(`[Seed] PostgreSQL Seed State: ${adminCount?.cnt || 0} admins, ${categoriesCount?.cnt || 0} categories, ${postsCount?.cnt || 0} posts.`);
  process.exit(0);
}

runSeed();
