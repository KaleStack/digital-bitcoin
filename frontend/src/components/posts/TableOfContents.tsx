import React, { useMemo } from 'react';
import { ListTree, ChevronRight } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const headings = useMemo(() => {
    const list: TOCItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_`]/g, '');
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        list.push({ id, text, level });
      }
    }
    return list;
  }, [content]);

  if (headings.length === 0) return null;

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-sm space-y-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <ListTree className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
        <span>Table of Contents</span>
      </div>
      <div className="space-y-1.5 text-xs">
        {headings.map(h => (
          <button
            key={h.id}
            onClick={() => scrollTo(h.id)}
            style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
            className="flex items-center gap-1.5 text-left text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors w-full py-1 cursor-pointer"
          >
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
            <span className="truncate">{h.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
