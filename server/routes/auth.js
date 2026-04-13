import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import sendEmail from "../scripts/email.js";

import { pool } from "../db/db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many password reset attempts from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Creates a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    await pool.execute(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, hashedPassword]
    );

    return res.status(201).json({ message: "User created successfully." });

  } catch (err) {
    // Duplicate checker
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered." });
    }

    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});


// Authenticates user
router.post("/login", async (req, res) => {
  try {

    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await pool.execute(
      "SELECT id, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful.",
      token
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => { 

  const { email } = req.body;
  const genericResponse = { message: "If that email is registered, you will receive a password reset link." };

  if (!email || typeof email !== "string") {
    return res.json(genericResponse);
  }

  try { 
    const user = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);

    const fakeToken = generateResetToken();
    hashToken(fakeToken); // Simulate hashing to equalize timing

    if (user[0].length === 0) {
      return res.json(genericResponse);
    }

    const rawToken = generateResetToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 30 * 60); // 30 min


    await pool.execute(
      "INSERT INTO password_reset_tokens (token, expires_at, user_id, used_at, created_at) VALUES (?, ?, ?, ?, ?)",
      [hashedToken, expiresAt, user[0][0].id, null, new Date(Date.now())]
    );

    const resetUrl = `https://mrcarr87.github.io/CS-411W-Team-Blue-Misinformation-Project/reset-password?token=${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset. Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });

    return res.status(200).json(genericResponse);
    

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json(genericResponse);
  }
})

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "Invalid request." });
  }

  try {
    const tokenHash = hashToken(token);
    
    const [rows] = await pool.execute(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ? AND expires_at > ? AND used_at IS NULL",
      [tokenHash, new Date(Date.now())]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const passWordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.execute(
      "UPDATE users u JOIN password_reset_tokens t ON u.id = t.user_id SET u.password_hash = ?, t.used_at = ? WHERE t.id = ?",
      [passWordHash, new Date(Date.now()), rows[0].id]
    );

    await pool.execute(
      "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ?",
      [new Date(Date.now()), rows[0].id]
    );

    return res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ error: "Internal server error." });
  }
})
export default router;