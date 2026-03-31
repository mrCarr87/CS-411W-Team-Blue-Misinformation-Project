import express from "express";
import { pool } from "../db/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { article_extract } from "../scripts/extraction.js";
import { analyzeCredibility, analyzeCredibilityFromText } from "../scripts/credibility.js";

const router = express.Router();

/*
  - Stores submission tied to user
  - Extracts article
  - Resolves source_id from domain
  - Runs credibility analysis
  - Stores score in DB
*/
router.post("/submit", authMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Insert submission
    const [submissionResult] = await conn.query(
      `INSERT INTO submissions (user_id, original_url)
       VALUES (?, ?)`,
      [req.user.id, url]
    );

    const submissionId = submissionResult.insertId;

    //  Extract article
    const extracted = await article_extract(url);
    if (!extracted || !extracted.text) {
      throw new Error("Article extraction failed");
    }

    // Resolve source_id from domain
    const domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

    let [sourceRows] = await conn.query(
      `SELECT id FROM sources WHERE domain_name = ?`,
      [domain]
    );

    let sourceId;

    if (sourceRows.length > 0) {
      sourceId = sourceRows[0].id;
    } else {
      const [insertSource] = await conn.query(
        `INSERT INTO sources (domain_name)
         VALUES (?)`,
        [domain]
      );
      sourceId = insertSource.insertId;
    }

    // Insert article
    const [articleResult] = await conn.query(
      `INSERT INTO articles
       (submission_id, source_id, title, author_name, publish_date, text_content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        submissionId,
        sourceId,
        extracted.title ?? null,
        extracted.author ?? null,
        extracted.publish_date
            ? new Date(extracted.publish_date).toISOString().split("T")[0]
            : null,
        extracted.text
      ]
    );

    const articleId = articleResult.insertId;

    // Run real scoring logic
    const fullResult = await analyzeCredibility(url);

    // Store credibility score
    await conn.query(
      `INSERT INTO credibility_scores
       (article_id, overall_score, confidence_level, verdict, analysis_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        articleId,
        fullResult.score,
        100,
        fullResult.score >= 75 ? "High Credibility"
          : fullResult.score >= 50 ? "Moderate Credibility"
          : "Low Credibility",
        fullResult.reasons.join(" ")
      ]
    );

    await conn.commit();

    // Return same structure as /analyze
    res.json({...fullResult, submissionId});

  } catch (err) {
    await conn.rollback();
    console.error("Submission error:", err);
    res.status(500).json({ error: err.message || "Submission failed" });
  } finally {
    conn.release();
  }
});


// Returns user's previous analyses
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT s.id AS submission_id,
             s.original_url,
             s.date_submitted,
             cs.overall_score,
             cs.verdict,
             cs.confidence_level
      FROM submissions s
      LEFT JOIN articles a ON a.submission_id = s.id
      LEFT JOIN credibility_scores cs ON cs.article_id = a.id
      WHERE s.user_id = ?
      ORDER BY s.date_submitted DESC
      `,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Save Endpoint
router.post("/save/:submissionId", authMiddleware, async (req, res) => {
  const { submissionId } = req.params;

  try {
    // Ensure submission belongs to user
    const [check] = await pool.query(
      `SELECT id FROM submissions WHERE id = ? AND user_id = ?`,
      [submissionId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.query(
      `INSERT INTO saved_articles (user_id, submission_id)
       VALUES (?, ?)`,
      [req.user.id, submissionId]
    );

    res.json({ message: "Article saved" });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Already saved" });
    }
    res.status(500).json({ error: "Failed to save article" });
  }
});

// Unsave submission
router.delete("/save/:submissionId", authMiddleware, async (req, res) => {
  const { submissionId } = req.params;

  try {
    await pool.query(
      `DELETE FROM saved_articles
       WHERE user_id = ? AND submission_id = ?`,
      [req.user.id, submissionId]
    );

    res.json({ message: "Article unsaved" });

  } catch (err) {
    res.status(500).json({ error: "Failed to unsave article" });
  }
});

// Get saved
router.get("/saved", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT s.id AS submission_id,
             s.original_url,
             s.date_submitted,
             cs.overall_score,
             cs.verdict
      FROM saved_articles sa
      JOIN submissions s ON sa.submission_id = s.id
      LEFT JOIN articles a ON a.submission_id = s.id
      LEFT JOIN credibility_scores cs ON cs.article_id = a.id
      WHERE sa.user_id = ?
      ORDER BY sa.saved_at DESC
      `,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch saved articles" });
  }
});

// Return user profile

router.get("/me", authMiddleware, async(req, res) => {

  try {
      
      const [rows] = await pool.query(
        `
        SELECT  id AS user_id,
                email,
                role,
                created_at
        FROM users
        WHERE id = ?
        
        `,
        [req.user.id]
      );


      if (rows.length === 0) { // Where there no users found?
        return res.status(404).json({ message: "User not found" })
      }
      
      res.json(rows[0]) // No issues, return the user
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" })
  }
  
})

router.post("/analyze-text", async (req, res) => {
  const { text, sourceUrl } = req.body;
 
  if (!text || text.trim().length < 100) {
    return res.status(400).json({ error: "Text must be at least 100 characters." });
  }
 
  try {
    const result = await analyzeCredibilityFromText(text.trim(), sourceUrl?.trim() || null);
    res.json(result);
  } catch (err) {
    console.error("Text analysis error:", err);
    res.status(500).json({ error: err.message || "Text analysis failed" });
  }
});


export default router;