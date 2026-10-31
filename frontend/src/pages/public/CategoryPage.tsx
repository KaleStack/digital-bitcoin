import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { api } from '../../lib/api';
import { Category, Post } from '../../types';
import { PostGrid } from '../../components/posts/PostGrid';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (slug) {
          const [catRes, postsRes] = await Promise.all([
            api.get(`/categories/${slug}`),
            api.get(`/posts?category=${slug}`)
          ]);

          if (catRes.data.success) {
            setCategory(catRes.data.data);
          }
          if (postsRes.data.success) {
            setPosts(postsRes.data.data);
          }
        } else {
          const res = await api.get('/categories');
          if (res.data.success) {
            setCategories(res.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to load category view', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // If viewing all categories index
  if (!slug) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Curriculum Structure</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">All Knowledge Domains</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse our structured tracks spanning cryptographic theory, smart contract security, and decentralized infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 card-hover-effect hover:border-blue-400 dark:hover:border-cyan-500/40 group flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {cat.description || 'Comprehensive learning modules and verified guides on this topic.'}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{cat.post_count || 0} published guides</span>
                <span className="text-blue-600 dark:text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore domain <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <Link
        to="/categories"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Categories
      </Link>

      {/* Category Header */}
      <div className="p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900/50 dark:to-slate-950/80 space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-cyan-950/70 border border-blue-200 dark:border-cyan-800 text-blue-700 dark:text-cyan-300 text-xs font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>Curriculum Domain</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          {category?.name || slug}
        </h1>
        {category?.description && (
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
          Showing {posts.length} verified educational guides
        </div>
      </div>

      {/* Posts in Category */}
      <PostGrid posts={posts} isLoading={isLoading} emptyMessage="No published articles in this category yet." />
    </div>
  );
}
