import Database, { Database as BetterSqliteDatabase } from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
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

/**
 * Initializes SQLite database with high-performance WAL mode
 */
export async function initDatabaseConnection(): Promise<boolean> {
  try {
    db = new Database(DB_PATH);

    // High performance pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = -64000'); // 64 MB memory cache

    // Create tables
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
        published_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

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

    // Seed initial data if admins table is empty
    const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
    if (adminCheck.count === 0) {
      seedDatabase();
    }

    isConnected = true;
    const journalMode = db.pragma('journal_mode', { simple: true });
    console.log(`[DB] Connected successfully to SQLite database at "${DB_PATH}" (journal_mode = ${journalMode})`);
    return true;
  } catch (error: any) {
    console.error(`[DB Error] Failed to initialize SQLite database:`, error?.message || error);
    isConnected = false;
    return false;
  }
}

function seedDatabase(): void {
  console.log('[DB] Seeding SQLite database with initial admin and content...');
  const defaultPasswordHash = bcrypt.hashSync('Admin123!', 10);

  // 1. Admin
  const adminStmt = db.prepare(`
    INSERT INTO admins (email, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `);
  const adminRes = adminStmt.run('admin@cryptoedu.io', defaultPasswordHash, 'Satoshi Admin', 'admin');
  const authorId = Number(adminRes.lastInsertRowid);

  // 2. Categories
  const catStmt = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, description)
    VALUES (?, ?, ?)
  `);
  for (const cat of initialCategories) {
    catStmt.run(cat.name, cat.slug, cat.description);
  }

  const allCategories = db.prepare('SELECT id, slug FROM categories').all() as Array<{ id: number; slug: string }>;
  const categoryMap = new Map<string, number>();
  for (const c of allCategories) {
    categoryMap.set(c.slug, c.id);
  }

  // 3. Posts & Tags
  const postStmt = db.prepare(`
    INSERT OR IGNORE INTO posts (
      title, slug, excerpt, content, cover_image, category_id, author_id,
      status, reading_time, views, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tagStmt = db.prepare(`
    INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)
  `);
  const getTagStmt = db.prepare('SELECT id FROM tags WHERE slug = ?');
  const postTagStmt = db.prepare(`
    INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)
  `);

  for (const p of initialPosts) {
    const catSlug = initialCategories.find(c => c.id === p.category_id)?.slug;
    const targetCatId = catSlug ? categoryMap.get(catSlug) || 1 : 1;
    const dateStr = p.published_at || new Date().toISOString();

    const postRes = postStmt.run(
      p.title,
      p.slug,
      p.excerpt,
      p.content,
      p.cover_image,
      targetCatId,
      authorId,
      p.status,
      p.reading_time,
      p.views,
      dateStr,
      dateStr,
      dateStr
    );

    const postId = Number(postRes.lastInsertRowid);
    if (postId) {
      for (const tagName of p.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        tagStmt.run(tagName, tagSlug);
        const tagRow = getTagStmt.get(tagSlug) as { id: number } | undefined;
        if (tagRow) {
          postTagStmt.run(postId, tagRow.id);
        }
      }
    }
  }

  console.log('[DB] Seeding completed successfully.');
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
