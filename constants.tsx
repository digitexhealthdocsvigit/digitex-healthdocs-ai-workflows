
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
Your role is strictly limited to: Editing, Cleaning, Structuring, Formatting.
You MUST NOT: Invent medical facts, Guess unclear audio, Add new diagnoses, Change clinical meaning.
All outputs will be manually reviewed by a human before submission. You must flag uncertainties clearly.
Medical accuracy and compliance are the top priority.
${BRAND_CONTEXT}
`;

export const PROMPTS: Record<PromptType, PromptDefinition> = {
  [PromptType.CLEANUP]: {
    id: PromptType.CLEANUP,
    label: 'Transcription Cleanup',
    description: 'Clean raw Whisper/Audio drafts. Fixes grammar and punctuation.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Clean and professionally edit the following medical transcription draft. Correct grammar, expand standard abbreviations ONLY when obvious, preserve meaning. If unclear, mark as [UNSURE - VERIFY FROM AUDIO].`
  },
  [PromptType.STRUCTURED_REPORT]: {
    id: PromptType.STRUCTURED_REPORT,
    label: 'Structured Formatting',
    description: 'Format cleaned text into clinical sections (Chief Complaint, HPI, etc.)',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Format the following into a clinical document using standard headings: Patient Details, Chief Complaint, HPI, Past Medical History, Medications, Allergies, Physical Exam, Investigations, Assessment/Diagnosis, Plan, Follow-up.`
  },
  [PromptType.ERROR_FLAGGING]: {
    id: PromptType.ERROR_FLAGGING,
    label: 'Error & Risk Flagging',
    description: 'Identify potential drug misspellings or dosage concerns for human check.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Review for errors: 1. Drug misspellings 2. Dosage verification 3. Clinically sensitive statements 4. Ambiguous phrases. Format as: Item, Reason for Concern, Suggested Action.`
  },
  [PromptType.DISCHARGE_SUMMARY]: {
    id: PromptType.DISCHARGE_SUMMARY,
    label: 'Discharge Summary',
    description: 'Convert dictations into standard hospital discharge formats.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Convert to Discharge Summary. Required structure: Patient Identification, Admission/Discharge Dates, Diagnosis, Hospital Course, Procedures, Medications, Advice, Follow-up.`
  },
  [PromptType.OPD_NOTE]: {
    id: PromptType.OPD_NOTE,
    label: 'OPD / Clinic Note',
    description: 'Concise clinic visit formatting.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Convert into clear OPD/Clinic Visit Note: Visit Date, Chief Complaint, Examination Findings, Assessment, Treatment, Advice.`
  },
  [PromptType.RADIOLOGY_REPORT]: {
    id: PromptType.RADIOLOGY_REPORT,
    label: 'Radiology Cleanup',
    description: 'Specialized radiology dictation formatting.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Clean radiology dictation using headings: Examination, Technique, Findings, Impression. Flag unclear anatomical terms.`
  },
  [PromptType.FINAL_VERSION]: {
    id: PromptType.FINAL_VERSION,
    label: 'Final Submission Ready',
    description: 'Last step cleanup for professional submission.',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    userPrompt: `Prepare for final submission. Ensure professional tone, consistent tense. Do not remove [UNSURE] flags. No emojis, markdown commentary.`
  }
};
