import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Lock,
  Sparkles,
  BookOpen,
  Compass,
  Award
} from 'lucide-react';
import { api } from '../../lib/api';
import { Post, Category } from '../../types';
import { PostCard } from '../../components/posts/PostCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function Home() {
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, catRes] = await Promise.all([
          api.get('/posts?limit=7'),
          api.get('/categories')
        ]);

        if (postsRes.data.success && postsRes.data.data.length > 0) {
          setFeaturedPost(postsRes.data.data[0]);
          setRecentPosts(postsRes.data.data.slice(1, 7));
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const bentoItems = [
    {
      icon: Lock,
      title: 'Cryptographic Sovereignty',
      desc: 'Understand asymmetric cryptography, elliptic curve signatures, and true self-custody over your assets without counterparty risk.',
      badge: 'Core Principle',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-800/60'
    },
    {
      icon: Cpu,
      title: 'Decentralized Computation',
      desc: 'Dive into the Ethereum Virtual Machine, gas economics, and deterministic execution of smart contract agreements.',
      badge: 'Compute Layer',
      color: 'text-sky-600 dark:text-cyan-400',
      bg: 'bg-sky-50 dark:bg-cyan-950/60 border-sky-200/80 dark:border-cyan-800/60'
    },
    {
      icon: TrendingUp,
      title: 'Financial Composability',
      desc: 'Explore Automated Market Makers (AMMs), decentralized lending protocols, flash loans, and algorithmic liquidity pools.',
      badge: 'DeFi Ecosystem',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60'
    },
    {
      icon: Layers,
      title: 'Consensus Architectures',
      desc: 'Analyze thermodynamic Proof-of-Work vs. bonded Proof-of-Stake, Byzantine fault tolerance, and finality mechanisms.',
      badge: 'Consensus',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-slate-200/80 dark:border-slate-800/60 bg-grid-pattern">
        {/* Ambient Gradient Glows (Light & Dark) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/10 via-cyan-400/10 to-amber-300/10 dark:from-blue-600/20 dark:via-cyan-500/15 dark:to-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-cyan-400" />
            <span>Open-Access Web3 & Blockchain Engineering Curriculum</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Master Blockchain Architecture, <br />
            <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-amber-500 dark:from-blue-400 dark:via-cyan-300 dark:to-amber-300 bg-clip-text text-transparent">
              Cryptography & Decentralized Finance
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Zero speculation, pure technical depth. Peer-reviewed educational guides on Satoshi's consensus, smart contracts, AMMs, and hardware self-custody.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/blog">
              <Button size="lg" className="shadow-lg shadow-blue-600/20 font-semibold gap-2">
                <BookOpen className="w-4 h-4" />
                Explore Articles
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a
              href="#curriculum"
              onClick={(e) => {
                const el = document.getElementById('curriculum');
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-block"
            >
              <Button
                variant="secondary"
                size="lg"
                className="bg-white hover:bg-slate-100 text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white border-2 border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 font-bold shadow-sm gap-2 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span className="text-slate-900 dark:text-white font-bold">Browse Curriculum</span>
              </Button>
            </a>
          </div>

          {/* Live Crypto Metrics Bar */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 backdrop-blur-md shadow-xl dark:shadow-2xl">
            <div className="p-3 text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bitcoin Network</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                Block #885,214
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Sync</span>
              </p>
            </div>
            <div className="p-3 text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ethereum Consensus</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                PoS Epoch 284k
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold">● Finalized</span>
              </p>
            </div>
            <div className="p-3 text-left border-r border-slate-100 dark:border-slate-800/80 last:border-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Curriculum Guides</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                {recentPosts.length + (featuredPost ? 1 : 0)} Deep Dives
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">● Verified</span>
              </p>
            </div>
            <div className="p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reading Level</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                Beginner → Dev
                <span className="text-[10px] text-indigo-600 dark:text-blue-400 font-semibold">● Verified</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Article Spotlight */}
      {featuredPost && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Featured Research</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Editor's Spotlight Guide</h2>
            </div>
            <Link to="/blog" className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <span>View all guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <PostCard post={featuredPost} featured={true} />
        </section>
      )}

      {/* 3. Categories Showcase */}
      <section id="curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Core Pathways</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">Explore By Topic</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Structured learning pathways tailored from foundational blockchain mechanics to complex DeFi algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 card-hover-effect hover:border-blue-400 dark:hover:border-cyan-500/40 group flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors text-base">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {cat.description || 'Comprehensive curriculum on this core Web3 subject.'}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{cat.post_count || 0} guides</span>
                <span className="text-blue-600 dark:text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Browse <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Recent Guides Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Fresh Content</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Latest Educational Articles</h2>
          </div>
          <Link to="/blog">
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>View archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* 5. "Why Learn Crypto" Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-950/90 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Foundational Principles</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">Why Technical Crypto Literacy Matters</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Cryptocurrency is not merely an asset class—it is an adversarial computational paradigm for global coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bentoItems.map((item, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all flex flex-col justify-between shadow-xs card-hover-effect"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${item.bg}`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <Badge variant="default" className="text-[10px]">
                      {item.badge}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
