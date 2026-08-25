const {
  PutObjectCommand,
   GetObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const crypto = require("crypto");

const s3Client = require("../config/s3");
const File = require("../models/File");

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }

    const fileId = crypto.randomUUID();

    const storageKey = `users/${req.user.userId}/${fileId}/${req.file.originalname}`;

    const shareToken = crypto.randomUUID();

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: storageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ServerSideEncryption: "AES256",
    });

    await s3Client.send(command);

const file = await File.create({
  originalName: req.file.originalname,
  storageKey,
  mimeType: req.file.mimetype,
  size: req.file.size,
  owner: req.user.userId,
  isPublic: false,
  shareToken,
});

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const files = await File.find({
      owner: req.user.userId,
    })
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

const getDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      _id: id,
      owner: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.storageKey,
    });

    const downloadUrl = await getSignedUrl(
      s3Client,
      command,
      {
        expiresIn: 300,
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 300,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      _id: id,
      owner: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.storageKey,
    });

    await s3Client.send(command);

    await File.deleteOne({
      _id: file._id,
      owner: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const toggleFileVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      _id: id,
      owner: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.isPublic = !file.isPublic;

    await file.save();

    return res.status(200).json({
      success: true,
      message: file.isPublic
        ? "File is now public"
        : "File is now private",
      data: {
        id: file._id,
        isPublic: file.isPublic,
        shareToken: file.isPublic ? file.shareToken : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPublicFile = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    const file = await File.findOne({
      shareToken,
      isPublic: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Public file not found",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.storageKey,
    });

    const downloadUrl = await getSignedUrl(
      s3Client,
      command,
      {
        expiresIn: 300,
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        downloadUrl,
        expiresIn: 300,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  listFiles,
   getDownloadUrl,
     deleteFile,
      toggleFileVisibility,
       getPublicFile,
};