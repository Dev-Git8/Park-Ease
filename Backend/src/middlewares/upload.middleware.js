const multer = require('multer');

// Store file in memory to upload directly to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Multer's fileFilter only sees the client-supplied Content-Type header,
// which is trivially spoofable. This sniffs the actual magic bytes of the
// uploaded buffer so a renamed non-image file can't slip through.
const verifyImageContent = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const { fileTypeFromBuffer } = await import('file-type');
        const detected = await fileTypeFromBuffer(req.file.buffer);

        if (!detected || !detected.mime.startsWith('image/')) {
            return res.status(400).json({ success: false, message: 'Uploaded file is not a valid image' });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = upload;
module.exports.verifyImageContent = verifyImageContent;
