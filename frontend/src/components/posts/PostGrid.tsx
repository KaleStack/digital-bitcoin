import React from 'react';
import { Post } from '../../types';
import { PostCard } from './PostCard';
import { BookOpen } from 'lucide-react';

export interface PostGridProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PostGrid({
  posts,
  isLoading = false,
  emptyMessage = 'No educational articles found in this section.'
}: PostGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-4 animate-pulse shadow-xs"
          >
            <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800/80 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-2/3" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 p-8">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-500 shadow-xs">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">No articles available</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
