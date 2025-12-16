import React, { useState } from 'react';
import { MistakeRecord, QuestionType, VocabWord, DifficultSentence, StudyPlan } from '../types';
import { analyzeMistakeWithGemini, generateStudyPlanAdvice } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, BrainCircuit, AlertTriangle, Lightbulb, Calendar, RefreshCcw, Book } from 'lucide-react';

interface MistakeTrackerProps {
  mistakes: MistakeRecord[];
  difficultSentences: DifficultSentence[];
  vocabList: VocabWord[];
  onAddMistake: (mistake: MistakeRecord) => void;
}

const MistakeTracker: React.FC<MistakeTrackerProps> = ({ mistakes, difficultSentences, vocabList, onAddMistake }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  // Form State
  const [qType, setQType] = useState<QuestionType>(QuestionType.TRUE_FALSE_NG);
  const [qText, setQText] = useState('');
  const [wrongAns, setWrongAns] = useState('');
  const [correctAns, setCorrectAns] = useState('');
  const [context, setContext] = useState('');
  const [userReason, setUserReason] = useState('');

  // Stats Data preparation
  const stats = Object.values(QuestionType).map(type => ({
    name: type,
    count: mistakes.filter(m => m.questionType === type).length
  })).filter(s => s.count > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAI(true);
    
    const aiAdvice = await analyzeMistakeWithGemini(qType, qText, wrongAns, correctAns, context);
    
    const newMistake: MistakeRecord = {
      id: Date.now().toString(),
      date: Date.now(),
      questionType: qType,
      questionText: qText,
      wrongAnswer: wrongAns,
      correctAnswer: correctAns,
      reason: userReason,
      aiAdvice
    };

    onAddMistake(newMistake);
    setLoadingAI(false);
    setIsAdding(false);
    setQText(''); setWrongAns(''); setCorrectAns(''); setContext(''); setUserReason('');
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    // 1. Identify weak areas
    const typeCounts = stats.sort((a,b) => b.count - a.count);
    const weakType = typeCounts[0]?.name || "General Reading";
    
    // 2. Identify hard vocab (not mastered)
    const hardVocab = vocabList.filter(v => !v.mastered).sort((a,b) => (b.mistakeCount || 0) - (a.mistakeCount || 0)).slice(0, 10);
    
    // 3. Recent hard sentences
    const hardSentences = difficultSentences.slice(-5);

    // 4. Generate AI Advice
    const summary = `Most frequent error type: ${weakType}. Total mistakes: ${mistakes.length}. 
    Difficult Vocabulary count: ${hardVocab.length}. Difficult Sentences logged: ${hardSentences.length}.`;
    
    const advice = await generateStudyPlanAdvice(summary);

    setStudyPlan({
      weekId: Date.now().toString(),
      focusArea: weakType,
      priorityVocab: hardVocab,
      reviewSentences: hardSentences,
      advice
    });
    setGeneratingPlan(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-indigo-100 font-medium mb-1">Total Mistakes</h3>
          <p className="text-4xl font-bold">{mistakes.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
             <h3 className="text-slate-500 font-medium mb-1">Difficult Sentences</h3>
             <p className="text-3xl font-bold text-slate-800">{difficultSentences.length}</p>
        </div>
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
           <h3 className="text-slate-700 font-bold mb-4">Error Frequency</h3>
           <div className="h-32">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats} layout="vertical" margin={{ left: 40 }}>
                 <XAxis type="number" hide />
                 <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10}} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0ea5e9', '#6366f1', '#8b5cf6'][index % 3]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Review Plan Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-brand-500" /> Weekly Review Plan
          </h3>
          <button 
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="text-sm bg-white border border-brand-200 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors flex items-center gap-2"
          >
            {generatingPlan ? <RefreshCcw className="animate-spin" size={16}/> : <Lightbulb size={16} />} 
            Generate Smart Plan
          </button>
        </div>
        
        {studyPlan ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                <h4 className="font-bold text-amber-800 mb-2">💡 AI Strategy for You</h4>
                <p className="text-amber-900 text-sm leading-relaxed">{studyPlan.advice}</p>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Book size={18} /> Priority Vocabulary
                </h4>
                <div className="flex flex-wrap gap-2">
                  {studyPlan.priorityVocab.length > 0 ? studyPlan.priorityVocab.map((v, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm border border-slate-200">
                      {v.word}
                    </span>
                  )) : <p className="text-sm text-slate-400">No unmastered vocab recorded.</p>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-3">Difficult Sentences Review</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 reading-scroll">
                {studyPlan.reviewSentences.length > 0 ? studyPlan.reviewSentences.map((s, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                    <p className="font-serif text-slate-800 mb-1">{s.original}</p>
                    <p className="text-slate-500 text-xs">{s.translation}</p>
                  </div>
                )) : <p className="text-sm text-slate-400">No difficult sentences flagged.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            Click "Generate Smart Plan" to create a personalized review strategy based on your mistakes.
          </div>
        )}
      </div>

      {/* Add New Mistake Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Mistake Log
          </h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1"
          >
            <Plus size={16} /> Log Mistake
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-slate-100 space-y-4 animate-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Type</label>
                <select value={qType} onChange={e => setQType(e.target.value as QuestionType)} className="w-full p-2 rounded border border-slate-300">
                  {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Article Context (Optional)</label>
                <input type="text" placeholder="Paste relevant sentence from text" value={context} onChange={e => setContext(e.target.value)} className="w-full p-2 rounded border border-slate-300" />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Text</label>
               <input required type="text" value={qText} onChange={e => setQText(e.target.value)} className="w-full p-2 rounded border border-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-red-500">My Wrong Answer</label>
                <input required type="text" value={wrongAns} onChange={e => setWrongAns(e.target.value)} className="w-full p-2 rounded border border-red-200 bg-red-50 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-green-600">Correct Answer</label>
                <input required type="text" value={correctAns} onChange={e => setCorrectAns(e.target.value)} className="w-full p-2 rounded border border-green-200 bg-green-50 focus:ring-green-500" />
              </div>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">My Reflection (Why did I fail?)</label>
               <input type="text" value={userReason} onChange={e => setUserReason(e.target.value)} placeholder="e.g., I missed the synonym for 'increase'" className="w-full p-2 rounded border border-slate-300" />
            </div>

            <button type="submit" disabled={loadingAI} className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50">
              {loadingAI ? 'AI Analyzing...' : 'Analyze & Save Mistake'}
            </button>
          </form>
        )}

        {/* List of Mistakes */}
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {mistakes.length === 0 ? (
             <div className="p-8 text-center text-slate-400">No mistakes logged yet. Keep up the good work!</div>
          ) : (
             mistakes.slice().reverse().map(m => (
               <div key={m.id} className="p-6 hover:bg-slate-50 transition-colors">
                 <div className="flex justify-between items-start mb-3">
                   <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">{m.questionType}</span>
                   <span className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString()}</span>
                 </div>
                 <h4 className="font-medium text-slate-800 mb-2">{m.questionText}</h4>
                 <div className="flex gap-4 text-sm mb-4">
                   <span className="text-red-600 line-through decoration-red-300">{m.wrongAnswer}</span>
                   <span className="text-green-600 font-semibold">{m.correctAnswer}</span>
                 </div>
                 
                 <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex gap-3">
                   <BrainCircuit className="text-indigo-600 shrink-0 mt-1" size={20} />
                   <div>
                     <h5 className="text-xs font-bold text-indigo-800 uppercase mb-1">AI Coach Advice</h5>
                     <p className="text-indigo-900 text-sm leading-relaxed">{m.aiAdvice}</p>
                   </div>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MistakeTracker;