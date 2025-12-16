import React, { useState, useRef } from 'react';
import { BookOpen, AlertCircle, Bookmark, Share, Download, CheckCircle2, FileText, Flag } from 'lucide-react';
import { ArticleData, VocabWord, DifficultSentence } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisViewProps {
  article: ArticleData;
  onSaveVocab: (vocab: VocabWord) => void;
  onFlagSentence: (sentence: DifficultSentence) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ article, onSaveVocab, onFlagSentence }) => {
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  if (!article.analysis) return null;

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${article.title}-analysis.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = () => {
    if (!exportRef.current) return;
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + exportRef.current.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${article.title}-analysis.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const selectedAnalysis = selectedSentenceIdx !== null 
    ? article.analysis.sentences[selectedSentenceIdx] 
    : null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 relative">
      {/* Header Actions */}
      <div className="absolute top-[-50px] right-0 flex gap-2">
        <button 
          onClick={handleExportWord}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <FileText size={16} /> Export Word
        </button>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {exporting ? 'Generating...' : <><Download size={16} /> Export PDF</>}
        </button>
      </div>

      {/* Left Panel: The Text */}
      <div className="lg:w-7/12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-serif font-bold text-lg text-slate-800 truncate" title={article.title}>{article.title}</h2>
          <span className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded-full font-medium">
            {article.analysis.level}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 reading-scroll leading-loose font-serif text-lg text-slate-800">
          <div ref={exportRef} className="bg-white p-4"> {/* Wrapper for export */}
            <h1 className="text-2xl font-bold mb-4 hidden print:block">{article.title}</h1>
            {article.analysis.sentences.map((sentence, idx) => (
              <span
                key={idx}
                onClick={() => setSelectedSentenceIdx(idx)}
                className={`cursor-pointer transition-colors duration-200 hover:bg-brand-50 rounded px-1 
                  ${selectedSentenceIdx === idx ? 'bg-brand-100 border-b-2 border-brand-400' : ''}
                `}
              >
                {sentence.original}{' '}
              </span>
            ))}
            
            {/* Expanded Vocabulary List for Export */}
            <div className="hidden print:block mt-8 pt-8 border-t">
               <h3 className="text-xl font-bold mb-4">Core Vocabulary</h3>
               {article.analysis.vocabulary.map((v, i) => (
                 <div key={i} className="mb-2">
                   <strong>{v.word}</strong>: {v.meaning} <br/>
                   <i className="text-sm text-gray-600">{v.contextSentence}</i>
                 </div>
               ))}
               <h3 className="text-xl font-bold mb-4 mt-6">Detailed Analysis</h3>
               {article.analysis.sentences.map((s, i) => (
                 <div key={i} className="mb-4">
                   <p><strong>{i+1}.</strong> {s.original}</p>
                   <p className="text-sm text-gray-700">Translation: {s.translation}</p>
                   <p className="text-sm text-gray-600">Note: {s.grammarNotes}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Analysis */}
      <div className="lg:w-5/12 flex flex-col gap-4 overflow-hidden">
        
        {/* Sentence Detail */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-slate-700 font-medium">
            <div className="flex items-center gap-2"><BookOpen size={18} /> Sentence Analysis</div>
            {selectedAnalysis && (
              <button 
                onClick={() => onFlagSentence({
                  id: Date.now().toString(),
                  articleTitle: article.title,
                  original: selectedAnalysis.original,
                  translation: selectedAnalysis.translation,
                  notes: selectedAnalysis.grammarNotes,
                  dateAdded: Date.now()
                })}
                className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                title="Mark as Difficult Sentence"
              >
                <Flag size={14} /> Mark as Difficult
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 reading-scroll">
            {selectedAnalysis ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original</h4>
                  <p className="font-serif text-lg text-slate-800">{selectedAnalysis.original}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Translation</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedAnalysis.translation}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grammar & Structure</h4>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 min-w-[4px] h-4 bg-amber-400 rounded-full"></div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {selectedAnalysis.grammarNotes}
                    </p>
                  </div>
                </div>

                {selectedAnalysis.keyPhrases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Phrases</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.keyPhrases.map((phrase, i) => (
                        <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded text-xs font-medium">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                <BookOpen size={40} className="mb-4 opacity-20" />
                <p>Click on any sentence in the article<br/>to see detailed analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Vocab Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-1/3 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-700 font-medium">
            <Bookmark size={18} />
            Extracted Vocabulary
          </div>
          <div className="flex-1 overflow-y-auto p-2 reading-scroll">
             {article.analysis.vocabulary.map((vocab, i) => (
               <div key={i} className="group p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all mb-2">
                 <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-800">{vocab.word}</span>
                        <span className="text-xs text-slate-500 font-serif">{vocab.phonetic}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{vocab.meaning}</p>
                    </div>
                    <button 
                      onClick={() => onSaveVocab({...vocab, mastered: false, mistakeCount: 0, id: Date.now().toString() + i})}
                      className="text-slate-300 hover:text-brand-600 p-1"
                      title="Add to Flashcards"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisView;