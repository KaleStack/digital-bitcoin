import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { initialCategories, initialPosts } from './seedData.js';
import { AdminUser, Category, Post } from '../types/index.js';

dotenv.config();

const { Pool, types } = pg;

// Parse PostgreSQL INT8 (BIGINT) as standard JavaScript integer
types.setTypeParser(20, (val: string) => parseInt(val, 10));
// Keep timestamp representations as ISO / SQL strings for consistent API serialization
types.setTypeParser(1114, (val: string) => val); // TIMESTAMP without timezone
types.setTypeParser(1184, (val: string) => val); // TIMESTAMP with timezone

export let pool: pg.Pool;
let isConnected = false;

// Fallback in-memory store for high-availability / offline cold start protection
class MemoryStore {
  admins: Array<{ id: number; email: string; password_hash: string; name: string; role: 'admin' | 'editor'; created_at: string }> = [];
  categories: Category[] = [];
  posts: Post[] = [];
  tags: Array<{ id: number; name: string; slug: string }> = [];
  post_tags: Array<{ post_id: number; tag_id: number }> = [];
}
export const memoryStore = new MemoryStore();

/**
 * Transforms standard parameterized SQL with ? placeholders to PostgreSQL $1, $2, $3...
 * Also converts MySQL/SQLite syntax (INSERT IGNORE / INSERT OR IGNORE) to PostgreSQL ON CONFLICT DO NOTHING
 */
export function toPostgresSql(sql: string): string {
  let paramIndex = 1;
  let inString = false;
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && (i === 0 || sql[i - 1] !== '\\')) {
      inString = !inString;
      result += char;
    } else if (char === '?' && !inString) {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }

  // Handle MySQL / SQLite syntax: INSERT IGNORE INTO -> INSERT INTO ... ON CONFLICT DO NOTHING
  if (/INSERT\s+(OR\s+)?IGNORE\s+INTO\s+/i.test(result)) {
    result = result.replace(/INSERT\s+(OR\s+)?IGNORE\s+INTO\s+/gi, 'INSERT INTO ');
    if (!/ON\s+CONFLICT/i.test(result)) {
      result = `${result} ON CONFLICT DO NOTHING`;
    }
  }

  return result;
}

/**
 * Creates PostgreSQL tables and indexes if they do not already exist
 */
