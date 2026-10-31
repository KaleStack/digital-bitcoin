import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'crypto_education'
} = process.env;

async function runMigration() {
  console.log(`[Migration] Starting MySQL database migration for "${DB_NAME}"...`);

  let rootConnection: mysql.Connection | null = null;
  try {
    // 1. Connect without DB selected to ensure database exists
    rootConnection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[Migration] Database "${DB_NAME}" verified / created.`);
    await rootConnection.end();

    // 2. Connect to the specific database
    const dbConnection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });

    console.log(`[Migration] Executing schema DDL statements...`);

    // Admins table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'editor') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Categories table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Posts table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        content LONGTEXT NOT NULL,
        cover_image VARCHAR(500),
        category_id INT,
        author_id INT NOT NULL,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        reading_time INT DEFAULT 5,
        views INT DEFAULT 0,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_slug (slug),
        INDEX idx_category (category_id),
        INDEX idx_author (author_id),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Tags table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL
      ) ENGINE=InnoDB;
    `);

    // Post Tags pivot table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log(`[Migration] All tables successfully created!`);
    await dbConnection.end();
    process.exit(0);
  } catch (err: any) {
    console.error(`[Migration Error]:`, err?.message || err);
    console.info(`\nTroubleshooting:`);
    console.info(`1. Make sure your local MySQL service is running on ${DB_HOST}:${DB_PORT}`);
    console.info(`2. Verify DB_USER and DB_PASSWORD in backend/.env`);
    console.info(`3. Alternatively, the app includes an automatic fallback memory store for instant preview.`);
    process.exit(1);
  }
}

runMigration();
