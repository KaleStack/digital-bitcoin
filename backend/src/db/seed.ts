import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { initialCategories, initialPosts } from './seedData.js';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'crypto_education'
} = process.env;

async function runSeed() {
  console.log(`[Seed] Connecting to MySQL database "${DB_NAME}" on ${DB_HOST}:${DB_PORT}...`);

  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log(`[Seed] Connected. Seeding initial data...`);

    // 1. Seed Admin
    const adminEmail = 'admin@cryptoedu.io';
    const [existingAdmins]: any = await connection.execute(
      'SELECT id FROM admins WHERE email = ?',
      [adminEmail]
    );

    let authorId = 1;
    if (existingAdmins.length === 0) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const [result]: any = await connection.execute(
        'INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [adminEmail, passwordHash, 'Satoshi Admin', 'admin']
      );
      authorId = result.insertId;
      console.log(`[Seed] Created admin account: ${adminEmail} (password: Admin123!) [ID: ${authorId}]`);
    } else {
      authorId = existingAdmins[0].id;
      console.log(`[Seed] Admin user already exists (ID: ${authorId}).`);
    }

    // 2. Seed Categories
    for (const cat of initialCategories) {
      const [existing]: any = await connection.execute(
        'SELECT id FROM categories WHERE slug = ?',
        [cat.slug]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
          [cat.name, cat.slug, cat.description]
        );
        console.log(`[Seed] Inserted category: ${cat.name}`);
      }
    }

    // Map categories by slug for ID lookup
    const [allCategories]: any = await connection.execute('SELECT id, slug FROM categories');
    const categoryMap = new Map<string, number>();
    for (const c of allCategories) {
      categoryMap.set(c.slug, c.id);
    }

    // 3. Seed Posts
    for (const p of initialPosts) {
      const [existing]: any = await connection.execute(
        'SELECT id FROM posts WHERE slug = ?',
        [p.slug]
      );

      const catSlug = initialCategories.find(c => c.id === p.category_id)?.slug;
      const targetCatId = catSlug ? categoryMap.get(catSlug) || 1 : 1;

      if (existing.length === 0) {
        const [postRes]: any = await connection.execute(
          `INSERT INTO posts 
          (title, slug, excerpt, content, cover_image, category_id, author_id, status, reading_time, views, published_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            p.views,
            p.published_at ? new Date(p.published_at) : null
          ]
        );
        const postId = postRes.insertId;
        console.log(`[Seed] Inserted post [ID: ${postId}]: "${p.title}"`);

        // Seed Tags
        for (const tagName of p.tags) {
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          let tagId: number;

          const [existingTag]: any = await connection.execute(
            'SELECT id FROM tags WHERE slug = ?',
            [tagSlug]
          );

          if (existingTag.length === 0) {
            const [tagRes]: any = await connection.execute(
              'INSERT INTO tags (name, slug) VALUES (?, ?)',
              [tagName, tagSlug]
            );
            tagId = tagRes.insertId;
          } else {
            tagId = existingTag[0].id;
          }

          await connection.execute(
            'INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [postId, tagId]
          );
        }
      }
    }

    console.log(`[Seed] Seed process completed successfully!`);
    await connection.end();
    process.exit(0);
  } catch (err: any) {
    console.error(`[Seed Error]:`, err?.message || err);
    process.exit(1);
  }
}

runSeed();
