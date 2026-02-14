import express from "express"
import {article_extract} from "./scripts/extraction.js"
const app = express()
const port = 3000




app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.get("/extract", async (req, res) => {
    const link = req.query.link
    const article = await article_extract(link)
    res.send(article)
    
    
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})