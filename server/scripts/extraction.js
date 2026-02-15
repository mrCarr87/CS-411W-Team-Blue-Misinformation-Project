import {extract} from "@extractus/article-extractor"
import striptags from "striptags"


async function article_extract(url) {
    try {
        const data = await extract(url)
        
        const content = data.content
        const stripped = striptags(content)
        return stripped
    } catch (error) {
        console.log(error)
    }

    return null
}
export {article_extract}