import Database, { Database as BetterSqliteDatabase } from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initialCategories, initialPosts } from './seedData.js';
import { AdminUser, Category, Post } from '../types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../crypto_education.db');

export let db: BetterSqliteDatabase;
let isConnected = false;

// Fallback memory store preserved for backwards compatibility
class MemoryStore {
  admins: Array<{ id: number; email: string; password_hash: string; name: string; role: 'admin' | 'editor'; created_at: string }> = [];
  categories: Category[] = [];
  posts: Post[] = [];
  tags: Array<{ id: number; name: string; slug: string }> = [];
  post_tags: Array<{ post_id: number; tag_id: number }> = [];
}
export const memoryStore = new MemoryStore();

function setupSchemaAndSeed(): void {
  // High performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('cache_size = -64000'); // 64 MB memory cache
  db.pragma('mmap_size = 268435456'); // 256 MB memory-mapped I/O for zero-copy reads
  db.pragma('temp_store = MEMORY'); // Keep temporary tables and sorts in RAM

  // Verify database health with quick_check
  const check = db.pragma('quick_check', { simple: true });
  if (check !== 'ok') {
    throw new Error(`database disk image is malformed: quick_check returned "${check}"`);
  }

  // Create tables & indexes
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      author_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'draft',
      reading_time INTEGER DEFAULT 5,
      views INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      published_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status_pub ON posts(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_cat_status_pub ON posts(category_id, status, published_at DESC);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );
  `);

  // Ensure shares column exists in legacy databases
  try {
    db.exec('ALTER TABLE posts ADD COLUMN shares INTEGER DEFAULT 0;');
  } catch {}

  // Remove legacy dummy view/share counts so metrics start purely from real interactions
  try {
    db.exec(`
      UPDATE posts 
      SET views = 0 
      WHERE views IN (1420, 1890, 1150, 2100, 980, 430, 850, 3410, 2102, 982);

      UPDATE posts 
      SET shares = 0 
      WHERE shares IN (142, 215, 98, 310, 125, 76);
    `);
  } catch {}

  // Automatically synchronize seed data on every start
  syncSeedData();

  // Checkpoint WAL into main DB file
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch {}
}

/**
 * Initializes SQLite database with self-healing recovery if file is malformed
 */
export async function initDatabaseConnection(): Promise<boolean> {
  try {
    db = new Database(DB_PATH);
    setupSchemaAndSeed();

    isConnected = true;
    const journalMode = db.pragma('journal_mode', { simple: true });
    console.log(`[DB] Connected successfully to SQLite database at "${DB_PATH}" (journal_mode = ${journalMode})`);
    return true;
  } catch (error: any) {
    const errorMsg = String(error?.message || error);
    console.error(`[DB Error] Failed to initialize SQLite database:`, errorMsg);

    // Auto-Recovery: if database disk image is malformed, not a database, or corrupted, safely recover
    const isCorrupt =
      errorMsg.includes('malformed') ||
      errorMsg.includes('corrupt') ||
      errorMsg.includes('not a database') ||
      error?.code === 'SQLITE_CORRUPT' ||
      error?.code === 'SQLITE_NOTADB';

    if (isCorrupt) {
      console.warn(`[DB Recovery] Detected malformed database file (${errorMsg}). Auto-recovering clean database from seed...`);
      try {
        if (db) {
          try { db.close(); } catch {}
        }

        const walPath = `${DB_PATH}-wal`;
        const shmPath = `${DB_PATH}-shm`;
        if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

        db = new Database(DB_PATH);
        setupSchemaAndSeed();

        isConnected = true;
        console.log(`[DB Recovery] Successfully recovered and regenerated SQLite database at "${DB_PATH}"`);
        return true;
      } catch (recoveryErr: any) {
        console.error(`[DB Recovery Error] Could not recover SQLite database:`, recoveryErr?.message || recoveryErr);
      }
    }

    isConnected = false;
    return false;
  }
}

function syncSeedData(): void {
  try {
    const defaultPasswordHash = bcrypt.hashSync('Admin123!', 10);

    // 1. Ensure default Admin exists
    const adminCheck = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@cryptoedu.io') as { id: number } | undefined;
    let authorId = adminCheck?.id;
    if (!authorId) {
      const adminStmt = db.prepare(`
        INSERT INTO admins (email, password_hash, name, role)
        VALUES (?, ?, ?, ?)
      `);
      const adminRes = adminStmt.run('admin@cryptoedu.io', defaultPasswordHash, 'Satoshi Admin', 'admin');
      authorId = Number(adminRes.lastInsertRowid);
    }

    // 2. Sync Categories (insert or update on slug conflict)
    const catStmt = db.prepare(`
      INSERT INTO categories (name, slug, description)
      VALUES (?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        description = excluded.description
    `);
    for (const cat of initialCategories) {
      catStmt.run(cat.name, cat.slug, cat.description);
    }

    const allCategories = db.prepare('SELECT id, slug FROM categories').all() as Array<{ id: number; slug: string }>;
    const categoryMap = new Map<string, number>();
    for (const c of allCategories) {
      categoryMap.set(c.slug, c.id);
    }

    // 3. Sync Posts (insert or update on slug conflict)
    const postStmt = db.prepare(`
      INSERT INTO posts (
        title, slug, excerpt, content, cover_image, category_id, author_id,
        status, reading_time, views, shares, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        content = excluded.content,
        cover_image = excluded.cover_image,
        category_id = excluded.category_id,
        status = excluded.status,
        reading_time = excluded.reading_time,
        published_at = COALESCE(posts.published_at, excluded.published_at)
    `);

    const tagStmt = db.prepare(`
      INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)
    `);
    const getTagStmt = db.prepare('SELECT id FROM tags WHERE slug = ?');
    const postTagStmt = db.prepare(`
      INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)
    `);
    const getPostStmt = db.prepare('SELECT id FROM posts WHERE slug = ?');

    for (const p of initialPosts) {
      const catSlug = initialCategories.find(c => c.id === p.category_id)?.slug;
      const targetCatId = catSlug ? categoryMap.get(catSlug) || 1 : 1;
      const dateStr = p.published_at || new Date().toISOString();

      postStmt.run(
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.cover_image,
        targetCatId,
        authorId,
        p.status,
        p.reading_time,
        p.views || 0,
        p.shares || 0,
        dateStr,
        dateStr,
        dateStr
      );

      const postRow = getPostStmt.get(p.slug) as { id: number } | undefined;
      if (postRow?.id) {
        for (const tagName of p.tags || []) {
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          tagStmt.run(tagName, tagSlug);
          const tagRow = getTagStmt.get(tagSlug) as { id: number } | undefined;
          if (tagRow) {
            postTagStmt.run(postRow.id, tagRow.id);
          }
        }
      }
    }

    const countRes = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    console.log(`[DB] Seed synchronization completed. Total posts in SQLite: ${countRes.count}`);
  } catch (err: any) {
    console.error(`[DB Sync Error]:`, err?.message || err);
  }
}

/**
 * Returns true if database connection is active
 */
export function isUsingMySQL(): boolean {
  return isConnected;
}

export function isUsingSQLite(): boolean {
  return isConnected;
}

export function getDatabase(): BetterSqliteDatabase {
  if (!db) {
    throw new Error('SQLite database is not initialized. Call initDatabaseConnection() first.');
  }
  return db;
}

/**
 * Unified parameterized query execution supporting both SELECT and DML
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!db) {
    await initDatabaseConnection();
  }

  // Normalize MySQL syntax to SQLite
  let normalizedSql = sql.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO');

  const trimmed = normalizedSql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
    const stmt = db.prepare(normalizedSql);
    const rows = stmt.all(...params);
    return rows as T[];
  }

  // INSERT, UPDATE, DELETE
  const stmt = db.prepare(normalizedSql);
  const info = stmt.run(...params);

  const insertId = Number(info.lastInsertRowid);
  const affectedRows = info.changes;

  const resultObj: any = { insertId, affectedRows };
  const resArray: any = [resultObj];
  resArray.insertId = insertId;
  resArray.affectedRows = affectedRows;

  return resArray as T[];
}
