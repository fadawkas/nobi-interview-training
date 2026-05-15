import { generateQuestions } from "./openRouterService.js";
import { getTavilyContext } from "./tavilyService.js";
import { getLinksContext } from "./linkContextService.js";
import { getCvContext } from "./cvContextService.js";

export const generateInterviewQuestions = async ({
  user,
  position,
  company,
  links,
  interviewType,
  difficulty,
  description,
  questionCount,
}) => {
  // 1. Gather Contexts in parallel
  const [cvRawContext, linksContext, searchContext] = await Promise.all([
    getCvContext(user),
    getLinksContext(links),
    getTavilyContext(position, company, interviewType),
  ]);

  // 2. Determine if CV is actually available
  const cvAvailable = cvRawContext && cvRawContext.startsWith("CV_AVAILABLE:");
  const cvContext = cvAvailable
    ? `Extracted CV Text:\n${cvRawContext.slice("CV_AVAILABLE:".length)}`
    : null;

  // Extract user's self-description if available
  const selfDescription = user?.description || null;

  // 3. Build System Prompt (adaptive based on available contexts)
  const systemPrompt = buildSystemPrompt({
    cvAvailable,
    questionCount,
    difficulty,
    interviewType,
    selfDescription,
    cvContext,
  });

  // 4. Build User Prompt
  const prompt = buildUserPrompt({
    position,
    company,
    interviewType,
    difficulty,
    description,
    questionCount,
    cvAvailable,
    cvContext,
    selfDescription,
    linksContext,
    searchContext,
  });

  // 5. Generate Questions via OpenRouter (with retry fallback)
  const result = await generateQuestionsWithFallback(prompt, systemPrompt, questionCount);

  return {
    questions: result.questions,
    contextSummary: {
      cv: cvAvailable ? "Available" : "Not Available",
      selfDescription: selfDescription ? "Available" : "Not Available",
      links: linksContext ? "Available" : "Not Available",
      search: searchContext ? "Available" : "Not Available",
    },
    metadata: {
      model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash",
      questionCount,
      interviewType,
      difficulty,
    },
  };
};

/**
 * Build the system prompt adaptively based on what context is available.
 * Priority chain: CV > Self-Description > Role-general
 */
