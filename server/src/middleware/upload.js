const multer = require("multer");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const MAX_FILE_SIZE = 110 * 1024 * 1024;

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const allowedExtensions = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".mp4",
  ".webm",
  ".mov",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `${crypto.randomUUID()}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validMimeType =
    allowedMimeTypes.includes(file.mimetype);

  const validExtension =
    allowedExtensions.includes(extension);

  if (!validMimeType || !validExtension) {
    return cb(
      new Error(
       "Invalid file type. Only PDF, PNG, JPG/JPEG, TXT, MP4, WEBM, and MOV files are allowed."
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter,
});

module.exports = upload;