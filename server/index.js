import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import authRoutes from "./routes/auth.js";
import { registerDbApi } from "./routes/db_api.js";
import submissionRoutes from "./routes/submissions.js";

// Explicitly load .env from the server/ folder — works on all Node versions
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const dotenv = require("dotenv");
dotenv.config({ path: join(__dirname, ".env") });

import express from "express"
import { article_extract } from "./scripts/extraction.js"
import { analyzeRoute } from "./scripts/credibility.js"

const app = express()

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  next()
})
const port = process.env.PORT || 3000

app.use(express.json());
app.use("/auth", authRoutes); // Account Creation/Authentication
app.use("/api", submissionRoutes); // Store all sumissions into db
registerDbApi(app); // DB Routes

app.get("/", (req, res) => {
  res.send("Misinformation Detector API — running!")
})

// Original extraction endpoint
app.get("/extract", async (req, res) => {
    const link = req.query.link
    const article = await article_extract(link)
    res.send(article)
    
    
})

// Credibility analysis endpoint
// Usage: GET http://localhost:3000/analyze?link=https://example.com/article
app.get("/analyze", analyzeRoute)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
  console.log("Token loaded:", process.env.HF_TOKEN ? "YES ✓" : "NO ✗ — check your .env file")
})

