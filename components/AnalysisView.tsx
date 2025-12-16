import React, { useState, useRef } from 'react';
import { BookOpen, Flag, Download, FileText, Plus, Search, X, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { ArticleData, VocabWord, DifficultSentence, MistakeRecord, QuestionType } from '../types';
import { lookupWordWithGemini, analyzeMistakeWithGemini } from '../services/geminiService';

interface AnalysisViewProps {
  article: ArticleData;
  onSaveVocab: (vocab: VocabWord) => void;
  onFlagSentence: (sentence: DifficultSentence) => void;
  onUpdateArticle: (updatedArticle: ArticleData) => void;
  mistakes: MistakeRecord[];
  onAddMistake: (mistake: MistakeRecord) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ 
  article, 
  onSaveVocab, 
  onFlagSentence, 
  onUpdateArticle,
  mistakes,
  onAddMistake
}) => {
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'analysis' | 'mistakes'>('analysis');
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Selection Popover State
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [lookupResult, setLookupResult] = useState<VocabWord | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // New Mistake Form State
  const [isAddingMistake, setIsAddingMistake] = useState(false);
  const [qType, setQType] = useState<QuestionType>(QuestionType.TRUE_FALSE_NG);
  const [qText, setQText] = useState('');
  const [wrongAns, setWrongAns] = useState('');
  const [correctAns, setCorrectAns] = useState('');
  const [mistakeLoading, setMistakeLoading] = useState(false);

  const articleMistakes = mistakes.filter(m => m.articleId === article.id);

  if (!article.analysis) return null;

  // --- Handlers ---

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (textContainerRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        setSelectionRect(rect);
        setLookupResult(null); 
      }
    } else {
      setSelectionRect(null);
    }
  };

  const handleLookup = async () => {
    setIsLookingUp(true);
    const context = selectedText; 
    const result = await lookupWordWithGemini(selectedText, context);
    setLookupResult(result);
    setIsLookingUp(false);
  };

  const handleAddLookupToVocab = () => {
    if (lookupResult) {
      onSaveVocab(lookupResult);
      setSelectionRect(null); 
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleExportWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title><style>body{font-family: 'Times New Roman', serif; font-size:12pt;} h1{font-size:18pt; font-weight:bold;} h2{font-size:14pt; margin-top:10px;} .vocab{margin-bottom:5px;} .sentence{margin-bottom:15px;}</style></head><body>";
    
    let bodyHTML = `<h1>${article.title}</h1>`;
    bodyHTML += `<p><strong>Level:</strong> ${article.analysis?.level}</p>`;
    bodyHTML += `<h2>Vocabulary & Collocations</h2>`;
    article.analysis?.vocabulary.forEach(v => {
      bodyHTML += `<div class='vocab'><strong>${v.word}</strong>: ${v.meaning} <br/> <em>Collocations: ${v.collocations?.join(', ') || 'None'}</em></div>`;
    });
    
    bodyHTML += `<h2>Full Analysis</h2>`;
    article.analysis?.sentences.forEach(s => {
      bodyHTML += `<div class='sentence'>
        <p><strong>${s.original}</strong></p>
        <p>Trans: ${s.translation}</p>
        <p style='color:#666;'>Analysis: ${s.grammarNotes}</p>
      </div>`;
    });

    const footer = "</body></html>";
    const sourceHTML = header + bodyHTML + footer;

    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateSentenceNote = (note: string) => {
    if (selectedSentenceIdx === null) return;
    const updatedSentences = [...article.analysis!.sentences];
    updatedSentences[selectedSentenceIdx] = { ...updatedSentences[selectedSentenceIdx], userNotes: note };
    const updatedArticle = { ...article, analysis: { ...article.analysis!, sentences: updatedSentences } };
    onUpdateArticle(updatedArticle);
  };

  const handleSaveMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    setMistakeLoading(true);
    const aiAdvice = await analyzeMistakeWithGemini(qType, qText, wrongAns, correctAns, selectedText || "General context");
    
    const newMistake: MistakeRecord = {
      id: Date.now().toString(),
      articleId: article.id,
      date: Date.now(),
      questionType: qType,
      questionText: qText,
      wrongAnswer: wrongAns,
      correctAnswer: correctAns,
      reason: "Manual Entry from Reading",
      aiAdvice
    };

    onAddMistake(newMistake);
    setMistakeLoading(false);
    setIsAddingMistake(false);
    setQText(''); setWrongAns(''); setCorrectAns('');
  };

  const selectedAnalysis = selectedSentenceIdx !== null ? article.analysis.sentences[selectedSentenceIdx] : null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 relative">
      
      {/* Header Actions */}
      <div className="absolute top-[-50px] right-0 flex gap-2">
        <button 
          onClick={handleExportWord}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FileText size={16} /> Export Word
        </button>
      </div>

      {/* Popover for Selection */}
      {selectionRect && (
        <div 
          className="fixed z-50 bg-white shadow-xl rounded-lg border border-slate-200 p-3 w-72 animate-in fade-in zoom-in-95"
          style={{ top: selectionRect.bottom + 10, left: Math.min(selectionRect.left, window.innerWidth - 300) }}
        >
          <div className="flex justify-between items-start mb-2">
             <h4 className="font-bold text-slate-800 truncate pr-2">"{selectedText}"</h4>
             <button onClick={() => setSelectionRect(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
          </div>
          
          {!lookupResult && !isLookingUp && (
            <button onClick={handleLookup} className="w-full bg-brand-600 text-white text-xs py-2 rounded hover:bg-brand-700 flex items-center justify-center gap-2">
              <Search size={12} /> Translate & Analyze
            </button>
          )}

          {isLookingUp && <div className="text-xs text-center text-slate-500 py-2">Consulting Gemini AI...</div>}

          {lookupResult && (
            <div className="space-y-2">
              <div className="text-sm">
                <p className="text-slate-600 font-bold">{lookupResult.meaning}</p>
                {lookupResult.collocations && lookupResult.collocations.length > 0 && (
                   <div className="mt-1 text-xs text-slate-500">
                     <span className="font-semibold text-brand-600">Phrases:</span> {lookupResult.collocations.slice(0,2).join(', ')}
                   </div>
                )}
              </div>
              <button onClick={handleAddLookupToVocab} className="w-full bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                <Plus size={12} /> Add to Vocabulary
              </button>
            </div>
          )}
        </div>
      )}

      {/* Left Panel: The Text */}
      <div className="lg:w-7/12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-serif font-bold text-lg text-slate-800 truncate" title={article.title}>{article.title}</h2>
          <span className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded-full font-medium">{article.analysis.level}</span>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-8 reading-scroll leading-loose font-serif text-lg text-slate-800"
          ref={textContainerRef}
          onMouseUp={handleTextSelection}
        >
          {article.analysis.sentences.map((sentence, idx) => (
            <span
              key={idx}
              onClick={() => { if (window.getSelection()?.toString().length === 0) { setSelectedSentenceIdx(idx); setRightPanelTab('analysis'); } }}
              className={`cursor-pointer transition-colors duration-200 hover:bg-brand-50 rounded px-1 ${selectedSentenceIdx === idx ? 'bg-brand-100 border-b-2 border-brand-400' : ''}`}
            >
              {sentence.original}{' '}
            </span>
          ))}
        </div>
      </div>

      {/* Right Panel: Analysis & Notes */}
      <div className="lg:w-5/12 flex flex-col gap-4 overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setRightPanelTab('analysis')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${rightPanelTab === 'analysis' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen size={16} /> Sentence Analysis
          </button>
          <button 
            onClick={() => setRightPanelTab('mistakes')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${rightPanelTab === 'mistakes' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle size={16} /> Mistakes ({articleMistakes.length})
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {rightPanelTab === 'analysis' ? (
            <div className="flex-1 overflow-y-auto p-6 reading-scroll">
              {selectedAnalysis ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original</h4>
                    <p className="font-serif text-lg text-slate-800">{selectedAnalysis.original}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Translation</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedAnalysis.translation}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grammar & Structure (CN)</h4>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 min-w-[4px] h-4 bg-amber-400 rounded-full"></div>
                      <p className="text-slate-600 text-sm leading-relaxed">{selectedAnalysis.grammarNotes}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                      My Notes <button onClick={() => onFlagSentence({ id: Date.now().toString(), articleTitle: article.title, original: selectedAnalysis.original, translation: selectedAnalysis.translation, notes: selectedAnalysis.grammarNotes, dateAdded: Date.now() })} className="text-amber-500 hover:text-amber-600"><Flag size={14}/></button>
                    </h4>
                    <textarea 
                      className="w-full p-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none text-slate-700"
                      rows={4}
                      placeholder="Add annotations..."
                      value={selectedAnalysis.userNotes || ''}
                      onChange={(e) => handleUpdateSentenceNote(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                  <BookOpen size={40} className="mb-4 opacity-20" />
                  <p>Click a sentence to analyze.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 reading-scroll bg-slate-50">
              {/* Linked Mistakes View */}
              {!isAddingMistake ? (
                <div className="space-y-4">
                   <button 
                     onClick={() => setIsAddingMistake(true)}
                     className="w-full bg-white border border-dashed border-slate-300 text-slate-500 p-3 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
                   >
                     <Plus size={16} /> Log Mistake for this Article
                   </button>

                   {articleMistakes.length === 0 ? (
                     <div className="text-center text-slate-400 py-8 text-sm">No mistakes logged for this article yet.</div>
                   ) : (
                     articleMistakes.slice().reverse().map(m => (
                       <div key={m.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                          <div className="flex justify-between text-xs mb-2">
                             <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{m.questionType}</span>
                             <span className="text-slate-400">{new Date(m.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-2">{m.questionText}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                             <div className="bg-red-50 text-red-700 px-2 py-1 rounded">Wrong: {m.wrongAnswer}</div>
                             <div className="bg-green-50 text-green-700 px-2 py-1 rounded">Right: {m.correctAnswer}</div>
                          </div>
                          <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded leading-relaxed">
                            <strong>AI Advice:</strong> {m.aiAdvice}
                          </div>
                       </div>
                     ))
                   )}
                </div>
              ) : (
                <form onSubmit={handleSaveMistake} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                   <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-sm">New Mistake Log</h4>
                      <button type="button" onClick={() => setIsAddingMistake(false)}><X size={16} className="text-slate-400" /></button>
                   </div>
                   <select value={qType} onChange={e => setQType(e.target.value as QuestionType)} className="w-full p-2 text-sm border rounded">
                      {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <input required type="text" placeholder="Question Text" value={qText} onChange={e => setQText(e.target.value)} className="w-full p-2 text-sm border rounded"/>
                   <div className="grid grid-cols-2 gap-2">
                      <input required type="text" placeholder="Your Answer" value={wrongAns} onChange={e => setWrongAns(e.target.value)} className="w-full p-2 text-sm border border-red-200 bg-red-50 rounded"/>
                      <input required type="text" placeholder="Correct Answer" value={correctAns} onChange={e => setCorrectAns(e.target.value)} className="w-full p-2 text-sm border border-green-200 bg-green-50 rounded"/>
                   </div>
                   <button type="submit" disabled={mistakeLoading} className="w-full bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-900 disabled:opacity-50">
                      {mistakeLoading ? 'Analyzing...' : 'Save & Analyze'}
                   </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;