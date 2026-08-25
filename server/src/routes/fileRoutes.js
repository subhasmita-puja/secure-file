const express = require("express");

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadFile, listFiles,   getDownloadUrl,   deleteFile,  toggleFileVisibility, getPublicFile, } = require("../controllers/fileController");

const router = express.Router();

router.post(
  "/upload",
  auth,
  upload.single("file"),
  uploadFile
);

router.get("/", auth, listFiles);
router.get("/public/:shareToken", getPublicFile);
router.get("/:id/download", auth, getDownloadUrl);
router.delete("/:id", auth, deleteFile);
router.patch("/:id/visibility", auth, toggleFileVisibility);

module.exports = router;