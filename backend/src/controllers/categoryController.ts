import { Request, Response } from 'express';
import { z } from 'zod';
import { query, isUsingMySQL, memoryStore } from '../db/index.js';
import { Category } from '../types/index.js';

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with hyphens'),
  description: z.string().optional()
});

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    if (isUsingMySQL()) {
      const sql = `
        SELECT c.id, c.name, c.slug, c.description, c.created_at,
               COUNT(p.id) AS post_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
        GROUP BY c.id, c.name, c.slug, c.description, c.created_at
        ORDER BY c.name ASC
      `;
      const rows = await query<any>(sql);
      res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
      res.json({ success: true, data: rows });
      return;
    }

    // Fallback store
    const list = memoryStore.categories.map(c => {
      const count = memoryStore.posts.filter(p => p.category_id === c.id && p.status === 'published').length;
      return {
        ...c,
        post_count: count
      };
    });
    res.json({ success: true, data: list });
  } catch (error: any) {
    console.error('[Categories Fetch Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}

export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug || '');

  try {
    if (isUsingMySQL()) {
      const rows = await query<Category>(
        'SELECT * FROM categories WHERE slug = ?',
        [slug.toLowerCase()]
      );
      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
      res.json({ success: true, data: rows[0] });
      return;
    }

    const cat = memoryStore.categories.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.json({ success: true, data: cat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, slug, description } = req.body;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    if (isUsingMySQL()) {
      // Check existing slug
      const existing = await query('SELECT id FROM categories WHERE slug = ?', [cleanSlug]);
      if (existing.length > 0) {
        res.status(400).json({ success: false, message: 'A category with this slug already exists' });
        return;
      }

      const result: any = await query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [name, cleanSlug, description || null]
      );

      res.status(201).json({
        success: true,
        message: 'Category created',
        data: { id: result.insertId, name, slug: cleanSlug, description }
      });
      return;
    }

    const existing = memoryStore.categories.find(c => c.slug === cleanSlug);
    if (existing) {
      res.status(400).json({ success: false, message: 'A category with this slug already exists' });
      return;
    }

    const newCategory: Category = {
      id: Date.now(),
      name,
      slug: cleanSlug,
      description: description || null,
      created_at: new Date().toISOString(),
      post_count: 0
    };
    memoryStore.categories.push(newCategory);

    res.status(201).json({ success: true, message: 'Category created', data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { name, slug, description } = req.body;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    if (isUsingMySQL()) {
      // Check slug collision with other records
      const existing = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [cleanSlug, id]);
      if (existing.length > 0) {
        res.status(400).json({ success: false, message: 'Another category already uses this slug' });
        return;
      }

      await query(
        'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
        [name, cleanSlug, description || null, id]
      );

      res.json({ success: true, message: 'Category updated', data: { id, name, slug: cleanSlug, description } });
      return;
    }

    const cat = memoryStore.categories.find(c => c.id === id);
    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const collision = memoryStore.categories.find(c => c.slug === cleanSlug && c.id !== id);
    if (collision) {
      res.status(400).json({ success: false, message: 'Another category already uses this slug' });
      return;
    }

    cat.name = name;
    cat.slug = cleanSlug;
    cat.description = description || null;

    res.json({ success: true, message: 'Category updated', data: cat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    if (isUsingMySQL()) {
      await query('DELETE FROM categories WHERE id = ?', [id]);
      res.json({ success: true, message: 'Category deleted' });
      return;
    }

    const idx = memoryStore.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    memoryStore.categories.splice(idx, 1);
    // Unlink posts
    memoryStore.posts.forEach(p => {
      if (p.category_id === id) {
        p.category_id = null;
        p.category_name = 'Uncategorized';
        p.category_slug = 'uncategorized';
      }
    });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
}
