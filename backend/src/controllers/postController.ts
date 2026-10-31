import { Request, Response } from 'express';
import { z } from 'zod';
import { query, isUsingMySQL, memoryStore } from '../db/index.js';
import { Post, DashboardStats, PaginatedResponse } from '../types/index.js';
import { AuthRequest } from '../middleware/authGuard.js';

export const postSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content must have at least 10 characters'),
  cover_image: z.string().optional().nullable(),
  category_id: z.number().int().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  tags: z.array(z.string()).optional()
});

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getPublicPosts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 9));
  const offset = (page - 1) * limit;
  const categorySlug = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;

  try {
    if (isUsingMySQL()) {
      let whereClauses: string[] = ["p.status = 'published'"];
      let queryParams: any[] = [];

      if (categorySlug && categorySlug !== 'all') {
        whereClauses.push('c.slug = ?');
        queryParams.push(categorySlug);
      }

      if (search && search.trim() !== '') {
        whereClauses.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)');
        const searchPattern = `%${search.trim()}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countSql = `
        SELECT COUNT(p.id) as total
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereSql}
      `;
      const [countResult]: any = await query(countSql, queryParams);
      const total = Number(countResult?.total || 0);

      // Data query
      const dataSql = `
        SELECT 
          p.id, p.title, p.slug, p.excerpt, p.cover_image, p.category_id,
          p.author_id, p.status, p.reading_time, p.views, p.published_at,
          p.created_at, p.updated_at,
          c.name AS category_name, c.slug AS category_slug,
          a.name AS author_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN admins a ON p.author_id = a.id
        ${whereSql}
        ORDER BY p.published_at DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const dataParams = [...queryParams, limit, offset];
      const rows = await query<Post>(dataSql, dataParams);

      const response: PaginatedResponse<Post> = {
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      res.json({ success: true, ...response });
      return;
    }

    // Memory Store
    let filtered = memoryStore.posts.filter(p => p.status === 'published');

    if (categorySlug && categorySlug !== 'all') {
      filtered = filtered.filter(p => p.category_slug === categorySlug);
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q)
      );
    }

    // Sort descending by date
    filtered.sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('[Public Posts Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
}

