import axios from "axios";
import * as cheerio from "cheerio";

export const getLinksContext = async (links) => {
  if (!links || !Array.isArray(links) || links.length === 0) {
    return "";
  }

  const validLinks = links.filter(
    (link) => typeof link === "string" && link.trim() !== ""
  );

  if (validLinks.length === 0) {
    return "";
  }

  const contexts = await Promise.allSettled(
    validLinks.map(async (link) => {
      try {
        const response = await axios.get(link, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.google.com/",
          },
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script and style elements
        $("script, style").remove();

        // Extract text from paragraphs, headings, and list items
        const texts = [];
        $("p, h1, h2, h3, h4, h5, h6, li").each((_, el) => {
          const text = $(el).text().trim();
          if (text) {
            texts.push(text);
          }
        });

        const pageText = texts.join(" ").replace(/\s+/g, " ");

        // Limit the length of context per link to avoid huge tokens
        const maxTokensRoughly = 2000;
        const charLimit = maxTokensRoughly * 4;
        
        const truncatedText =
          pageText.length > charLimit
            ? pageText.substring(0, charLimit) + "..."
            : pageText;

        return `Content from ${link}:\n${truncatedText}`;
      } catch (error) {
        console.warn(`Failed to scrape link ${link}:`, error.message);
        return ""; // Return empty for failed links
      }
    })
  );

  const combinedContext = contexts
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value)
    .join("\n\n");

  return combinedContext;
};
