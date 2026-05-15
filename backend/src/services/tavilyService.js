import { tavily } from "@tavily/core";

export const getTavilyContext = async (position, company, interviewType) => {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn("TAVILY_API_KEY is not set. Skipping Tavily context gathering.");
    return "";
  }

  // Build the search query
  const queryParts = [position, "interview questions"];
  if (company) {
    queryParts.push(company);
    queryParts.push("job requirements responsibilities");
  }
  if (interviewType && interviewType !== "General") {
    queryParts.push(interviewType);
  }

  const query = queryParts.join(" ");

  try {
    const tvly = tavily({ apiKey });

    const response = await tvly.search(query, {
      searchDepth: "basic",
      maxResults: 5,
    });

    const results = response.results || [];
    if (results.length === 0) {
      return "No web search context found.";
    }

    const contextSnippets = results
      .map((result) => {
        let text = result.content || "";
        if (result.title) {
          text = `${result.title}: ${text}`;
        }
        return text;
      })
      .filter((text) => text.length > 0)
      .join("\n\n");

    return contextSnippets;
  } catch (error) {
    console.error("Tavily Search Error:", error.message);
    // Return empty string on error so the flow can continue without search context
    return "";
  }
};
