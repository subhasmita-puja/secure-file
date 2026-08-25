const express = require("express");
const { body } = require("express-validator");

const { register, login } = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  register
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login
);

router.get("/me", auth, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      userId: req.user.userId,
      email: req.user.email,
    },
  });
});

module.exports = router;