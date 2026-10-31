import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  Eye,
  PlusCircle,
  FolderTree,
  ExternalLink,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api';
import { DashboardStats } from '../../types';
import { formatDate, formatNumber } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Educational Posts',
      value: stats?.totalPosts || 0,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/60'
    },
    {
      title: 'Published Live',
      value: stats?.publishedPosts || 0,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60'
    },
    {
      title: 'Drafts in Progress',
      value: stats?.draftPosts || 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60'
    },
    {
      title: 'Total Curriculum Views',
      value: formatNumber(stats?.totalViews || 0),
      icon: Eye,
      color: 'text-sky-600 dark:text-cyan-400',
      bg: 'bg-sky-50 dark:bg-cyan-950/50 border-sky-200/80 dark:border-cyan-800/60'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Academy Analytics & Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time curriculum statistics, readership engagement, and quick CMS shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/posts/new">
            <Button size="sm" className="gap-2 shadow-sm font-semibold">
              <PlusCircle className="w-4 h-4" />
              New Article
            </Button>
          </Link>
          <Link to="/admin/categories">
            <Button variant="secondary" size="sm" className="gap-2">
              <FolderTree className="w-4 h-4" />
              Categories
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.title}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">{card.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Split: Recent Activity & Quick CMS Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Curriculum Updates</h2>
            </div>
            <Link to="/admin/posts" className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold">
              Manage all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Article Title</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Reads</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stats?.recentPosts && stats.recentPosts.length > 0 ? (
                  stats.recentPosts.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-4 max-w-xs">
                        <Link
                          to={`/admin/posts/edit/${post.id}`}
                          className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 truncate block"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                          {formatDate(post.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <Badge
                          variant={
                            post.status === 'published'
                              ? 'success'
                              : post.status === 'draft'
                              ? 'warning'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {post.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                        {formatNumber(post.views)}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <Link
                          to={`/admin/posts/edit/${post.id}`}
                          className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold"
                        >
                          Edit
                        </Link>
                        {post.status === 'published' && (
                          <Link
                            to={`/posts/${post.slug}`}
                            target="_blank"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No articles created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Info & Guidelines Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Curriculum Guidelines</span>
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-cyan-400 font-bold">•</span>
                <span><strong>No Price Speculation:</strong> Focus strictly on protocols, math, cryptography, and network topology.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-cyan-400 font-bold">•</span>
                <span><strong>Include Code / Equations:</strong> Ground theoretical claims in Solidity or cryptographic invariants.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-cyan-400 font-bold">•</span>
                <span><strong>High-Resolution Covers:</strong> Use clean technical illustrations or abstract crypto vector visuals.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link to="/admin/posts/new">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs">
                  Draft New Guide Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
