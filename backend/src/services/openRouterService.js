import axios from "axios";

/**
 * Generic OpenRouter call.
 * model defaults to OPENROUTER_MODEL env var.
 */
export const callOpenRouter = async (
  prompt,
  systemPrompt,
  modelOverride
) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model =
    modelOverride ||
    process.env.OPENROUTER_MODEL ||
    "deepseek/deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing in environment variables.");
  }

  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  };

  try {
    const response = await axios.post(`${baseURL}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 90000,
    });

    const content = response.data.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch {
      // Retry once with stricter prompt
      const retryPayload = {
        ...payload,
        messages: [
          ...payload.messages,
          { role: "assistant", content },
          {
            role: "user",
            content:
              "That was not valid JSON. Please return ONLY a valid JSON object without any markdown formatting or extra text.",
          },
        ],
      };

      const retryResponse = await axios.post(
        `${baseURL}/chat/completions`,
        retryPayload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 90000,
        }
      );

      const retryContent = retryResponse.data.choices[0].message.content;
      const cleaned = retryContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    throw new Error("Failed to generate response using OpenRouter.");
  }
};

/**
 * Alias for question generation (keeps the old public interface intact).
 */
export const generateQuestions = async (prompt, systemPrompt) => {
  return callOpenRouter(prompt, systemPrompt);
};
