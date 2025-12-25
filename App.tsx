
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PromptType, PromptDefinition } from './types';
import { PROMPTS, BRAND_CONTEXT } from './constants';
import { geminiService } from './geminiService';

// --- Helper Components ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Digitex HealthDocs</h1>
        <p className="text-xs text-indigo-600 font-medium uppercase tracking-widest">Medical Transcription AI</p>
      </div>
    </div>
    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Live: Internal Workspace
      </span>
      <span className="border-l border-slate-300 pl-4">v1.2.0</span>
    </div>
  </header>
);

const Sidebar: React.FC<{
  selected: PromptType;
  onSelect: (type: PromptType) => void;
  isProcessing: boolean;
}> = ({ selected, onSelect, isProcessing }) => (
  <aside className="w-full lg:w-72 flex flex-col gap-6 p-6 bg-slate-50 border-r border-slate-200 lg:h-[calc(100vh-80px)] overflow-y-auto">
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Transcription Tools</h3>
      <div className="grid grid-cols-1 gap-2">
        {Object.values(PROMPTS).map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.id)}
            disabled={isProcessing}
            className={`text-left p-3 rounded-xl transition-all border flex flex-col gap-1 ${
              selected === prompt.id
                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500'
                : 'bg-transparent border-transparent hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className={`text-sm font-semibold ${selected === prompt.id ? 'text-indigo-700' : 'text-slate-800'}`}>
              {prompt.label}
            </span>
            <span className="text-[11px] leading-tight text-slate-500 line-clamp-2">
              {prompt.description}
            </span>
          </button>
        ))}
      </div>
    </div>

    <div className="mt-auto p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
      <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Compliance Guard
      </h4>
      <p className="text-[10px] text-indigo-700 leading-relaxed mb-3">
        Human review is mandatory. All AI outputs must be verified against original audio before submission.
      </p>
      <div className="flex flex-col gap-1.5 opacity-60">
        <span className="text-[9px] font-mono text-indigo-800">GST: 27AAAPP9753F2ZF</span>
        <span className="text-[9px] font-mono text-indigo-800">IEC: AAAPP9753F</span>
      </div>
    </div>
  </aside>
);

// --- Main Application ---

export default function App() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>(PromptType.CLEANUP);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const processTranscription = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setOutputText('');

    try {
      const promptDef = PROMPTS[selectedPrompt];
      const stream = geminiService.streamTranscription(promptDef, inputText);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setOutputText(fullText);
      }
    } catch (error) {
      console.error("Transcription failed:", error);
      setOutputText("Error: Failed to process transcription. Please check your API key and network.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row h-full">
        <Sidebar 
          selected={selectedPrompt} 
          onSelect={setSelectedPrompt} 
          isProcessing={isProcessing} 
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Bar */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                1
              </span>
              <h2 className="text-sm font-semibold text-slate-700">Medical Workspace</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Clear All
              </button>
              <button
                disabled={isProcessing || !inputText.trim()}
                onClick={processTranscription}
                className={`px-6 py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                  isProcessing || !inputText.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run AI Workflow
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
            {/* Input Section */}
            <div className="flex flex-col gap-3 group">
              <div className="flex items-center justify-between px-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  Input Transcript
                </label>
                <button 
                  onClick={() => copyToClipboard(inputText, 'input')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copyStatus === 'input' ? 'Copied!' : 'Copy Input'}
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste raw Whisper draft or medical text here..."
                className="flex-1 p-6 text-sm font-normal text-slate-800 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Output Section */}
            <div className="flex flex-col gap-3 group relative">
              <div className="flex items-center justify-between px-2">
                <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  AI Processed Result
                </label>
                <button 
                  onClick={() => copyToClipboard(outputText, 'output')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   {copyStatus === 'output' ? 'Copied!' : 'Copy Result'}
                </button>
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 p-6 overflow-auto bg-slate-50/50">
                  {outputText ? (
                    <div className="prose prose-sm max-w-none prose-slate">
                      {outputText.split('\n').map((line, i) => (
                        <p key={i} className={`mb-2 leading-relaxed ${line.includes('[UNSURE') ? 'text-red-600 font-semibold bg-red-50 p-1 rounded' : 'text-slate-800'}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-xs font-medium uppercase tracking-widest text-center">
                        Select a tool and press Run Workflow<br/>to generate AI results.
                      </p>
                    </div>
                  )}
                </div>
                {outputText && (
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Ready for Human Verification</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(outputText, 'output')}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Copy Final Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-slate-900 text-slate-400 py-3 px-6 text-[10px] font-medium flex justify-between items-center border-t border-slate-800 sticky bottom-0 z-50">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="text-slate-600 font-bold uppercase tracking-widest">Operator:</span>
            Internal Reviewer
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-600 font-bold uppercase tracking-widest">Division:</span>
            Digitex HealthDocs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Digitex Studio</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-500 border border-slate-700">Strictly Confidential</span>
        </div>
      </footer>
    </div>
  );
}
