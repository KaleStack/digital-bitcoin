import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Lock,
  Unlock,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../../lib/api';
import { Category, Post } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RichEditor } from '../../components/posts/RichEditor';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [tagsInput, setTagsInput] = useState('');

  // Draft Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Auto-slug generation
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing && isSlugLocked) {
      setSlug(slugify(newTitle));
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data);
          if (!isEditing && catRes.data.data.length > 0) {
            setCategoryId(catRes.data.data[0].id);
          }
        }

        if (isEditing) {
          const postsRes = await api.get('/admin/posts');
          if (postsRes.data.success) {
            const found: Post = postsRes.data.data.find((p: Post) => p.id === Number(id));
            if (found) {
              setTitle(found.title);
              setSlug(found.slug);
              setExcerpt(found.excerpt || '');
              setContent(found.content);
              setCoverImage(found.cover_image || '');
              setCategoryId(found.category_id || '');
              setStatus(found.status);
              setTagsInput(found.tags ? found.tags.join(', ') : '');
            } else {
              error('Post not found');
              navigate('/admin/posts');
            }
          }
        }
      } catch (err) {
        error('Failed to load initial editor data');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [id, isEditing]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploadingCover(true);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.data?.url) {
        setCoverImage(res.data.data.url);
        success('Cover image uploaded successfully');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async (targetStatus?: 'draft' | 'published') => {
    if (!title.trim()) {
      error('Please provide an article title');
      return;
    }
    if (!content.trim()) {
      error('Article content cannot be empty');
      return;
    }

    const currentFinalStatus = targetStatus || status;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug: slug || slugify(title),
      excerpt,
      content,
      cover_image: coverImage || null,
      category_id: categoryId ? Number(categoryId) : null,
      status: currentFinalStatus,
      tags
    };

    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/admin/posts/${id}`, payload);
        success('Article updated successfully!');
      } else {
        await api.post('/admin/posts', payload);
        success('Article created successfully!');
      }
      navigate('/admin/posts');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Educational Guide' : 'Draft New Educational Guide'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing ? `Modifying ID #${id}` : 'Create comprehensive technical documentation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Draft
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSave('draft')}
            className="gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSave('published')}
            className="gap-1.5 text-xs shadow-sm font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Live
          </Button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Editor Inputs */}
        <div className="md:col-span-2 space-y-6">
          <Input
            label="Article Title"
            required
            placeholder="e.g., Understanding Zero-Knowledge Rollups and Validity Proofs"
            value={title}
            onChange={handleTitleChange}
            className="text-base font-semibold"
          />

          {/* Slug with lock/unlock */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                URL Slug
              </label>
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isSlugLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{isSlugLocked ? 'Auto-generating' : 'Manual override'}</span>
              </button>
            </div>
            <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-300 shadow-2xs">
              <span className="text-slate-400 dark:text-slate-500">/posts/</span>
              <input
                type="text"
                value={slug}
                disabled={isSlugLocked}
                onChange={e => setSlug(slugify(e.target.value))}
                placeholder="article-url-slug"
                className="bg-transparent flex-1 focus:outline-none text-slate-900 dark:text-slate-100 disabled:opacity-60 pl-0.5"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Excerpt / Abstract
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Brief summary displayed on cards, search engines, and social media embeds..."
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-2xs"
            />
          </div>

          {/* Rich Content Editor */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Curriculum Content (Markdown & HTML)
            </label>
            <RichEditor value={content} onChange={setContent} minHeight="420px" />
          </div>
        </div>

        {/* Right 1 Col: Metadata & Publishing Controls */}
        <div className="space-y-6">
          {/* Publishing Status Card */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Publication Settings
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Post Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="Bitcoin, Consensus, Layer2"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Cover Image Card */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Cover Image
            </h3>

            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-36 bg-slate-100 dark:bg-slate-950">
                <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 p-4 text-center">
                <ImageIcon className="w-6 h-6 text-slate-400" />
                <span>No cover image selected</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
              />
            </div>

            <div className="pt-1">
              <label className="block w-full text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
                <span>{isUploadingCover ? 'Uploading...' : 'Upload Image File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={isUploadingCover}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Live Article Preview"
        description="Inspect how this educational guide will be presented to readers."
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {coverImage && (
            <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img src={coverImage} alt="Preview Cover" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title || 'Untitled Article'}</h2>
            {excerpt && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">{excerpt}</p>}
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 font-mono text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {content || 'No content provided yet.'}
          </div>
        </div>
      </Modal>
    </div>
  );
}