function buildSystemPrompt({
  cvAvailable,
  questionCount,
  difficulty,
  interviewType,
  selfDescription,
  cvContext,
}) {
  const isSingleQuestion = questionCount === 1;

  const basePrompt = `You are an AI interview question generator. Generate interview questions that are realistic, contextual, and aligned with the target role, company context, job description, interview type, and difficulty level.

Return JSON only, without markdown, explanation, or extra text.
The JSON output must strictly follow this schema:
{
  "questions": [
    {
      "id": number,
      "question": "string",
      "category": "string",
      "expectedFocus": "string"
    }
  ]
}

Rules:
- Generate exactly ${questionCount} questions.
- Questions must be written in Indonesian
- Avoid generic questions when job description provides specific context.
- For HR / Behavioral interviews, focus on motivation, experience, teamwork, conflict, leadership, and career goals.
- For Technical interviews, focus on role-relevant technical skills, project experience, tools, and problem solving.
- For Mixed/General interviews, combine behavioral and technical questions.
- Adjust complexity based on difficulty level (${difficulty}).
- Do not fabricate specific company facts unless supported by provided links or search context.`;

  const singleQuestionModifier = isSingleQuestion
    ? `\nSINGLE QUESTION FOCUS:
- Since you are generating exactly 1 question, it must be the single most relevant and insightful question for this interview.
- Prioritize depth and specificity over breadth. The question should directly probe the most critical competency, experience, or skill gap for the target role.
- Make it count — avoid broad or generic questions.`
    : "";

  if (cvAvailable && cvContext) {
    // Tier 1: CV is available — use it as primary reference
    let cvSection = basePrompt +
      singleQuestionModifier +
      `

REQUIRED CV REFERENCES:
- At least ONE question must directly reference a specific skill, project, technology, or experience mentioned in the candidate's CV.
- Example format: "Tell me about the [specific project name] you built using [specific technology]" or "I see you have experience with [X], can you explain..."
- Use exact terminology, project names, and skill names from the CV when formulating these specific questions.

REQUIRED SELF-DESCRIPTION REFERENCES (if available):
${selfDescription ? "- If the candidate provided a self-description, at least ONE question must combine and reference BOTH their CV experience AND their self-described goals, strengths, or motivations.\n- Example: \"In your self-description you mentioned wanting to grow as a [role], and your CV shows experience with [X]. How does this align?\"\n- This question can overlap with the CV-specific question if both are available." : "- Not applicable (no self-description provided)."}

${isSingleQuestion
  ? `SINGLE-QUESTION CV REQUIREMENT:
- The single question MUST reference the most relevant project, skill, or experience from the CV that aligns with the target role.
- If a job description or focus is provided, pick the CV element most relevant to that focus.`
  : `QUESTION VARIETY:
- When multiple questions are generated, distribute them across: CV-specific (1+), role/company-specific, and behavioral questions.`
}`;

    return cvSection;
  }

  if (selfDescription) {
    // Tier 2: No CV, but self-description is available — use it as primary reference
    return basePrompt +
      singleQuestionModifier +
      `

NOTE: CV context is not available, but the candidate provided a self-description.
- At least ONE question must reference the candidate's self-described goals, strengths, motivations, or background from their self-description.
- Example format: "You mentioned you are passionate about [topic]. Can you elaborate on what drives that interest?" or "In your self-description you highlighted [skill]. How did you develop that?"
- Do NOT mention or reference CV-specific projects or technologies — only use the self-description.

${isSingleQuestion
  ? `SINGLE-QUESTION SELF-DESCRIPTION REQUIREMENT:
- The single question MUST reference the most relevant goal, strength, or motivation from the self-description that aligns with the target role.`
  : `QUESTION VARIETY:
- When multiple questions are generated, distribute them across: self-description-referenced (1+), role/company-specific, and behavioral questions.`
}`;
  }

  // Tier 3: No CV, no self-description — role-general questions
  return basePrompt +
    singleQuestionModifier +
    `

NOTE: CV context and self-description are not available. Do NOT require or mention any candidate-specific information.
- Questions should be based purely on the target position, company, interview type, and difficulty level.
- Focus on role-general competencies and relevant domain knowledge.
- Ensure all questions are answerable without any prior candidate information.

${isSingleQuestion
  ? `SINGLE-QUESTION FOCUS:
- The single question should target the most critical competency or skill gap for the target position.`
  : ""
}`;
}

/**
 * Build the user prompt adaptively based on what context is available.
 */
