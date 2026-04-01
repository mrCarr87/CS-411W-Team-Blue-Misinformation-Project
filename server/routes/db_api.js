import { pool } from "../db/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/dbMiddleware.js";

// Get sources
export function registerDbApi(app) {
  app.get("/sources", async (req, res) => {
    try {
      const { minScore } = req.query;

      const query = minScore
        ? `SELECT id, domain_name, credibility_score, last_updated, active
           FROM sources
           WHERE credibility_score >= ?
           ORDER BY credibility_score DESC`
        : `SELECT id, domain_name, credibility_score, last_updated, active
           FROM sources
           ORDER BY domain_name`;

      const params = minScore ? [Number(minScore)] : [];

      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("GET /sources error:", err);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });


  // Add or update source (admin)
  app.post("/sources", authMiddleware, requireAdmin, async (req, res) => {

    const { domain_name, credibility_score, active } = req.body;

    if (!domain_name) {
      return res.status(400).json({ error: "domain_name required" });
    }

    try {
      await pool.query(
        `INSERT INTO sources (domain_name, credibility_score, last_updated, active)
         VALUES (?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           credibility_score = VALUES(credibility_score),
           last_updated = NOW(),
           active = VALUES(active)`,
        [domain_name, credibility_score ?? null, active ?? 1]
      );

      res.json({ ok: true });
    } catch (err) {
      console.error("POST /sources error:", err);
      res.status(500).json({ error: "Failed to update source" });
    }
  });


  // // Update trusted sources
  // app.patch("/sources/:id", authMiddleware, requireAdmin, async(req, res) => {
  //   const {id} = req.params

  //   const { active } = req.body;
      
  //   // Check if active value exists
  //   if (!active) { return res.status(400).json({ error: "Active value required" }) }
  //   // Check if active value is a number and is 0 or 1.
  //   // if (!Number.isInteger(active)) return res.status(400).json({error: "Active value must be an integer"})
  //   if (active > 1 || active < 0 ) return res.status(400).json({error: "Active value must be 0 or 1"})
    
  //   try {

  //     // Check to ensure if source exists
  //     let [check] = await pool.query(
  //       `SELECT id FROM sources WHERE id = ?`,
  //       [id]
  //     );

  //     if (check.length === 0) {
  //       return res.status(404).json({ error: "Source does not exist" });
  //     }

  //     // Apply active value to source
  //     await pool.query('UPDATE sources SET active = ? WHERE id = ?', [active, id])

  //     res.json({ok: true})
  //   } catch (err) { 
  //     res.status(500).json({ error: "Failed to update source" });
  //     console.log(err)
  //   }
  // })

  // Insert verified claim (admin)
  app.post("/claims/verified", async (req, res) => {
    if (!requireAdminKey(req, res)) return;

    const { article_id, claim_text, evidence_url, match_result } = req.body;

    if (!article_id || !claim_text) {
      return res.status(400).json({
        error: "article_id and claim_text required"
      });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [claimResult] = await conn.query(
        `INSERT INTO claims (article_id, claim_text)
         VALUES (?, ?)`,
        [article_id, claim_text]
      );

      const claimId = claimResult.insertId;

      if (evidence_url) {
        await conn.query(
          `INSERT INTO evidence_links (claim_id, evidence_url, match_result)
           VALUES (?, ?, ?)`,
          [claimId, evidence_url, match_result ?? null]
        );
      }

      await conn.commit();
      res.json({ ok: true, claim_id: claimId });

    } catch (err) {
      await conn.rollback();
      console.error("POST /claims/verified error:", err);
      res.status(500).json({ error: "Failed to insert claim" });
    } finally {
      conn.release();
    }
  });

  // Insert credibility score (admin)
  app.post("/scores", async (req, res) => {
    if (!requireAdminKey(req, res)) return;

    const {
      article_id,
      overall_score,
      confidence_level,
      verdict,
      analysis_notes
    } = req.body;

    if (!article_id) {
      return res.status(400).json({ error: "article_id required" });
    }

    try {
      await pool.query(
        `INSERT INTO credibility_scores
         (article_id, overall_score, confidence_level, verdict, analysis_notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          article_id,
          overall_score ?? null,
          confidence_level ?? null,
          verdict ?? null,
          analysis_notes ?? null
        ]
      );

      res.json({ ok: true });
    } catch (err) {
      console.error("POST /scores error:", err);
      res.status(500).json({ error: "Failed to insert score" });
    }
  });
}