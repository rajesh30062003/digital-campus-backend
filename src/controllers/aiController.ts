import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// Initialize Gemini client lazily to avoid startup crashes if key is temporarily missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ── 1. AI CHATBOT ─────────────────────────────────────────────────────────────
export const chatWithAi = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    throw new AppError("Message is required", 400);
  }

  const ai = getAiClient();
  const systemInstruction = `
    You are the "Digital Campus AI Assistant", a smart and helpful ERP guide.
    Help students, faculty, and admins navigate the campus.
    Give professional, elegant answers.
    Support formatting in Markdown.
  `;

  const chat = ai.chats.create({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction,
    },
  });

  // Re-hydrate simple history if passed
  if (history && Array.isArray(history)) {
    // Optional: add to chat history if needed, otherwise send simple structured prompt
  }

  const response = await chat.sendMessage({ message });
  res.json({
    success: true,
    reply: response.text,
  });
});

// ── 2. AI ADMISSION ASSISTANT ────────────────────────────────────────────────
export const analyzeAdmissionChance = asyncHandler(async (req: Request, res: Response) => {
  const { studentGpa, testScore, extraCurriculars, department } = req.body;
  if (!studentGpa || !testScore) {
    throw new AppError("Student GPA and test scores are required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Analyze admission eligibility and chance of acceptance for an applicant applying to the "${department || "General Sciences"}" department.
    Details:
    - High School GPA: ${studentGpa}/4.0
    - Standardized test score (SAT/ACT/MCAT etc.): ${testScore}
    - Extra-curricular activities: ${extraCurriculars || "None provided"}
    
    Provide the response in structured JSON with:
    1. "chancePercentage" (a number between 0 and 100)
    2. "verdict" (string, e.g. Highly Likely, Competitive, Unlikely)
    3. "strengths" (array of strings)
    4. "gaps" (array of strings)
    5. "draftResponse" (a professional, polite letter draft to the applicant indicating their current status or requesting further documents)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 3. AI TIMETABLE GENERATOR ───────────────────────────────────────────────
export const generateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { courses, faculty, slots, rooms } = req.body;
  if (!courses || !faculty) {
    throw new AppError("Courses and faculty lists are required to generate a timetable", 400);
  }

  const ai = getAiClient();
  const prompt = `
    You are an expert university registrar scheduler. Optimize class scheduling and prevent room/faculty double-booking conflicts.
    Input parameters:
    - Courses to schedule: ${JSON.stringify(courses)}
    - Faculty available: ${JSON.stringify(faculty)}
    - Target daily slots: ${JSON.stringify(slots || ["09:00 - 10:30", "11:00 - 12:30", "14:00 - 15:30"])}
    - Rooms available: ${JSON.stringify(rooms || ["Room 101", "Lab A", "Lecture Hall 3"])}

    Generate a complete conflict-free weekly timetable (Monday through Friday).
    Return the schedule in structured JSON format as an object with:
    - "schedule": array of objects, where each object has: { "day", "slot", "course", "faculty", "room" }
    - "optimizationsExplanation": string explaining how conflicts were resolved.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 4. AI NOTICE GENERATOR ──────────────────────────────────────────────────
export const generateNoticeDraft = asyncHandler(async (req: Request, res: Response) => {
  const { topic, keyPoints, tone, audience } = req.body;
  if (!topic) {
    throw new AppError("Topic is required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Draft an official institutional announcement/notice.
    Topic: ${topic}
    Key Points to cover: ${keyPoints || "Standard generic notice announcement"}
    Tone: ${tone || "Professional and Authoritative"}
    Target Audience: ${audience || "all students and faculty"}

    Return a JSON object containing:
    1. "subject" (A strong, catchy heading)
    2. "body" (Formatting supported with lists/sections in markdown)
    3. "tags" (Array of relevant department tags, e.g., ["Academics", "Urgent"])
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 5. AI QUESTION PAPER GENERATOR ──────────────────────────────────────────
export const generateQuestionPaper = asyncHandler(async (req: Request, res: Response) => {
  const { subject, topic, difficulty, count } = req.body;
  if (!subject || !topic) {
    throw new AppError("Subject and topic are required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Create an academic question paper or quiz.
    Subject: ${subject}
    Topic: ${topic}
    Difficulty level: ${difficulty || "Medium"}
    Number of questions: ${count || 5}

    Return a JSON object containing:
    - "title": Title of the exam
    - "instructions": Standard exam guidelines
    - "questions": An array of objects. Each object should have:
       - "id": number
       - "questionText": string
       - "options": (Optional, array of 4 choices if multiple choice, else null)
       - "correctAnswer": string (Correct choice index, or model answer if essay)
       - "marks": number (weightage, e.g. 5, 10)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 6. AI RESULT ANALYTICS & STUDENT PERFORMANCE PREDICTION ──────────────────
export const analyzeResultsAndPredict = asyncHandler(async (req: Request, res: Response) => {
  const { studentMarks } = req.body; // Array of { course: string, midTerm: number, finalExam: number, attendance: number }
  if (!studentMarks || !Array.isArray(studentMarks) || studentMarks.length === 0) {
    throw new AppError("Student marks array is required for predictive analytics", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Analyze the academic marks of a student and predict their future performance & risks.
    Marks Data:
    ${JSON.stringify(studentMarks)}

    Provide a professional prediction.
    Return JSON with:
    - "gpaEstimate": predicted GPA (out of 4.0)
    - "riskAssessment": string ("Low", "Medium", "High")
    - "riskExplanation": explanation of risks (e.g. low attendance, failing marks)
    - "recommendations": array of actionable study recommendations
    - "strengths": array of courses where student excels
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 7. AI FACULTY ANALYTICS ──────────────────────────────────────────────────
export const analyzeFacultyMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { workloadHours, researchPapers, studentFeedbacks } = req.body;

  const ai = getAiClient();
  const prompt = `
    Evaluate faculty member workload, research index, and student sentiment.
    Inputs:
    - Weekly classroom hours: ${workloadHours || 12} hours
    - Research publications: ${JSON.stringify(researchPapers || [])}
    - Student text feedbacks: ${JSON.stringify(studentFeedbacks || [])}

    Return JSON with:
    - "overallRating": Score from 1 to 10
    - "sentimentAnalysis": "Positive", "Neutral", "Constructive"
    - "workloadVerdict": "Balanced", "Overworked", "Underutilized"
    - "insights": array of improvement tips
    - "achievements": array of strengths based on research
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 8. AI ATTENDANCE INSIGHTS ───────────────────────────────────────────────
export const analyzeAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentName, attendanceRecord } = req.body; // attendanceRecord is an array of dates & present status

  const ai = getAiClient();
  const prompt = `
    Check attendance record of student "${studentName || "Anonymous Student"}".
    Record: ${JSON.stringify(attendanceRecord || [])}

    Determine:
    1. Overall attendance percentage
    2. Attendance trend (stable, declining, rising)
    3. If attendance is under 75% threshold, draft an email notice warning to the student/parent.
    
    Return JSON with:
    - "percentage": number
    - "isBelowThreshold": boolean
    - "trend": string
    - "draftWarningEmail": string (or null if above 75%)
    - "insights": array of suggestions
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 9. AI RESEARCH ASSISTANT ────────────────────────────────────────────────
export const researchAssist = asyncHandler(async (req: Request, res: Response) => {
  const { topic, draftAbstract } = req.body;
  if (!topic) {
    throw new AppError("Research topic is required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    You are a professional peer-review academic research assistant.
    Topic: "${topic}"
    User Draft: "${draftAbstract || ""}"

    Draft a high-quality, polished academic abstract. Also search/recommend standard literature citations and structure ideas.
    Return JSON with:
    - "academicAbstract": refined text
    - "recommendedMethodology": string
    - "suggestedCitations": array of mock or standard paper titles and authors
    - "noveltyTriggers": array of points showing how to make the paper more novel
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 10. AI OCR & DOCUMENT GENERATOR ─────────────────────────────────────────
export const simulateOcrAndGenerateReport = asyncHandler(async (req: Request, res: Response) => {
  const { documentBase64, docType } = req.body;
  if (!documentBase64) {
    throw new AppError("Base64 document image data is required", 400);
  }

  const ai = getAiClient();
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: documentBase64.split(",")[1] || documentBase64,
    },
  };

  const promptPart = {
    text: `
      You are an expert Document OCR Scanner.
      Identify the document type ("${docType || "Academic Report or Certificate"}") and extract all key-value parameters.
      Return the output as a JSON object with:
      - "extractedData": object of extracted key-values (e.g. { "Name": "...", "Registration": "..." })
      - "confidenceScore": number (0-100)
      - "formattedMarkdownReport": A beautifully styled Academic PDF-ready summary report based on the extracted fields.
    `,
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: { parts: [imagePart, promptPart] },
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 11. AI TRANSLATION ─────────────────────────────────────────────────────
export const translateContent = asyncHandler(async (req: Request, res: Response) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    throw new AppError("Text and targetLanguage are required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Translate the following academic text into "${targetLanguage}". Keep terms accurate for educational setups.
    Text:
    "${text}"

    Return JSON with:
    - "translatedText": string
    - "pronunciationHint": string
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 12. AI VOICE ASSISTANT (TTS USING @google/genai) ────────────────────────
export const generateVoiceResponse = asyncHandler(async (req: Request, res: Response) => {
  const { text, voice } = req.body;
  if (!text) {
    throw new AppError("Text is required for vocal synthesis", 400);
  }

  const ai = getAiClient();
  // Using the requested speech synthesis model: gemini-3.1-flash-tts-preview
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice || "Kore" }, // Prebuilt voices: Puck, Charon, Kore, Fenrir, Zephyr
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new AppError("Failed to generate voice response from TTS engine", 500);
  }

  res.json({
    success: true,
    audioBase64: base64Audio,
  });
});

// ── 13. AI SMART SEARCH ─────────────────────────────────────────────────────
export const smartSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query, searchScope } = req.body; // SearchScope can be "All", "Library", "Notices", "Students"
  if (!query) {
    throw new AppError("Query string is required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    A user is running a smart semantic search on a campus database ERP.
    Query: "${query}"
    Scope: "${searchScope || "All"}"

    Parse the query and identify the user's search intent, keywords, synonyms, and formulate optimized Mongo search queries and category suggestions.
    Return JSON with:
    - "parsedIntent": string
    - "keywords": array of strings
    - "suggestedFilters": object with properties like "role", "category", "dateRange"
    - "semanticSynonyms": array of strings
    - "clarificationQuestion": string (or null if clear)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});

// ── 14. AI WORKFLOW AUTOMATION ─────────────────────────────────────────────
export const createAutomatedWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { triggerEvent, actionType, conditions } = req.body;
  if (!triggerEvent || !actionType) {
    throw new AppError("Trigger event and action type are required", 400);
  }

  const ai = getAiClient();
  const prompt = `
    Design an ERP automated workflow trigger.
    Trigger Event: "${triggerEvent}" (e.g. Attendance drops below 75%, Marks published)
    Action Type: "${actionType}" (e.g. Notify parents, Draft Warning Email, Log to compliance board)
    Conditions: "${conditions || "None"}"

    Generate an automated trigger config in JSON with:
    - "workflowName": string
    - "triggerHook": string
    - "conditionsEvaluatorJS": A mock JavaScript function body that evaluates these conditions
    - "scheduledCronExpr": (Optional, e.g. "0 9 * * 1" for Mondays)
    - "notifPayload": object with message draft, SMS draft, and email subject
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  res.json({
    success: true,
    data: JSON.parse(response.text?.trim() || "{}"),
  });
});
