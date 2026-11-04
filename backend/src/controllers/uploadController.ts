import { Request, Response } from 'express';

export function uploadImage(req: Request, res: Response): void {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file was provided' });
    return;
  }

  const host = req.get('host') || 'digital-bitcoin.onrender.com';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = isLocal
    ? req.protocol
    : (forwardedProto ? String(forwardedProto).split(',')[0].trim() : 'https');
  const cleanProto = isLocal ? proto : 'https'; // Enforce https for all production/cloud hosts

  const serverUrl = `${cleanProto}://${host}`;
  const relativePath = `/uploads/${req.file.filename}`;
  const fullUrl = `${serverUrl}${relativePath}`;

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      filename: req.file.filename,
      relativePath,
      url: fullUrl
    }
  });
}
