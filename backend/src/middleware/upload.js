const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../public/uploads');

const compressImage = async (filePath) => {
  const outputPath = filePath.replace(/(\.\w+)$/, '-compressed.jpg');

  await sharp(filePath)
    .resize(800) // max width
    .jpeg({ quality: 70 })
    .toFile(outputPath);

  fs.unlinkSync(filePath); // delete original

  return path.basename(outputPath);
};

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter,
});

const compressMiddleware = async (req, res, next) => {
  try {
    if (req.files) {
      for (let file of req.files) {
        if (file.mimetype.startsWith('image/')) {
          const outputPath = file.path.replace(/(\.\w+)$/, '-compressed.jpg');

          await sharp(file.path)
            .resize(800)
            .jpeg({ quality: 70 })
            .toFile(outputPath);

          fs.unlinkSync(file.path);

          file.filename = path.basename(outputPath);
          file.path = outputPath;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {upload, compressMiddleware};
