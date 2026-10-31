import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, isUsingMySQL, memoryStore } from '../db/index.js';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-jwt-secret-crypto-edu-2026-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const loginSchema = z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});
export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional()
});
export async function login(req, res) {
    const { email, password } = req.body;
    try {
        let admin = null;
        if (isUsingMySQL()) {
            const rows = await query('SELECT id, email, password_hash, name, role, created_at FROM admins WHERE email = ?', [email.toLowerCase().trim()]);
            if (rows && rows.length > 0) {
                admin = rows[0];
            }
        }
        else {
            const found = memoryStore.admins.find(a => a.email.toLowerCase() === email.toLowerCase().trim());
            if (found) {
                admin = { ...found };
            }
        }
        if (!admin) {
            res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
            return;
        }
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
            return;
        }
        const payload = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            created_at: admin.created_at
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: payload
        });
    }
    catch (error) {
        console.error('[Auth Login Error]:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
}
export async function getMe(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    try {
        if (isUsingMySQL()) {
            const rows = await query('SELECT id, email, name, role, created_at FROM admins WHERE id = ?', [req.user.id]);
            if (rows.length === 0) {
                res.status(404).json({ success: false, message: 'Admin account not found' });
                return;
            }
            res.json({ success: true, user: rows[0] });
            return;
        }
        const admin = memoryStore.admins.find(a => a.id === req.user?.id);
        if (!admin) {
            res.status(404).json({ success: false, message: 'Admin account not found' });
            return;
        }
        const { password_hash, ...safeAdmin } = admin;
        res.json({ success: true, user: safeAdmin });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
    }
}
export async function updateProfile(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const { name, email, currentPassword, newPassword } = req.body;
    try {
        let currentAdmin = null;
        if (isUsingMySQL()) {
            const rows = await query('SELECT * FROM admins WHERE id = ?', [req.user.id]);
            if (rows.length > 0)
                currentAdmin = rows[0];
        }
        else {
            const found = memoryStore.admins.find(a => a.id === req.user?.id);
            if (found)
                currentAdmin = { ...found };
        }
        if (!currentAdmin) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }
        let passwordHash = currentAdmin.password_hash;
        if (newPassword) {
            if (!currentPassword) {
                res.status(400).json({ success: false, message: 'Current password is required to change password' });
                return;
            }
            const isMatch = await bcrypt.compare(currentPassword, currentAdmin.password_hash);
            if (!isMatch) {
                res.status(400).json({ success: false, message: 'Current password does not match' });
                return;
            }
            passwordHash = await bcrypt.hash(newPassword, 10);
        }
        const updatedName = name || currentAdmin.name;
        const updatedEmail = email ? email.toLowerCase().trim() : currentAdmin.email;
        if (isUsingMySQL()) {
            await query('UPDATE admins SET name = ?, email = ?, password_hash = ? WHERE id = ?', [updatedName, updatedEmail, passwordHash, req.user.id]);
        }
        else {
            const idx = memoryStore.admins.findIndex(a => a.id === req.user?.id);
            if (idx !== -1) {
                memoryStore.admins[idx].name = updatedName;
                memoryStore.admins[idx].email = updatedEmail;
                memoryStore.admins[idx].password_hash = passwordHash;
            }
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: req.user.id,
                name: updatedName,
                email: updatedEmail,
                role: currentAdmin.role
            }
        });
    }
    catch (error) {
        console.error('[Profile Update Error]:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
}
export function logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully' });
}
