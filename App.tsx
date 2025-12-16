import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, PenTool, Brain, LogOut, PlusCircle, Sparkles } from 'lucide-react';
import ArticleInput from './components/ArticleInput';
import AnalysisView from './components/AnalysisView';
import MistakeTracker from './components/MistakeTracker';
import VocabReview from './components/VocabReview';
import ArticleRecommendations from './components/ArticleRecommendations';
import { ArticleData, MistakeRecord, VocabWord, DifficultSentence } from './types';
import { analyzeArticleWithGemini } from './services/geminiService';

type Tab = 'input' | 'recommend' | 'reading' | 'vocab' | 'mistakes';

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [currentArticle, setCurrentArticle] = useState<ArticleData | null>(null);
  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [difficultSentences, setDifficultSentences] = useState<DifficultSentence[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from local storage on mount
  useEffect(() => {
    const savedVocab = localStorage.getItem('ielts-vocab');
    const savedMistakes = localStorage.getItem('ielts-mistakes');
    const savedArticle = localStorage.getItem('ielts-current-article');
    const savedSentences = localStorage.getItem('ielts-difficult-sentences');

    if (savedVocab) setVocabList(JSON.parse(savedVocab));
    if (savedMistakes) setMistakes(JSON.parse(savedMistakes));
    if (savedSentences) setDifficultSentences(JSON.parse(savedSentences));
    if (savedArticle) {
      setCurrentArticle(JSON.parse(savedArticle));
      setActiveTab('reading');
    }
  }, []);

  // Persistence effects
  useEffect(() => { localStorage.setItem('ielts-vocab', JSON.stringify(vocabList)); }, [vocabList]);
  useEffect(() => { localStorage.setItem('ielts-mistakes', JSON.stringify(mistakes)); }, [mistakes]);
  useEffect(() => { localStorage.setItem('ielts-difficult-sentences', JSON.stringify(difficultSentences)); }, [difficultSentences]);
  useEffect(() => { if (currentArticle) localStorage.setItem('ielts-current-article', JSON.stringify(currentArticle)); }, [currentArticle]);

  const handleAnalyzeArticle = async (title: string, text: string) => {
    setLoading(true);
    try {
      const analysisData = await analyzeArticleWithGemini(text);
      
      const newArticle: ArticleData = {
        id: Date.now().toString(),
        title,
        content: text,
        dateAdded: Date.now(),
        analysis: analysisData
      };
      
      setCurrentArticle(newArticle);
      
      if (analysisData.vocabulary) {
        setVocabList(prev => {
          const existingWords = new Set(prev.map(w => w.word.toLowerCase()));
          const newWords = analysisData.vocabulary
            .filter((v: any) => !existingWords.has(v.word.toLowerCase()))
            .map((v: any, i: number) => ({ ...v, mastered: false, mistakeCount: 0, id: Date.now().toString() + i }));
          return [...prev, ...newWords];
        });
      }

      setActiveTab('reading');
    } catch (error) {
      alert("Analysis failed. Please try again or check your API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMastered = (id: string) => {
    setVocabList(prev => prev.map(w => w.id === id ? { ...w, mastered: !w.mastered } : w));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="bg-brand-500 w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg">9</span>
            IELTS Pro
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('input')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'input' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800'}`}
          >
            <PlusCircle size={20} /> New Session
          </button>

          <button 
            onClick={() => setActiveTab('recommend')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'recommend' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800'}`}
          >
            <Sparkles size={20} /> Smart Recommend
          </button>

          <button 
            onClick={() => setActiveTab('reading')}
            disabled={!currentArticle}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'reading' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800'} ${!currentArticle ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen size={20} /> Intensive Reading
          </button>

          <button 
            onClick={() => setActiveTab('vocab')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'vocab' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800'}`}
          >
            <Brain size={20} /> Vocabulary ({vocabList.filter(v => !v.mastered).length})
          </button>

          <button 
            onClick={() => setActiveTab('mistakes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'mistakes' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800'}`}
          >
            <PenTool size={20} /> Mistake Analytics
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-500">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             Target: Band 9.0
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'input' && 'Start Studying'}
              {activeTab === 'recommend' && 'AI Recommendations'}
              {activeTab === 'reading' && 'Deep Analysis'}
              {activeTab === 'vocab' && 'Spaced Repetition'}
              {activeTab === 'mistakes' && 'Error Tracking & Review'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'input' && 'Upload material to begin your intensive reading session.'}
              {activeTab === 'recommend' && 'Get personalized Band 9.0 reading materials.'}
              {activeTab === 'reading' && 'Click sentences for grammar breakdown and translation.'}
              {activeTab === 'vocab' && 'Review core IELTS vocabulary extracted from your articles.'}
              {activeTab === 'mistakes' && 'Analyze patterns and generate weekly study plans.'}
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'input' && (
            <ArticleInput onAnalyze={handleAnalyzeArticle} loading={loading} />
          )}

          {activeTab === 'recommend' && (
            <ArticleRecommendations onSelectArticle={handleAnalyzeArticle} />
          )}

          {activeTab === 'reading' && currentArticle && (
            <AnalysisView 
              article={currentArticle} 
              onSaveVocab={(v) => setVocabList(prev => [...prev, v])}
              onFlagSentence={(s) => {
                setDifficultSentences(prev => [...prev, s]);
                alert("Sentence added to Mistake Tracker review list.");
              }}
            />
          )}

          {activeTab === 'vocab' && (
            <VocabReview vocabList={vocabList} onToggleMastered={handleToggleMastered} />
          )}

          {activeTab === 'mistakes' && (
            <MistakeTracker 
              mistakes={mistakes} 
              difficultSentences={difficultSentences}
              vocabList={vocabList}
              onAddMistake={(m) => setMistakes(prev => [...prev, m])} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;