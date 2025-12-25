
import React, { useState, useEffect, useRef } from 'react';
import { PromptType, Case } from './types';
import { PROMPTS } from './constants';
import { geminiService } from './geminiService';

const App: React.FC = () => {
  // --- Case Management State ---
  const [cases, setCases] = useState<Case[]>(() => {
    const saved = localStorage.getItem('hd_cases');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCaseId, setActiveCaseId] = useState<string | null>(() => localStorage.getItem('hd_active_case_id'));

  // --- UI State ---
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>(PromptType.CLEANUP);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'large' | 'xl'>(() => 
    (localStorage.getItem('hd_zoom_level') as 'normal' | 'large' | 'xl') || 'normal'
  );
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('hd_dark_mode') === 'true');
  const [showHistory, setShowHistory] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Sync Active Case ---
  useEffect(() => {
    if (activeCaseId) {
      const activeCase = cases.find(c => c.id === activeCaseId);
      if (activeCase) {
        setInputText(activeCase.inputText);
        setOutputText(activeCase.outputText);
        setSelectedPrompt(activeCase.currentPromptType);
        setIsVerified(activeCase.isVerified);
      }
    }
  }, [activeCaseId]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('hd_cases', JSON.stringify(cases));
    localStorage.setItem('hd_active_case_id', activeCaseId || '');
    localStorage.setItem('hd_zoom_level', zoomLevel);
    localStorage.setItem('hd_dark_mode', String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [cases, activeCaseId, zoomLevel, isDarkMode]);

  // --- Auto-save current case data ---
  useEffect(() => {
    if (activeCaseId) {
      setCases(prev => prev.map(c => 
        c.id === activeCaseId 
        ? { ...c, inputText, outputText, currentPromptType: selectedPrompt, isVerified, timestamp: Date.now() } 
        : c
      ));
    }
  }, [inputText, outputText, selectedPrompt, isVerified]);

  const createNewCase = () => {
    const newCase: Case = {
      id: crypto.randomUUID(),
      title: `Case #${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      inputText: '',
      outputText: '',
      currentPromptType: PromptType.CLEANUP,
      isVerified: false
    };
    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCase.id);
    setShowHistory(false);
  };

  const deleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this case history?")) {
      setCases(prev => prev.filter(c => c.id !== id));
      if (activeCaseId === id) {
        setActiveCaseId(null);
        setInputText('');
        setOutputText('');
      }
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeCaseId) createNewCase();

    setIsProcessing(true);
    setOutputText('');
    
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const promptDef = PROMPTS[PromptType.CLEANUP];
      const stream = geminiService.streamTranscription(promptDef, `Transcribing audio file: ${file.name}`, {
        data: base64,
        mimeType: file.type
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setOutputText(fullText);
      }
      
      setCases(prev => prev.map(c => 
        c.id === activeCaseId ? { ...c, title: file.name.split('.')[0] } : c
      ));

    } catch (error) {
      setOutputText("ERROR: Audio transcription failed. Please check file format or API limits.");
    } finally {
      setIsProcessing(false);
    }
  };

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
      setOutputText("ERROR: Inference failed. Check connectivity.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pushToNext = () => {
    if (!isVerified) return alert("Human Review Required.");
    const currentOrder = Object.keys(PROMPTS) as PromptType[];
    const nextPromptKey = currentOrder[currentOrder.indexOf(selectedPrompt) + 1];
    if (nextPromptKey) {
      setInputText(outputText);
      setOutputText('');
      setSelectedPrompt(nextPromptKey);
      setIsVerified(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!isVerified) return alert("Verify before copying.");
    navigator.clipboard.writeText(text);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getFontSizeClass = () => zoomLevel === 'xl' ? 'text-[20px]' : zoomLevel === 'large' ? 'text-[18px]' : 'text-[16px]';

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-inter transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 shadow-sm z-30 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current"><path d="M19,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.11,21 21,20.1 21,19V5C21,3.9 20.11,3 19,3M19,19H5V5H19V19M11,7H13V11H17V13H13V17H11V13H7V11H11V7Z"/></svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight leading-none mb-1">Digitex HealthDocs</h1>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Workspace v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${showHistory ? 'bg-indigo-600 text-white border-indigo-600' : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200')}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Case History ({cases.length})
          </button>
          <div className={`h-6 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg border border-transparent hover:border-slate-700 transition-all">
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* History Overlay Drawer */}
        <aside className={`absolute left-0 top-0 h-full w-80 z-20 transition-transform duration-500 transform border-r ${showHistory ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">History Log</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-red-500">✕</button>
            </div>
            <button 
              onClick={createNewCase}
              className="w-full py-4 mb-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
            >
              + New Transcription Job
            </button>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
              {cases.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setActiveCaseId(c.id); setShowHistory(false); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${activeCaseId === c.id ? (isDarkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200') : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-100 hover:border-slate-200')}`}
                >
                  <div className="text-xs font-bold truncate pr-6 mb-1">{c.title}</div>
                  <div className="text-[10px] text-slate-500 flex justify-between items-center">
                    <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                    <span className="bg-indigo-100 text-indigo-600 px-1.5 rounded uppercase font-black tracking-tighter">{Object.keys(PROMPTS).indexOf(c.currentPromptType) + 1}/7</span>
                  </div>
                  <button onClick={(e) => deleteCase(c.id, e)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">✕</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Stages Sidebar */}
        <nav className={`w-16 flex flex-col items-center py-6 gap-4 border-r shrink-0 z-10 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {Object.values(PROMPTS).map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPrompt(p.id)}
              className={`w-10 h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center border ${selectedPrompt === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200')}`}
              title={p.label}
            >
              {idx + 1}
            </button>
          ))}
        </nav>

        {/* Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Action Bar */}
          <div className={`h-16 px-8 flex items-center justify-between border-b shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{PROMPTS[selectedPrompt].label}</span>
              <div className={`h-4 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              <input 
                type="text" 
                value={cases.find(c => c.id === activeCaseId)?.title || 'Untitled Case'} 
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, title: newTitle } : c));
                }}
                className={`bg-transparent text-sm font-bold outline-none border-b border-transparent focus:border-indigo-500 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={runWorkflow} 
                disabled={isProcessing || !inputText.trim()}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isProcessing || !inputText.trim() ? 'opacity-50 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
              >
                {isProcessing ? 'Processing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-px bg-slate-200 overflow-hidden dark:bg-slate-800">
            {/* Input Side */}
            <div className={`flex flex-col p-8 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source Input</label>
                {selectedPrompt === PromptType.CLEANUP && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black uppercase text-indigo-500 flex items-center gap-1 hover:text-indigo-600"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                    Upload Medical Audio
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste raw text or upload clinical audio..."
                className={`flex-1 w-full bg-transparent resize-none outline-none font-inter leading-relaxed custom-scrollbar ${getFontSizeClass()} ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
              />
            </div>

            {/* Output Side */}
            <div className={`flex flex-col p-8 transition-colors ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Processed Document</label>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1 bg-slate-200/50 p-0.5 rounded-lg dark:bg-slate-800">
                      {(['normal', 'large', 'xl'] as const).map(z => (
                        <button key={z} onClick={() => setZoomLevel(z)} className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${zoomLevel === z ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{z}</button>
                      ))}
                   </div>
                </div>
              </div>
              
              <div className={`flex-1 overflow-y-auto custom-scrollbar font-serif-clinical leading-relaxed ${getFontSizeClass()} ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                {outputText.split('\n').map((line, i) => {
                  const isHeader = line.length > 3 && (line === line.toUpperCase() || /^[A-Z][a-z]+(\s[A-Z][a-z]+)*:/.test(line));
                  const isRisk = line.includes('[UNSURE');
                  return (
                    <p key={i} className={`mb-4 ${isHeader ? 'font-inter font-bold text-indigo-500 uppercase text-[0.8em] border-b border-indigo-500/10 pb-1 mt-6 first:mt-0' : ''} ${isRisk ? 'bg-amber-100/30 text-amber-600 px-3 py-1 rounded border-l-2 border-amber-500 italic' : ''}`}>
                      {line || '\u00A0'}
                    </p>
                  );
                })}
              </div>

              {outputText && (
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => setIsVerified(!isVerified)} 
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isVerified ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${isVerified ? 'bg-green-600' : 'bg-slate-400'}`}></div>
                    {isVerified ? 'Verified' : 'Human Review'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(outputText)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isVerified ? 'bg-slate-900 text-white hover:bg-black' : 'opacity-30 cursor-not-allowed'}`}>
                      {copyStatus ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={pushToNext} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isVerified ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'opacity-30 cursor-not-allowed'}`}>
                      Next Stage →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f133; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f166; }
      `}</style>
    </div>
  );
};

export default App;