async function setupSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        cover_image TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        author_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'draft',
        reading_time INTEGER DEFAULT 5,
        views INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_status_pub ON posts(status, published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_cat_status_pub ON posts(category_id, status, published_at DESC);

      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // Ensure shares column exists in legacy schemas
    try {
      await client.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;');
    } catch {}

    // Enforce HTTPS image references to prevent Mixed Content warnings
    try {
      await client.query(`
        UPDATE posts 
        SET cover_image = REPLACE(cover_image, 'http://digital-bitcoin.onrender.com', 'https://digital-bitcoin.onrender.com') 
        WHERE cover_image LIKE 'http://digital-bitcoin.onrender.com%';

        UPDATE posts 
        SET content = REPLACE(content, 'http://digital-bitcoin.onrender.com', 'https://digital-bitcoin.onrender.com') 
        WHERE content LIKE '%http://digital-bitcoin.onrender.com%';

        UPDATE posts 
        SET cover_image = REPLACE(cover_image, 'http://digitalbit.co.in', 'https://digitalbit.co.in') 
        WHERE cover_image LIKE 'http://digitalbit.co.in%';

        UPDATE posts 
        SET content = REPLACE(content, 'http://digitalbit.co.in', 'https://digitalbit.co.in') 
        WHERE content LIKE '%http://digitalbit.co.in%';
      `);
    } catch {}

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Synchronizes seed data (admin user, categories, initial educational posts) into PostgreSQL
 */
async function syncSeedData(): Promise<void> {
  const client = await pool.connect();
  try {
    const defaultPasswordHash = bcrypt.hashSync('Admin123!', 10);

    // 1. Ensure default Admin exists
    const adminCheck = await client.query('SELECT id FROM admins WHERE email = $1', ['admin@cryptoedu.io']);
    let authorId: number;
    if (adminCheck.rows.length === 0) {
      const adminRes = await client.query(
        'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['admin@cryptoedu.io', defaultPasswordHash, 'Satoshi Admin', 'admin']
      );
      authorId = adminRes.rows[0].id;
    } else {
      authorId = adminCheck.rows[0].id;
    }

    // 2. Sync Categories (insert or update on slug conflict)
    for (const cat of initialCategories) {
      await client.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description`,
        [cat.name, cat.slug, cat.description]
      );
    }

    const catRows = await client.query('SELECT id, slug FROM categories');
    const categoryMap = new Map<string, number>();
    for (const c of catRows.rows) {
      categoryMap.set(c.slug, c.id);
    }

    // 3. Seed Posts if table is empty
    const postCountRes = await client.query('SELECT COUNT(*) as count FROM posts');
    const existingPostCount = Number(postCountRes.rows[0]?.count || 0);

    if (existingPostCount === 0) {
      console.log('[DB] Seeding initial cryptocurrency education posts into PostgreSQL...');
      for (const p of initialPosts) {
        const catSlug = initialCategories.find(c => c.id === p.category_id)?.slug;
        const targetCatId = catSlug ? categoryMap.get(catSlug) || 1 : 1;
        const dateStr = p.published_at || new Date().toISOString();

        const postRes = await client.query(
          `INSERT INTO posts (
            title, slug, excerpt, content, cover_image, category_id, author_id,
            status, reading_time, views, shares, published_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (slug) DO NOTHING
          RETURNING id`,
          [
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
          ]
        );

        const newPostId = postRes.rows[0]?.id;
        if (newPostId && p.tags && Array.isArray(p.tags)) {
          for (const tagName of p.tags) {
            const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const tagRes = await client.query(
              `INSERT INTO tags (name, slug)
               VALUES ($1, $2)
               ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [tagName, tagSlug]
            );
            const tagId = tagRes.rows[0]?.id;
            if (tagId) {
              await client.query(
                'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [newPostId, tagId]
              );
            }
          }
        }
      }
    }

    // 4. Synchronize auto-increment sequence counters to prevent collision on new inserts
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1))`);
      await client.query(`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1))`);
      await client.query(`SELECT setval(pg_get_serial_sequence('admins', 'id'), COALESCE((SELECT MAX(id) FROM admins), 1))`);
      await client.query(`SELECT setval(pg_get_serial_sequence('tags', 'id'), COALESCE((SELECT MAX(id) FROM tags), 1))`);
    } catch {}

    const totalPosts = await client.query('SELECT COUNT(*) as count FROM posts');
    console.log(`[DB] PostgreSQL seed verification complete. Total posts: ${totalPosts.rows[0]?.count || 0}`);
  } finally {
    client.release();
  }
}

/**
 * Initializes PostgreSQL database connection pool and synchronizes schema
 */
export async function initDatabaseConnection(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('[DB Error] DATABASE_URL environment variable is missing.');
    console.error('Please configure DATABASE_URL=postgresql://user:password@host:5432/database');
    isConnected = false;
    return false;
  }

  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const isProduction = process.env.NODE_ENV === 'production';

  // SSL configuration: Required for Render, Supabase, Neon, AWS RDS; disabled for local development
  const ssl = (isProduction || !isLocalhost) ? { rejectUnauthorized: false } : false;

  try {
    pool = new Pool({
      connectionString,
      ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('[DB Pool Warning] Unexpected idle client error:', err.message);
    });

    // Test connectivity
    const client = await pool.connect();
    client.release();

    // Setup schema and initial data
    await setupSchema();
    await syncSeedData();

    isConnected = true;
    console.log('[DB] Connected successfully to PostgreSQL database.');
    return true;
  } catch (error: any) {
    console.error('[DB Error] Failed to connect to PostgreSQL database:', error?.message || error);
    isConnected = false;
    return false;
  }
}

export function isUsingPostgres(): boolean {
  return isConnected;
}

export function isUsingMySQL(): boolean {
  return isConnected;
}

export function isUsingSQLite(): boolean {
  return false;
}

export function getPool(): pg.Pool {
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized. Call initDatabaseConnection() first.');
  }
  return pool;
}

/**
 * Unified parameterized query execution supporting SELECT, INSERT, UPDATE, DELETE in PostgreSQL
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!pool) {
    await initDatabaseConnection();
  }

  if (!isConnected || !pool) {
    throw new Error('Database is offline. Could not execute PostgreSQL query.');
  }

  let pgSql = toPostgresSql(sql);
  const trimmed = pgSql.trim().toUpperCase();
  const isInsert = trimmed.startsWith('INSERT');
  const isUpdateOrDelete = trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE');

  // Automatically append RETURNING id for INSERT statements if not present
  if (isInsert && !/RETURNING/i.test(pgSql)) {
    pgSql = `${pgSql} RETURNING id`;
  }

  const result = await pool.query(pgSql, params);

  if (isInsert) {
    const insertId = result.rows[0]?.id ? Number(result.rows[0].id) : undefined;
    const affectedRows = result.rowCount || 0;
    const resultObj: any = { insertId, affectedRows, ...result.rows[0] };
    const resArray: any = [resultObj];
    resArray.insertId = insertId;
    resArray.affectedRows = affectedRows;
    return resArray as T[];
  }

  if (isUpdateOrDelete) {
    const affectedRows = result.rowCount || 0;
    const resultObj: any = { affectedRows };
    const resArray: any = [resultObj];
    resArray.affectedRows = affectedRows;
    return resArray as T[];
  }

  return result.rows as T[];
}
