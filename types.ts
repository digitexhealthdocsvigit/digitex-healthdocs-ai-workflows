
export enum PromptType {
  CLEANUP = 'CLEANUP',
  STRUCTURED_REPORT = 'STRUCTURED_REPORT',
  ERROR_FLAGGING = 'ERROR_FLAGGING',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  OPD_NOTE = 'OPD_NOTE',
  RADIOLOGY_REPORT = 'RADIOLOGY_REPORT',
  FINAL_VERSION = 'FINAL_VERSION'
}

export interface PromptDefinition {
  id: PromptType;
  label: string;
  description: string;
  systemInstruction: string;
  userPrompt: string;
}

export interface TranscriptionRecord {
  id: string;
  timestamp: number;
  rawText: string;
  processedText: string;
  editedText: string;
  type: PromptType;
}