function buildUserPrompt({
  position,
  company,
  interviewType,
  difficulty,
  description,
  questionCount,
  cvAvailable,
  cvContext,
  selfDescription,
  linksContext,
  searchContext,
}) {
  const isSingleQuestion = questionCount === 1;

  // Determine reference type label
  let referenceInstructions;
  if (cvAvailable) {
    referenceInstructions = `Review the CV context carefully and identify key projects, technologies, and experiences.
2. At least one question MUST directly mention or reference specific content from the CV (e.g., "Tell me about your experience building the X project").
3. Use the exact names of projects, technologies, and skills as they appear in the CV.
4. Make questions feel personalized - the candidate should feel you actually read their CV.`;
    if (selfDescription) {
      referenceInstructions += `\n5. Since a self-description was provided, at least one question must connect their CV experience with their stated goals/motivations from the self-description.`;
    }
  } else if (selfDescription) {
    referenceInstructions = `Review the candidate's self-description carefully.
2. At least one question MUST reference the candidate's self-described goals, strengths, motivations, or background.
3. Example: "You mentioned you are passionate about [topic]..." or "In your self-description you highlighted [skill]..."
4. Do NOT mention or reference CV-specific information — only use the self-description.`;
  } else {
    referenceInstructions = `CV context and self-description are not available. Do NOT mention or reference any candidate-specific information.
2. Generate questions based solely on the target position, company, interview type, and difficulty level.
3. Focus on role-relevant topics and general competency areas.
4. Ensure all questions are answerable without any prior candidate information.`;
  }

  // Single question focus modifier
  const singleQuestionInstr = isSingleQuestion
    ? `\n${questionCount}. Since only 1 question is being generated, it must directly address the most relevant aspect of this interview.
${description ? `   Use the job description/focus as the primary guide: "${description}"` : `   Focus on the single most critical competency for a ${position} role.`}`
    : "";

  return `Please generate ${questionCount} interview questions for the following scenario:

Target Position: ${position}
Company/Organization: ${company || "Not specified"}
Interview Type: ${interviewType}
Difficulty Level: ${difficulty}
Job Description / Focus: ${description}

=== CANDIDATE CV CONTEXT ===
${cvContext || "CV information is not available. Generate questions based on the other contexts provided."}

=== CANDIDATE SELF-DESCRIPTION ===
${selfDescription || "No self-description provided."}

=== PROVIDED LINKS CONTEXT ===
${linksContext || "No provided links context."}

=== WEB SEARCH (TAVILY) CONTEXT ===
${searchContext || "No web search context."}

INSTRUCTIONS FOR QUESTION GENERATION:
1. ${referenceInstructions}${singleQuestionInstr}`;
}

/**
 * Generate questions with a retry fallback if the count doesn't match.
 */
async function generateQuestionsWithFallback(prompt, systemPrompt, expectedCount) {
  // First attempt
  let result = await generateQuestions(prompt, systemPrompt);
  let questions = result?.questions || [];

  if (questions.length >= expectedCount) {
    // Success — trim to exact count if over
    return { questions: questions.slice(0, expectedCount) };
  }

  console.warn(
    `[questionGeneration] First attempt returned ${questions.length}/${expectedCount} questions. Retrying with simplified prompt...`
  );

  // Second attempt: strip all CV/self-desc directives to maximize yield
  const fallbackSystemPrompt = `You are an AI interview question generator. Generate exactly ${expectedCount} interview questions based on the target role, company, interview type, and difficulty level provided.

Return JSON only, without markdown, explanation, or extra text.
The JSON output must strictly follow this schema:
{
  "questions": [
    {
      "id": number,
      "question": "string",
      "category": "string",
      "expectedFocus": "string"
    }
  ]
}

CRITICAL: You MUST generate exactly ${expectedCount} questions. No more, no less. If you cannot find enough context, still generate general questions. Never return fewer than ${expectedCount}.`;

  const fallbackPrompt = `Generate exactly ${expectedCount} interview questions for this scenario. DO NOT return fewer questions.

Position: ${prompt.match(/Target Position: (.+)/)?.[1] || "Unknown"}
Company: ${prompt.match(/Company\/Organization: (.+)/)?.[1] || "Not specified"}
Interview Type: ${prompt.match(/Interview Type: (.+)/)?.[1] || "General"}
Difficulty: ${prompt.match(/Difficulty Level: (.+)/)?.[1] || "Medium"}
Description: ${prompt.match(/Job Description \/ Focus: (.+)/)?.[1] || ""}

Generate questions based on the position and interview type. If you have to repeat a category or make some questions slightly simpler, that is acceptable. What matters is returning exactly ${expectedCount} questions.`;

  result = await generateQuestions(fallbackPrompt, fallbackSystemPrompt);
  questions = result?.questions || [];

  if (questions.length < expectedCount) {
    console.error(
      `[questionGeneration] Retry also returned insufficient questions (${questions.length}/${expectedCount}). Accepting what we got.`
    );
  }

  return { questions: questions.slice(0, expectedCount) };
}