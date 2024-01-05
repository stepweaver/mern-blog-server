const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

// Storage
const multerStorage = multer.memoryStorage();

// Check File Type
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      {
        message: 'Unsupported file format.'
      },
      false
    );
  }
};

const photoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 }
});

const fs = require('fs');

// Image Resizing
const profilePhotoResize = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  fs.mkdirSync(directory, { recursive: true });

  try {
    await sharp(req.file.buffer)
      .resize(250, 250)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(path.join(`public/images/profile/${req.file.filename}`));
    next();
  } catch (error) {
    next(error);
  }
};

// Post Image Resizing
const postImgResize = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  const directory = 'public/images/posts';

  fs.mkdirSync(directory, { recursive: true });

  try {
    await sharp(req.file.buffer)
     .resize(250, 250)
     .toFormat('jpeg')
     .jpeg({ quality: 90 })
     .toFile(path.join(`public/images/posts/${req.file.filename}`));
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { photoUpload, profilePhotoResize, postImgResize };