export async function getPostBySlug(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug || '');

  try {
    if (isUsingMySQL()) {
      // 1. Fetch post
      const rows = await query<Post>(
        `SELECT 
          p.*,
          c.name AS category_name, c.slug AS category_slug,
          a.name AS author_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN admins a ON p.author_id = a.id
        WHERE p.slug = ?`,
        [slug]
      );

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const post = rows[0];

      // 2. Increment views asynchronously
      await query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
      post.views = (post.views || 0) + 1;

      // 3. Fetch tags
      const tagRows = await query<any>(
        `SELECT t.name FROM tags t 
         INNER JOIN post_tags pt ON pt.tag_id = t.id 
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tagRows.map(t => t.name);

      // 4. Related posts
      let related: Post[] = [];
      if (post.category_id) {
        related = await query<Post>(
          `SELECT id, title, slug, excerpt, cover_image, reading_time, published_at
           FROM posts
           WHERE category_id = ? AND id != ? AND status = 'published'
           ORDER BY published_at DESC LIMIT 3`,
          [post.category_id, post.id]
        );
      }

      res.json({ success: true, data: post, related });
      return;
    }

    // Memory Store
    const post = memoryStore.posts.find(p => p.slug === slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Increment views
    post.views = (post.views || 0) + 1;

    const related = memoryStore.posts
      .filter(p => p.category_id === post.category_id && p.id !== post.id && p.status === 'published')
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        cover_image: p.cover_image,
        reading_time: p.reading_time,
        published_at: p.published_at
      } as Post));

    res.json({ success: true, data: post, related });
  } catch (error) {
    console.error('[Post By Slug Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
}

export async function getAdminPosts(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
  const search = req.query.search as string | undefined;

  try {
    if (isUsingMySQL()) {
      let whereClauses: string[] = ['1=1'];
      let params: any[] = [];

      if (status && status !== 'all') {
        whereClauses.push('p.status = ?');
        params.push(status);
      }

      if (categoryId) {
        whereClauses.push('p.category_id = ?');
        params.push(categoryId);
      }

      if (search && search.trim() !== '') {
        whereClauses.push('(p.title LIKE ? OR p.slug LIKE ?)');
        params.push(`%${search.trim()}%`, `%${search.trim()}%`);
      }

      const sql = `
        SELECT 
          p.id, p.title, p.slug, p.excerpt, p.cover_image, p.category_id,
          p.author_id, p.status, p.reading_time, p.views, p.published_at,
          p.created_at, p.updated_at,
          c.name AS category_name, c.slug AS category_slug,
          a.name AS author_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN admins a ON p.author_id = a.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY p.updated_at DESC, p.id DESC
      `;

      const rows = await query<Post>(sql, params);
      res.json({ success: true, data: rows });
      return;
    }

    // Memory Store
    let list = [...memoryStore.posts];
    if (status && status !== 'all') {
      list = list.filter(p => p.status === status);
    }
    if (categoryId) {
      list = list.filter(p => p.category_id === categoryId);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    list.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin posts' });
  }
}

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    if (isUsingMySQL()) {
      const [counts]: any = await query(`
        SELECT 
          COUNT(*) as totalPosts,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedPosts,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftPosts,
          COALESCE(SUM(views), 0) as totalViews
        FROM posts
      `);

      const [catCount]: any = await query('SELECT COUNT(*) as count FROM categories');
      const recentPosts = await query<Post>(`
        SELECT p.id, p.title, p.slug, p.status, p.views, p.created_at, c.name as category_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC LIMIT 5
      `);

      const stats: DashboardStats = {
        totalPosts: Number(counts?.totalPosts || 0),
        publishedPosts: Number(counts?.publishedPosts || 0),
        draftPosts: Number(counts?.draftPosts || 0),
        totalViews: Number(counts?.totalViews || 0),
        categoriesCount: Number(catCount?.count || 0),
        recentPosts
      };

      res.json({ success: true, data: stats });
      return;
    }

    // Memory Store
    const totalPosts = memoryStore.posts.length;
    const publishedPosts = memoryStore.posts.filter(p => p.status === 'published').length;
    const draftPosts = memoryStore.posts.filter(p => p.status === 'draft').length;
    const totalViews = memoryStore.posts.reduce((acc, p) => acc + (p.views || 0), 0);
    const recentPosts = [...memoryStore.posts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const stats: DashboardStats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      categoriesCount: memoryStore.categories.length,
      recentPosts
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
}

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  const { title, slug, excerpt, content, cover_image, category_id, status, tags } = req.body;
  const authorId = req.user?.id || 1;

  const generatedSlug = slug ? slugify(slug) : slugify(title);
  const readingTime = calculateReadingTime(content);
  const publishedAt = status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

  try {
    if (isUsingMySQL()) {
      // Check slug uniqueness
      let finalSlug = generatedSlug;
      let suffix = 1;
      while (true) {
        const existing = await query('SELECT id FROM posts WHERE slug = ?', [finalSlug]);
        if (existing.length === 0) break;
        finalSlug = `${generatedSlug}-${suffix++}`;
      }

      const result: any = await query(
        `INSERT INTO posts 
         (title, slug, excerpt, content, cover_image, category_id, author_id, status, reading_time, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          finalSlug,
          excerpt || null,
          content,
          cover_image || null,
          category_id || null,
          authorId,
          status,
          readingTime,
          publishedAt
        ]
      );

      const postId = result.insertId;

      // Handle tags
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          const tagSlug = slugify(tagName);
          const existingTags: any = await query('SELECT id FROM tags WHERE slug = ?', [tagSlug]);
          let tagId: number;
          if (existingTags.length === 0) {
            const tagRes: any = await query('INSERT INTO tags (name, slug) VALUES (?, ?)', [tagName, tagSlug]);
            tagId = tagRes.insertId;
          } else {
            tagId = existingTags[0].id;
          }
          await query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { id: postId, slug: finalSlug }
      });
      return;
    }

    // Memory Store
    let finalSlug = generatedSlug;
    let suffix = 1;
    while (memoryStore.posts.some(p => p.slug === finalSlug)) {
      finalSlug = `${generatedSlug}-${suffix++}`;
    }

    const category = memoryStore.categories.find(c => c.id === category_id);

    const newPost: Post = {
      id: Date.now(),
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      cover_image: cover_image || null,
      category_id: category_id || null,
      author_id: authorId,
      status: status || 'draft',
      reading_time: readingTime,
      views: 0,
      published_at: publishedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_name: category?.name || 'General',
      category_slug: category?.slug || 'general',
      author_name: req.user?.name || 'Admin',
      tags: tags || []
    };

    memoryStore.posts.unshift(newPost);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('[Create Post Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { title, slug, excerpt, content, cover_image, category_id, status, tags } = req.body;

  try {
    const readingTime = content ? calculateReadingTime(content) : undefined;

    if (isUsingMySQL()) {
      const existingRows = await query<Post>('SELECT * FROM posts WHERE id = ?', [id]);
      if (existingRows.length === 0) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }
      const existing = existingRows[0];

      let targetSlug = existing.slug;
      if (slug && slug !== existing.slug) {
        targetSlug = slugify(slug);
        const slugCheck = await query('SELECT id FROM posts WHERE slug = ? AND id != ?', [targetSlug, id]);
        if (slugCheck.length > 0) {
          res.status(400).json({ success: false, message: 'A post with this slug already exists' });
          return;
        }
      }

      let publishedAt = existing.published_at;
      if (status === 'published' && !existing.published_at) {
        publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      await query(
        `UPDATE posts SET 
          title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?, 
          category_id = ?, status = ?, reading_time = ?, published_at = ?
         WHERE id = ?`,
        [
          title || existing.title,
          targetSlug,
          excerpt !== undefined ? excerpt : existing.excerpt,
          content || existing.content,
          cover_image !== undefined ? cover_image : existing.cover_image,
          category_id !== undefined ? category_id : existing.category_id,
          status || existing.status,
          readingTime || existing.reading_time,
          publishedAt,
          id
        ]
      );

      res.json({ success: true, message: 'Post updated successfully' });
      return;
    }

    // Memory Store
    const post = memoryStore.posts.find(p => p.id === id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (title) post.title = title;
    if (slug) post.slug = slugify(slug);
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content) {
      post.content = content;
      post.reading_time = calculateReadingTime(content);
    }
    if (cover_image !== undefined) post.cover_image = cover_image;
    if (category_id !== undefined) {
      post.category_id = category_id;
      const cat = memoryStore.categories.find(c => c.id === category_id);
      post.category_name = cat?.name || 'General';
      post.category_slug = cat?.slug || 'general';
    }
    if (status) {
      if (status === 'published' && !post.published_at) {
        post.published_at = new Date().toISOString();
      }
      post.status = status;
    }
    if (tags) post.tags = tags;
    post.updated_at = new Date().toISOString();

    res.json({ success: true, message: 'Post updated successfully', data: post });
  } catch (error) {
    console.error('[Update Post Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    if (isUsingMySQL()) {
      await query('DELETE FROM posts WHERE id = ?', [id]);
      res.json({ success: true, message: 'Post deleted successfully' });
      return;
    }

    const idx = memoryStore.posts.findIndex(p => p.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    memoryStore.posts.splice(idx, 1);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
}
