import React, { useState } from 'react';
import { VocabWord } from '../types';
import { ChevronLeft, ChevronRight, Check, Volume2, Edit3, Save, Layers } from 'lucide-react';

interface VocabReviewProps {
  vocabList: VocabWord[];
  onToggleMastered: (id: string) => void;
  onUpdateVocab: (updatedVocab: VocabWord) => void;
}

const VocabReview: React.FC<VocabReviewProps> = ({ vocabList, onToggleMastered, onUpdateVocab }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'learning'>('learning');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');

  const activeList = filterMode === 'learning' 
    ? vocabList.filter(v => !v.mastered) 
    : vocabList;

  const currentCard = activeList[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setIsEditingNote(false);
    setCurrentIndex((prev) => (prev + 1) % activeList.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setIsEditingNote(false);
    setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    window.speechSynthesis.speak(utterance);
  };

  const handleFlip = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).closest('.no-flip')) {
      return;
    }
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setTempNote(currentCard.userNotes || '');
    }
  };

  const saveNote = () => {
    onUpdateVocab({ ...currentCard, userNotes: tempNote });
    setIsEditingNote(false);
  };

  if (activeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200 text-center p-8">
        <Check size={48} className="text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
        <p className="text-slate-500 mt-2">You have mastered all vocabulary words in this set.</p>
        {filterMode === 'learning' && (
          <button onClick={() => setFilterMode('all')} className="mt-4 text-brand-600 font-medium hover:underline">
            Review Mastered Words
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Vocabulary Flashcards</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg text-sm font-medium">
          <button 
            onClick={() => { setFilterMode('learning'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-md transition-all ${filterMode === 'learning' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            To Learn ({vocabList.filter(v => !v.mastered).length})
          </button>
          <button 
            onClick={() => { setFilterMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-md transition-all ${filterMode === 'all' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            All ({vocabList.length})
          </button>
        </div>
      </div>

      <div className="perspective-1000 h-96 relative group">
        <div 
          onClick={handleFlip}
          className={`w-full h-full relative preserve-3d transition-transform duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center p-8 z-10">
            <span className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-4">Word</span>
            <h3 className="text-4xl font-serif font-bold text-slate-800 mb-2">{currentCard.word}</h3>
            {currentCard.phonetic && <p className="text-slate-500 font-serif italic">{currentCard.phonetic}</p>}
            
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }} 
              className="mt-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors no-flip"
            >
              <Volume2 size={24} />
            </button>
            <p className="mt-8 text-xs text-slate-400">Click card to reveal meaning</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-brand-50 rounded-2xl shadow-lg border border-brand-100 flex flex-col p-6 overflow-y-auto"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {/* Meaning (Chinese) */}
            <div className="text-center mb-3">
               <span className="text-xs text-brand-400 uppercase tracking-widest font-bold">Meaning (Chinese)</span>
               <p className="text-xl font-bold text-slate-800 mt-1">{currentCard.meaning}</p>
            </div>
            
            {/* Context */}
            <div className="text-center mb-4 bg-white p-2 rounded border border-slate-100">
               <p className="text-xs text-slate-400 mb-1">Context</p>
               <p className="text-sm text-slate-600 italic">"{currentCard.contextSentence}"</p>
            </div>

            {/* Collocations & Synonyms */}
            <div className="grid grid-cols-2 gap-2 mb-4">
               <div>
                  <h5 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Layers size={10}/> Collocations</h5>
                  <div className="flex flex-col gap-1">
                    {currentCard.collocations && currentCard.collocations.length > 0 ? (
                      currentCard.collocations.map((col, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{col}</span>
                      ))
                    ) : <span className="text-xs text-slate-300">None available</span>}
                  </div>
               </div>
               <div>
                  <h5 className="text-xs font-bold text-slate-500 mb-1">Synonyms</h5>
                  <div className="flex flex-wrap gap-1">
                    {currentCard.synonyms.slice(0, 3).map((syn, i) => (
                      <span key={i} className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{syn}</span>
                    ))}
                  </div>
               </div>
            </div>

            {/* Editable Notes Section */}
            <div className="mt-auto bg-white p-3 rounded-lg border border-brand-200 no-flip shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400">My Notes</span>
                {isEditingNote ? (
                   <button onClick={saveNote} className="text-green-600 hover:text-green-700"><Save size={14}/></button>
                ) : (
                   <button onClick={() => { setIsEditingNote(true); setTempNote(currentCard.userNotes || ''); }} className="text-brand-600 hover:text-brand-700"><Edit3 size={14}/></button>
                )}
              </div>
              {isEditingNote ? (
                <textarea 
                  className="w-full text-sm p-2 bg-slate-50 rounded border border-slate-200"
                  rows={2}
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  placeholder="Add usage notes..."
                />
              ) : (
                <p className="text-xs text-slate-600 min-h-[20px]">{currentCard.userNotes || "No notes added."}</p>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4">
        <button onClick={handlePrev} className="p-3 rounded-full hover:bg-white hover:shadow-md text-slate-600 transition-all">
          <ChevronLeft size={24} />
        </button>

        <div className="flex gap-4">
          <button 
            onClick={() => onToggleMastered(currentCard.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors ${currentCard.mastered ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'}`}
          >
            {currentCard.mastered ? <><Check size={18} /> Mastered</> : 'Mark Mastered'}
          </button>
        </div>

        <button onClick={handleNext} className="p-3 rounded-full hover:bg-white hover:shadow-md text-slate-600 transition-all">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="text-center text-sm text-slate-400">
        Card {currentIndex + 1} of {activeList.length}
      </div>
    </div>
  );
};

export default VocabReview;