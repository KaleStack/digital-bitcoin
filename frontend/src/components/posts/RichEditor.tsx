import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Columns,
  Eye,
  PenTool,
  Upload,
  Minus
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

export interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  minHeight?: string;
}

export function RichEditor({ value, onChange, minHeight = '380px' }: RichEditorProps) {
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('split');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { success, error } = useToast();

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end);
    const replacement = `${before}${selection || 'text'}${after}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + replacement.length - after.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.data?.url) {
        const imageUrl = res.data.data.url;
        insertText(`\n![${file.name.replace(/\.[^/.]+$/, '')}](${imageUrl})\n`);
        success('Image uploaded and inserted into article!');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Render markdown preview
  const renderPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-3">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            const h = line.slice(2);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h1 key={idx} id={id} className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">{h}</h1>;
          }
          if (line.startsWith('## ')) {
            const h = line.slice(3);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h2 key={idx} id={id} className="text-xl font-bold text-blue-600 dark:text-cyan-300 mt-5 mb-2">{h}</h2>;
          }
          if (line.startsWith('### ')) {
            const h = line.slice(4);
            const id = h.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return <h3 key={idx} id={id} className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">{h}</h3>;
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-blue-600 dark:border-cyan-500 pl-4 py-1.5 italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-r-lg my-2">
                {line.slice(2)}
              </blockquote>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-4" />;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-slate-700 dark:text-slate-300">
                {line.slice(2)}
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <li key={idx} className="ml-5 list-decimal text-slate-700 dark:text-slate-300">
                {line.replace(/^\d+\.\s/, '')}
              </li>
            );
          }
          if (line.startsWith('![')) {
            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <img src={match[2]} alt={match[1]} className="w-full h-auto max-h-96 object-cover" />
                  {match[1] && <p className="text-xs text-center text-slate-500 py-1.5 bg-slate-100 dark:bg-slate-950/80">{match[1]}</p>}
                </div>
              );
            }
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }

          // Format bold and backticks
          const formatted = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-cyan-300 font-mono text-xs border border-slate-200 dark:border-slate-700">$1</code>');

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        })}
      </div>
    );
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden flex flex-col shadow-xs">
      {/* Toolbar */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => insertText('**', '**')}
            title="Bold"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*')}
            title="Italic"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => insertText('# ')}
            title="Heading 1"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ')}
            title="Heading 3"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => insertText('> ')}
            title="Blockquote"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('```\n', '\n```')}
            title="Code Block"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('- ')}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ')}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](https://)')}
            title="Link"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n---\n')}
            title="Divider"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Image Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer ml-1 border border-slate-300 dark:border-slate-700 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
          </button>
        </div>

        {/* View Mode Switcher & Stats */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{wordCount} words</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-cyan-400 font-semibold">{readingTime} min read</span>
          </div>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer font-medium ${
                viewMode === 'write'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer font-medium ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer font-medium ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800" style={{ minHeight }}>
        {/* Editor Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className={viewMode === 'write' ? 'md:col-span-2' : ''}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Write your crypto educational content in Markdown or HTML..."
              className="w-full h-full min-h-[380px] p-4 bg-transparent text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-y focus:outline-none"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            {value.trim() ? (
              renderPreview(value)
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Preview will appear here as you type...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
