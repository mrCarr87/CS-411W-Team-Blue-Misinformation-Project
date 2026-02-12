const axios = require("axios")
const cheerio = require("cheerio")

async function extract(url) {
    try {
        const response = await axios.get(url)
        const html = response.data 
        const $ = cheerio.load(html)

        const $p = $('p:first').text()
        const $p_clean = $p.replace(/\s+/g, ' ').trim()

        return $p_clean

    } catch (error) {
        console.error(`Error fetching page: ${error}.`)
    }
}

module.exports = {extract}