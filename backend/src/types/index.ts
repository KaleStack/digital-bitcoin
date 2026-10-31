export type AdminRole = 'admin' | 'editor';
export type PostStatus = 'draft' | 'published' | 'archived';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  created_at?: string;
}

export interface AdminWithPassword extends AdminUser {
  password_hash: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at?: string;
  post_count?: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_id: number | null;
  author_id: number;
  status: PostStatus;
  reading_time: number;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
  author_name?: string;
  tags?: string[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  recentPosts: Post[];
  categoriesCount: number;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
