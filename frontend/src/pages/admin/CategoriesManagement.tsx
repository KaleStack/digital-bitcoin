import React, { useEffect, useState } from 'react';
import { FolderTree, PlusCircle, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  // Delete modal
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingCategory) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      error('Name and slug are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/admin/categories/${editingCategory.id}`, {
          name,
          slug,
          description
        });
        if (res.data.success) {
          success(`Category "${name}" updated!`);
        }
      } else {
        const res = await api.post('/admin/categories', {
          name,
          slug,
          description
        });
        if (res.data.success) {
          success(`Category "${name}" created!`);
        }
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/categories/${catToDelete.id}`);
      if (res.data.success) {
        success(`Category "${catToDelete.name}" deleted`);
        setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
        setCatToDelete(null);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Categories Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize educational tracks and curriculum modules across the platform.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} className="gap-2 shadow-sm font-semibold">
          <PlusCircle className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 animate-pulse shadow-xs" />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No categories defined yet.
          </div>
        ) : (
          categories.map(cat => (
            <div
              key={cat.id}
              className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-2xs">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                    {cat.post_count || 0} guides
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.name}</h3>
                <p className="text-[11px] font-mono font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">/{cat.slug}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(cat)}
                  className="gap-1 text-xs py-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCatToDelete(cat)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        description="Categories group educational modules on the public website and navigation."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Zero-Knowledge Proofs"
            value={name}
            onChange={handleNameChange}
          />

          <Input
            label="Category Slug"
            required
            placeholder="zero-knowledge-proofs"
            value={slug}
            onChange={e => setSlug(slugify(e.target.value))}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain what topics are covered in this curriculum track..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        title="Delete Category"
        description="Deleting a category will unassign it from existing articles. The articles themselves will not be deleted."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCatToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Confirm Category Removal</p>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{catToDelete?.name}"</span>?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
