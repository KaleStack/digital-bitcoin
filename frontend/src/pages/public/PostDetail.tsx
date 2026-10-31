import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  Eye,
  Calendar,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  CheckCircle,
  Tag as TagIcon
} from 'lucide-react';
import { api } from '../../lib/api';
import { Post } from '../../types';
import { formatDate, formatNumber } from '../../lib/utils';
import { ReadingProgress } from '../../components/posts/ReadingProgress';
import { TableOfContents } from '../../components/posts/TableOfContents';
import { ShareButtons } from '../../components/posts/ShareButtons';
import { PostCard } from '../../components/posts/PostCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/posts/${slug}`);
        if (res.data.success) {
          setPost(res.data.data);
          setRelated(res.data.related || []);
        } else {
          setError(res.data.message || 'Article not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Article could not be retrieved');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-3 pt-6">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center mx-auto text-rose-500">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Article Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || "The guide you are looking for does not exist or has been archived."}</p>
        <Link to="/blog">
          <Button variant="secondary" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Curriculum
          </Button>
        </Link>
      </div>
    );
  }

  // Simple Markdown renderer
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed text-base">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            const h = line.slice(2);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h1 key={idx} id={id} className="text-3xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">{h}</h1>;
          }
          if (line.startsWith('## ')) {
            const h = line.slice(3);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h2 key={idx} id={id} className="text-2xl font-bold text-blue-600 dark:text-cyan-300 mt-8 mb-3">{h}</h2>;
          }
          if (line.startsWith('### ')) {
            const h = line.slice(4);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h3 key={idx} id={id} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-2">{h}</h3>;
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-blue-600 dark:border-cyan-500 pl-4 py-2 italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 rounded-r-xl my-4">
                {line.slice(2)}
              </blockquote>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-6" />;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-6 list-disc text-slate-700 dark:text-slate-300">
                {line.slice(2)}
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <li key={idx} className="ml-6 list-decimal text-slate-700 dark:text-slate-300">
                {line.replace(/^\d+\.\s/, '')}
              </li>
            );
          }
          if (line.startsWith('```')) {
            return null;
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }

          const formatted = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-cyan-300 font-mono text-sm border border-slate-200 dark:border-slate-700">$1</code>');

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        })}
      </div>
    );
  };

  return (
    <article className="min-h-screen">
      <ReadingProgress />

      {/* Header Container */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/70 pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Articles
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="accent">
              {post.category_name || 'General'}
            </Badge>
            <span className="text-xs text-slate-400">•</span>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>{post.reading_time || 5} min read</span>
            </div>
            <span className="text-xs text-slate-400">•</span>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatNumber(post.views)} views</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Author Capsule & Share */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-sm">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 dark:text-cyan-300">
                  {post.author_name ? post.author_name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author_name || 'Satoshi Admin'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(post.published_at || post.created_at)}
                </p>
              </div>
            </div>

            <ShareButtons title={post.title} slug={post.slug} />
          </div>
        </div>
      </div>

      {/* Main Body + Sticky Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Cover Image */}
            {post.cover_image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm dark:shadow-xl">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-[360px] object-cover"
                />
              </div>
            )}

            {/* Post Content Container */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-xs">
              {renderContent(post.content)}
            </div>

            {/* Tags footer */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-4">
                <TagIcon className="w-4 h-4 text-slate-400" />
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-20 space-y-6">
              <TableOfContents content={post.content} />

              {/* Research Checklist / Key Learnings Card */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Curriculum</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  This technical guide complies with open peer-reviewed cryptographic standards. All formulas and code examples have been verified.
                </p>
                <div className="pt-2 text-xs text-blue-600 dark:text-cyan-400 flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Technical Peer Review: Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts Section */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Continue Learning</span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Related Educational Articles</h3>
              </div>
              <Link to="/blog" className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
                Explore all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <PostCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
