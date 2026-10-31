import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderTree,
  UserCheck,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../../hooks/useTheme';

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'All Articles', path: '/admin/posts', icon: FileText, exact: true },
    { label: 'New Article', path: '/admin/posts/new', icon: PlusCircle, exact: true },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree, exact: true },
    { label: 'Admin Profile', path: '/admin/settings', icon: UserCheck, exact: true }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200/90 dark:border-slate-800/80 flex flex-col h-screen sticky top-0 transition-colors shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-amber-400 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[6px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block">
              CryptoEdu CMS
            </span>
            <span className="text-[10px] text-blue-600 dark:text-cyan-400 uppercase tracking-widest font-bold block -mt-0.5">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* User Info Capsule */}
      <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 shadow-2xs">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-cyan-300 font-bold text-xs">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Administrator'}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
        </div>
        <Badge variant="accent" className="text-[10px] px-1.5 py-0">
          {user?.role || 'admin'}
        </Badge>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Content Management
        </div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-cyan-300 border border-blue-200/80 dark:border-cyan-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-slate-500 font-medium">Appearance</span>
          <ThemeToggle />
        </div>

        <Link
          to="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">Live</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
