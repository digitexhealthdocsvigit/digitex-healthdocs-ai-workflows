
import React, { useState, useEffect } from 'react';
import { PromptType } from './types';
import { PROMPTS } from './constants';
import { geminiService } from './geminiService';

const App: React.FC = () => {
  // Load initial state from LocalStorage
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>(() => {
    const saved = localStorage.getItem('hd_selected_prompt');
    return (saved as PromptType) || PromptType.CLEANUP;
  });
  
  const [inputText, setInputText] = useState(() => localStorage.getItem('hd_input_text') || '');
  const [outputText, setOutputText] = useState(() => localStorage.getItem('hd_output_text') || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(() => localStorage.getItem('hd_is_verified') === 'true');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'large' | 'xl'>(() => 
    (localStorage.getItem('hd_zoom_level') as 'normal' | 'large' | 'xl') || 'normal'
  );
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('hd_dark_mode') === 'true');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('hd_selected_prompt', selectedPrompt);
    localStorage.setItem('hd_input_text', inputText);
    localStorage.setItem('hd_output_text', outputText);
    localStorage.setItem('hd_is_verified', String(isVerified));
    localStorage.setItem('hd_zoom_level', zoomLevel);
    localStorage.setItem('hd_dark_mode', String(isDarkMode));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [selectedPrompt, inputText, outputText, isVerified, zoomLevel, isDarkMode]);

  // Reset verification when output changes manually
  useEffect(() => {
    if (!isProcessing) setIsVerified(false);
  }, [outputText, selectedPrompt]);

  const runWorkflow = async () => {
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
      setOutputText("ERROR: Transcription service failed. Ensure API key is valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pushToNext = () => {
    if (!outputText || !isVerified) {
      alert("Compliance Warning: Mandatory Human Review required before proceeding.");
      return;
    }
    const currentOrder = Object.keys(PROMPTS) as PromptType[];
    const currentIndex = currentOrder.indexOf(selectedPrompt);
    const nextPromptKey = currentOrder[currentIndex + 1];
    
    if (nextPromptKey) {
      setInputText(outputText);
      setOutputText('');
      setSelectedPrompt(nextPromptKey);
      setIsVerified(false);
    } else {
      alert("Workflow Complete.");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (label === 'output' && !isVerified) {
      alert("Compliance Warning: You must mark this clinical draft as 'Verified' before copying.");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getFontSizeClass = () => {
    switch(zoomLevel) {
      case 'large': return 'text-[18px]';
      case 'xl': return 'text-[20px]';
      default: return 'text-[16px]';
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-inter transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/20`}>
      {/* Top Header */}
      <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 shadow-sm z-10 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-xl">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current"><path d="M19,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.11,21 21,20.1 21,19V5C21,3.9 20.11,3 19,3M19,19H5V5H19V19M11,7H13V11H17V13H13V17H11V13H7V11H11V7Z"/></svg>
          </div>
          <div>
            <h1 className={`text-lg font-bold tracking-tight leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Digitex HealthDocs</h1>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">Clinical Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Zoom Controls */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {(['normal', 'large', 'xl'] as const).map(level => (
              <button 
                key={level}
                onClick={() => setZoomLevel(level)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${zoomLevel === level ? (isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Workflow Sidebar */}
        <aside className={`w-72 border-r flex flex-col p-6 shrink-0 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]'}`}>
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-5">Workflow Pipeline</h3>
          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {Object.values(PROMPTS).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPrompt(p.id)}
                disabled={isProcessing}
                className={`group text-left px-5 py-4 rounded-2xl transition-all border ${
                  selectedPrompt === p.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 text-slate-300' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-600')
                }`}
              >
                <div className={`text-sm font-bold mb-1 ${selectedPrompt === p.id ? 'text-white' : (isDarkMode ? 'text-slate-100' : 'text-slate-900')}`}>
                  {p.label}
                </div>
                <div className={`text-[11px] leading-snug line-clamp-2 font-medium ${selectedPrompt === p.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {p.description}
                </div>
              </button>
            ))}
          </nav>

          <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
             <div className={`${isDarkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-900'} rounded-3xl p-5 shadow-2xl`}>
                <p className="text-[9px] text-slate-500 font-black uppercase mb-3 tracking-widest">Inference Engine</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold">GEMINI AI</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter ${isDarkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-white bg-indigo-500/20 border border-indigo-500/30'}`}>
                    {PROMPTS[selectedPrompt].model.split('-')[2]}
                  </span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-800'}`}>
                  <div className={`h-full bg-indigo-500 transition-all duration-700 ${isProcessing ? 'w-full animate-[shimmer_1.5s_infinite]' : 'w-0'}`}></div>
                </div>
             </div>
          </div>
        </aside>

        {/* Workspace */}
        <main className={`flex-1 flex flex-col relative overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {/* Main Action Bar */}
          <div className={`h-16 border-b px-8 flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-[11px] font-black rounded-lg uppercase border tracking-[0.1em] ${isDarkMode ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                Workflow Stage {Object.keys(PROMPTS).indexOf(selectedPrompt) + 1}
              </span>
              <h2 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{PROMPTS[selectedPrompt].label.split('. ')[1]}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { if(confirm("Clear current work?")) { setInputText(''); setOutputText(''); setIsVerified(false); }}}
                className="text-[11px] font-black text-slate-500 hover:text-red-500 px-4 py-2 transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
              <button
                onClick={runWorkflow}
                disabled={isProcessing || !inputText.trim()}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                  isProcessing || !inputText.trim()
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-500/20'
                }`}
              >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Running...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Run Workflow</>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 p-8 grid grid-cols-[minmax(0,45fr)_minmax(0,55fr)] gap-8 overflow-hidden">
            
            {/* Input Panel */}
            <div className="flex flex-col gap-4 group h-full overflow-hidden">
              <div className="flex items-center justify-between px-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Source Dictation
                </label>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>CHARS: {inputText.length}</div>
              </div>
              <div className={`flex-1 border rounded-[2rem] shadow-sm relative overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 focus-within:border-indigo-500/50' : 'bg-white border-slate-200 focus-within:border-indigo-300'}`}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste medical dictation draft here..."
                  className={`absolute inset-0 w-full h-full p-8 font-inter leading-relaxed bg-transparent resize-none outline-none placeholder:text-slate-600 font-medium custom-scrollbar ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} ${getFontSizeClass()}`}
                />
              </div>
            </div>

            {/* Output Panel */}
            <div className="flex flex-col gap-4 group h-full overflow-hidden">
              <div className="flex items-center justify-between px-2">
                <label className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Augmented Result
                </label>
                {outputText && (
                  <button 
                    onClick={pushToNext}
                    className={`text-[10px] font-black px-4 py-1.5 rounded-full transition-all border uppercase tracking-widest ${
                      isVerified 
                      ? (isDarkMode ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 shadow-sm' : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-sm') 
                      : (isDarkMode ? 'text-slate-600 bg-slate-900 border-slate-800 cursor-not-allowed' : 'text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed')
                    }`}
                  >
                    Proceed Stage →
                  </button>
                )}
              </div>
              
              <div className={`flex-1 flex flex-col border rounded-[2rem] shadow-sm overflow-hidden relative transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`flex-1 p-8 overflow-y-auto custom-scrollbar transition-colors ${isDarkMode ? 'bg-slate-950/40' : 'bg-[#fafafa]'} ${isProcessing ? 'opacity-50' : ''}`}>
                  {!outputText && !isProcessing ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 opacity-40">
                      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-center">Awaiting AI Inference</p>
                    </div>
                  ) : (
                    <div className={`font-serif-clinical leading-[1.65] ${isDarkMode ? 'text-slate-300' : 'text-slate-800'} ${getFontSizeClass()}`}>
                      {outputText.split('\n').map((line, idx) => {
                        const trimmedLine = line.trim();
                        const isHeader = trimmedLine.length > 3 && (
                          trimmedLine === trimmedLine.toUpperCase() || 
                          /^(patient|chief|history|medications|allergies|physical|investigations|assessment|treatment|follow|impression|examination|technique|findings):/i.test(trimmedLine)
                        );
                        const isRisk = line.includes('[UNSURE') || line.toLowerCase().includes('verify') || selectedPrompt === PromptType.ERROR_FLAGGING;
                        
                        if (isHeader) {
                          return (
                            <h3 key={idx} className={`font-inter font-bold border-b pb-1 mb-4 mt-8 first:mt-0 sticky top-0 z-[5] text-[1.15em] uppercase tracking-wide transition-colors ${isDarkMode ? 'text-indigo-400 border-slate-800 bg-slate-950' : 'text-slate-900 border-slate-200 bg-[#fafafa]'}`}>
                              {trimmedLine}
                            </h3>
                          );
                        }
                        if (isRisk) {
                          return (
                            <div key={idx} className={`px-4 py-2 rounded-xl my-3 border-l-4 font-bold shadow-sm transition-all ${isDarkMode ? 'bg-amber-900/20 text-amber-400 border-amber-600' : 'bg-amber-100/60 text-amber-900 border-amber-500 hover:bg-amber-100'}`}>
                              {line}
                            </div>
                          );
                        }
                        return <p key={idx} className="mb-4">{line || '\u00A0'}</p>;
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {outputText && (
                  <div className={`p-6 border-t flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} className="sr-only peer" />
                        <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                        <span className={`ml-4 text-[11px] font-black uppercase tracking-widest transition-colors ${isVerified ? 'text-green-500' : 'text-slate-500'}`}>
                          {isVerified ? 'Verified' : 'Human Review'}
                        </span>
                      </label>
                    </div>
                    
                    <button 
                      onClick={() => copyToClipboard(outputText, 'output')}
                      className={`px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-lg ${
                        isVerified 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' 
                        : (isDarkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none')
                      }`}
                    >
                      {copyStatus === 'output' ? '✓ Ready' : 'Copy Draft'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Compliance Footer */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-slate-600"></span>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Internal Workspace</span>
           </div>
           <div className="text-[10px] text-slate-700 font-mono select-none">GST: 27AAAPP9753F2ZF</div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.15em] animate-pulse flex items-center gap-2">
             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
             Mandatory Review
          </span>
          <span className="text-[10px] text-slate-600 font-bold">&copy; {new Date().getFullYear()} Digitex Studio</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default App;
