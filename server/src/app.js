

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

// Security middleware
app.use(helmet());

// Allow frontend to communicate with backend
app.use(
  cors({
    origin: "http://localhost:5174",
  })
);

// Parse JSON request bodies
app.use(express.json());

// Basic API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", limiter);
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
// Basic test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Secure File Storage API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size must not exceed 10 MB",
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;