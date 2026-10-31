export function uploadImage(req, res) {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file was provided' });
        return;
    }
    const serverUrl = `${req.protocol}://${req.get('host')}`;
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
