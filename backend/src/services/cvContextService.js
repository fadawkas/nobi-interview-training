import fs from "fs";
import path from "path";

export const getCvContext = async (user) => {
  if (!user || !user.cv || !user.cv.filename) {
    return "CV_NOT_AVAILABLE";
  }

  try {
    // Dynamic import ensures cross-platform ESM/CJS compatibility
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const uploadDir =
      process.env.UPLOAD_PATH || path.resolve(process.cwd(), "../shared_data/cv");
    const cvPath = path.join(uploadDir, user.cv.filename);

    if (!fs.existsSync(cvPath)) {
      console.warn(`CV file not found at path: ${cvPath}`);
      return "CV_NOT_AVAILABLE";
    }

    // Only process PDF for now
    if (!user.cv.filename.toLowerCase().endsWith(".pdf")) {
      return "CV_NOT_AVAILABLE";
    }

    const dataBuffer = fs.readFileSync(cvPath);
    const data = await pdfParse(dataBuffer);

    // Limit length to avoid huge token costs
    const text = data.text.replace(/\s+/g, " ").trim();
    const maxTokensRoughly = 2000;
    const charLimit = maxTokensRoughly * 4;

    const truncatedText =
      text.length > charLimit ? text.substring(0, charLimit) + "..." : text;

    return `CV_AVAILABLE:${truncatedText}`;
  } catch (error) {
    console.error("Failed to extract CV context:", error.message);
    return "CV_NOT_AVAILABLE";
  }
};
