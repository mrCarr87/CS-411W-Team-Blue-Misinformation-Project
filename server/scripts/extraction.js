const axios = require("axios")
const cheerio = require("cheerio")

async function extract_first(url) {
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

async function extract_all(url) {
    try {
        const response = await axios.get(url)
        const html = response.data 
        const $ = cheerio.load(html)

        const $pTags = $('p')
        const $p_clean = $p.replace(/\s+/g, ' ').trim()

        return $p_clean

    } catch (error) {
        console.error(`Error fetching page: ${error}.`)
    }
}

module.exports = {extract_first, extract_all}