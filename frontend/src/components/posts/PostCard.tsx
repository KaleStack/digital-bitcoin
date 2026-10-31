import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Calendar, ArrowUpRight } from 'lucide-react';
import { Post } from '../../types';
import { formatDate, formatNumber } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80';

  return (
    <article
      className={`group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden flex flex-col card-hover-effect hover:border-blue-400 dark:hover:border-cyan-500/40 shadow-xs hover:shadow-xl ${
        featured ? 'md:grid md:grid-cols-2 md:gap-6' : ''
      }`}
    >
      {/* Cover Image */}
      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-950 ${featured ? 'h-64 md:h-full' : 'h-48'}`}>
        <img
          src={post.cover_image || fallbackImage}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <Badge variant="accent" className="bg-white/95 dark:bg-slate-950/80 backdrop-blur-md border-slate-200 dark:border-cyan-500/40 text-blue-700 dark:text-cyan-300 font-bold shadow-xs">
            {post.category_name || 'General'}
          </Badge>
        </div>

        {/* Reading Time */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{post.reading_time || 5} min read</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {formatNumber(post.views)} reads
            </span>
          </div>

          <Link to={`/posts/${post.slug}`}>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-cyan-300">
              {post.author_name ? post.author_name.slice(0, 1) : 'A'}
            </div>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{post.author_name || 'CryptoEdu Lead'}</span>
          </div>

          <Link
            to={`/posts/${post.slug}`}
            className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 font-semibold group/link hover:underline"
          >
            <span>Read guide</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
