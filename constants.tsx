
import { PromptType, PromptDefinition } from './types';

export const BRAND_CONTEXT = `
Division Name: Digitex HealthDocs
Parent Company: Digitex Studio
GST: 27AAAPP9753F2ZF
IEC: AAAPP9753F
Operational Email: digitex.healthdocs@gmail.com
Usage Type: Internal, personal, freelance medical transcription assistance
Compliance: Human-review mandatory, no auto-submission
`;

export const MASTER_SYSTEM_PROMPT = `
You are an AI Medical Transcription Editor working for Digitex HealthDocs, a division of Digitex Studio (India).

Your role is strictly limited to:
• Editing
• Cleaning
• Structuring
• Formatting

You MUST NOT:
• Invent medical facts
• Guess unclear audio
• Add new diagnoses
• Change clinical meaning

All outputs will be manually reviewed by a human before submission to clients or platforms.
You must flag uncertainties clearly.
Medical accuracy and compliance are the top priority.

${BRAND_CONTEXT}
`;

export const PROMPTS: Record<PromptType, PromptDefinition> = {
  [PromptType.CLEANUP]: {
    id: PromptType.CLEANUP,
    label: '1. Core Cleanup',
    description: 'Clean and professionally edit the raw medical transcription draft.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Clean and professionally edit the following raw medical transcription draft.

Instructions:
• Correct grammar, punctuation, and sentence flow
• Expand common medical abbreviations ONLY when obvious
• Preserve the original clinical meaning exactly
• Do NOT add new information
• Do NOT interpret or infer missing details
• Keep all measurements, dosages, and timelines unchanged

If any word, drug name, dosage, or sentence is unclear, mark it clearly as:
[UNSURE – VERIFY FROM AUDIO]

Context:
This transcription is processed internally by Digitex HealthDocs (digitex.healthdocs@gmail.com) and will be manually reviewed before final use.`
  },
  [PromptType.STRUCTURED_REPORT]: {
    id: PromptType.STRUCTURED_REPORT,
    label: '2. Structured Report',
    description: 'Format cleaned text into a professional clinical document using clear headings.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Format the following cleaned medical transcription into a professional clinical document using clear headings.

Use ONLY relevant headings from the list below (do not invent new sections):
• Patient Details
• Chief Complaint
• History of Present Illness
• Past Medical History
• Medications
• Allergies
• Physical Examination
• Investigations
• Assessment / Diagnosis
• Treatment / Plan
• Follow-up Instructions

Rules:
• Maintain original wording wherever possible
• Do not modify medical intent
• If a section has no data, omit it
• Keep formatting simple and professional`
  },
  [PromptType.ERROR_FLAGGING]: {
    id: PromptType.ERROR_FLAGGING,
    label: '3. Risk Analysis',
    description: 'Identify items that require human verification (drug names, dosages).',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-pro-preview',
    userPrompt: `Review the following medical transcription and identify:
1. Possible drug names that may be misspelled
2. Dosages or units that require verification
3. Any clinically sensitive statements
4. Any unclear or ambiguous phrases

Do NOT correct automatically.
Only list items that need HUMAN verification.

Format your output as:
• Item
• Reason for concern
• Suggested action (e.g., recheck audio)`
  },
  [PromptType.DISCHARGE_SUMMARY]: {
    id: PromptType.DISCHARGE_SUMMARY,
    label: '4. Discharge Summary',
    description: 'Convert medical transcription into a standard hospital discharge summary.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Convert the following medical transcription into a standard hospital discharge summary.

Required structure:
• Patient Identification
• Admission Date
• Discharge Date
• Diagnosis
• Hospital Course
• Procedures (if any)
• Medications on Discharge
• Discharge Advice
• Follow-up Plan

Rules:
• Do not add missing data
• Leave blank sections if not mentioned
• Preserve original clinical statements`
  },
  [PromptType.OPD_NOTE]: {
    id: PromptType.OPD_NOTE,
    label: '5. OPD/Clinic Note',
    description: 'Convert transcription into a clear OPD / Clinic Visit Note.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Convert the following transcription into a clear OPD / Clinic Visit Note.

Use this structure:
• Visit Date
• Chief Complaint
• Examination Findings
• Assessment
• Treatment Given
• Advice / Follow-up

Rules:
• Keep language concise
• No interpretation or diagnosis changes
• Highlight unclear items for review`
  },
  [PromptType.RADIOLOGY_REPORT]: {
    id: PromptType.RADIOLOGY_REPORT,
    label: '6. Radiology Report',
    description: 'Clean and format radiology dictations into professional reports.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Clean and format the following radiology dictation into a professional radiology report.

Use headings:
• Examination
• Technique
• Findings
• Impression

Rules:
• Preserve radiologist’s wording
• Do NOT re-interpret findings
• Flag unclear anatomical terms`
  },
  [PromptType.FINAL_VERSION]: {
    id: PromptType.FINAL_VERSION,
    label: '7. Final Polish',
    description: 'Final draft preparation for manual human review.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview',
    userPrompt: `Prepare the following medical document for final human proofreading and submission.

Instructions:
• Ensure professional tone
• Ensure consistency in tense and formatting
• Do not remove [UNSURE – VERIFY] flags
• No emojis, no markdown, no commentary`
  }
};
