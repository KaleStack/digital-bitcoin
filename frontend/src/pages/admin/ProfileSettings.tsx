import React, { useState } from 'react';
import { UserCheck, KeyRound, Database, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      error('New password and confirmation do not match');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        success('Admin profile updated successfully');
        if (res.data.user) {
          updateUser(res.data.user);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Profile & Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your instructor account credentials and cryptographic authentication keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile and Password Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Instructor Identity</span>
              </h2>

              <Input
                label="Display Name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <Input
                label="Admin Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Change Password */}
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Security & Password (Optional)</span>
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Leave password fields blank if you only want to update your name or email.
              </p>

              <Input
                label="Current Password"
                type="password"
                placeholder="Required if changing password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" size="md" isLoading={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Account Settings
            </Button>
          </form>
        </div>

        {/* System & Database Diagnostics Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Database Status</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>Driver:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">mysql2 (Parameterized)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>Session:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-semibold">JWT (HMAC-SHA256)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>Hashing:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">bcrypt (10 rounds)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span>Role:</span>
                <span className="capitalize text-slate-800 dark:text-slate-200 font-semibold">{user?.role || 'admin'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero SQL Injection Guard</span>
              </p>
              All queries are parameterized to prevent SQL injection vulnerabilities.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
