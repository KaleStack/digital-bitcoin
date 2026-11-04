import { initDatabaseConnection, getDatabase } from './index.js';

async function runSeed() {
  console.log('[Seed] Verifying SQLite database seed...');
  await initDatabaseConnection();
  const db = getDatabase();
  const postsCount = db.prepare('SELECT COUNT(*) as cnt FROM posts').get() as { cnt: number };
  const categoriesCount = db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as { cnt: number };
  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admins').get() as { cnt: number };

  console.log(`[Seed] Database state: ${adminCount.cnt} admins, ${categoriesCount.cnt} categories, ${postsCount.cnt} posts.`);
  process.exit(0);
}

runSeed();
