import { extract } from "@extractus/article-extractor";
import striptags from "striptags";

async function article_extract(url) {
  try {
    const data = await extract(url);

    if (!data || !data.content) {
      return null;
    }

    const text = striptags(data.content).trim();

    return {
      title: data.title ?? null,
      author: data.author ?? null,
      publish_date: data.published ?? null,
      text
    };

  } catch (error) {
    console.error("Extraction error:", error);
    return null;
  }
}

export { article_extract };