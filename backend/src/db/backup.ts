import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabaseConnection, query } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

async function createBackup() {
  console.log('[Backup] Connecting to PostgreSQL database for backup snapshot...');
  const success = await initDatabaseConnection();
  if (!success) {
    console.error('[Backup Error] Could not connect to PostgreSQL. Check your DATABASE_URL.');
    process.exit(1);
  }

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:T]/g, '-').split('.')[0];
  const jsonBackupFile = path.join(BACKUPS_DIR, `crypto_education_backup_${timestamp}.json`);
  const sqlBackupFile = path.join(BACKUPS_DIR, `crypto_education_backup_${timestamp}.sql`);

  try {
    const admins = await query('SELECT id, email, password_hash, name, role, created_at FROM admins ORDER BY id ASC');
    const categories = await query('SELECT id, name, slug, description, created_at FROM categories ORDER BY id ASC');
    const posts = await query('SELECT id, title, slug, excerpt, content, cover_image, category_id, author_id, status, reading_time, views, shares, published_at, created_at, updated_at FROM posts ORDER BY id ASC');
    const tags = await query('SELECT id, name, slug FROM tags ORDER BY id ASC');
    const postTags = await query('SELECT post_id, tag_id FROM post_tags ORDER BY post_id, tag_id ASC');

    const backupData = {
      timestamp: now.toISOString(),
      version: '1.0.0',
      database: 'PostgreSQL',
      counts: {
        admins: admins.length,
        categories: categories.length,
        posts: posts.length,
        tags: tags.length,
        postTags: postTags.length
      },
      data: {
        admins,
        categories,
        posts,
        tags,
        postTags
      }
    };

    // 1. Write JSON snapshot
    fs.writeFileSync(jsonBackupFile, JSON.stringify(backupData, null, 2), 'utf-8');

    // 2. Write SQL Restore script
    let sqlContent = `-- Crypto Education PostgreSQL Backup: ${now.toISOString()}\n\n`;
    sqlContent += `BEGIN;\n\n`;

    for (const c of categories) {
      sqlContent += `INSERT INTO categories (id, name, slug, description, created_at) VALUES (${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${escapeSql(c.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
    }

    for (const a of admins) {
      sqlContent += `INSERT INTO admins (id, email, password_hash, name, role, created_at) VALUES (${a.id}, ${escapeSql(a.email)}, ${escapeSql(a.password_hash)}, ${escapeSql(a.name)}, ${escapeSql(a.role)}, ${escapeSql(a.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
    }

    for (const p of posts) {
      sqlContent += `INSERT INTO posts (id, title, slug, excerpt, content, cover_image, category_id, author_id, status, reading_time, views, shares, published_at, created_at, updated_at) VALUES (${p.id}, ${escapeSql(p.title)}, ${escapeSql(p.slug)}, ${escapeSql(p.excerpt)}, ${escapeSql(p.content)}, ${escapeSql(p.cover_image)}, ${p.category_id || 'NULL'}, ${p.author_id}, ${escapeSql(p.status)}, ${p.reading_time || 5}, ${p.views || 0}, ${p.shares || 0}, ${escapeSql(p.published_at)}, ${escapeSql(p.created_at)}, ${escapeSql(p.updated_at)}) ON CONFLICT (id) DO NOTHING;\n`;
    }

    for (const t of tags) {
      sqlContent += `INSERT INTO tags (id, name, slug) VALUES (${t.id}, ${escapeSql(t.name)}, ${escapeSql(t.slug)}) ON CONFLICT (id) DO NOTHING;\n`;
    }

    for (const pt of postTags) {
      sqlContent += `INSERT INTO post_tags (post_id, tag_id) VALUES (${pt.post_id}, ${pt.tag_id}) ON CONFLICT DO NOTHING;\n`;
    }

    sqlContent += `\n-- Reset sequence counters\n`;
    sqlContent += `SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1));\n`;
    sqlContent += `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1));\n`;
    sqlContent += `SELECT setval(pg_get_serial_sequence('admins', 'id'), COALESCE((SELECT MAX(id) FROM admins), 1));\n`;
    sqlContent += `SELECT setval(pg_get_serial_sequence('tags', 'id'), COALESCE((SELECT MAX(id) FROM tags), 1));\n`;
    sqlContent += `\nCOMMIT;\n`;

    fs.writeFileSync(sqlBackupFile, sqlContent, 'utf-8');

    const jsonStats = fs.statSync(jsonBackupFile);

    console.log('\n========================================');
    console.log('✅ POSTGRESQL BACKUP CREATED SUCCESSFULLY');
    console.log('========================================');
    console.log(`JSON Backup: ${jsonBackupFile} (${(jsonStats.size / 1024).toFixed(2)} KB)`);
    console.log(`SQL Backup:  ${sqlBackupFile}`);
    console.log(`Posts:       ${posts.length}`);
    console.log(`Categories:  ${categories.length}`);
    console.log(`Admins:      ${admins.length}`);
    console.log('========================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('[Backup Error] Failed to export PostgreSQL data:', err?.message || err);
    process.exit(1);
  }
}

function escapeSql(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

createBackup();
