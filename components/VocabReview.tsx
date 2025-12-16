import React, { useState } from 'react';
import { VocabWord } from '../types';
import { ChevronLeft, ChevronRight, Check, RotateCcw, Volume2 } from 'lucide-react';

interface VocabReviewProps {
  vocabList: VocabWord[];
  onToggleMastered: (id: string) => void;
}

const VocabReview: React.FC<VocabReviewProps> = ({ vocabList, onToggleMastered }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'learning'>('learning');

  const activeList = filterMode === 'learning' 
    ? vocabList.filter(v => !v.mastered) 
    : vocabList;

  const currentCard = activeList[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeList.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; // IELTS preference
    window.speechSynthesis.speak(utterance);
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

      <div className="perspective-1000 h-80 relative group">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
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
              className="mt-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors"
            >
              <Volume2 size={24} />
            </button>
            <p className="mt-8 text-xs text-slate-400">Click card to reveal meaning</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-brand-50 rounded-2xl shadow-lg border border-brand-100 flex flex-col items-center justify-center p-8"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="text-sm text-brand-400 uppercase tracking-widest font-bold mb-4">Meaning</span>
            <p className="text-xl text-center font-medium text-slate-800 mb-4">{currentCard.meaning}</p>
            
            <div className="w-full border-t border-brand-200 my-4"></div>
            
            <div className="text-center">
               <p className="text-sm text-slate-500 italic mb-1">"{currentCard.contextSentence}"</p>
            </div>
            
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              {currentCard.synonyms.map((syn, i) => (
                <span key={i} className="px-2 py-1 bg-white text-slate-600 text-xs rounded border border-brand-200">{syn}</span>
              ))}
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
