import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { getArticleRecommendations, generateFullArticle } from '../services/geminiService';
import { RecommendedArticle } from '../types';

interface ArticleRecommendationsProps {
  onSelectArticle: (title: string, content: string) => void;
}

const ArticleRecommendations: React.FC<ArticleRecommendationsProps> = ({ onSelectArticle }) => {
  const [recommendations, setRecommendations] = useState<RecommendedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    const recs = await getArticleRecommendations("9.0");
    setRecommendations(recs);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSelect = async (article: RecommendedArticle, index: number) => {
    setGeneratingId(index);
    try {
      const fullContent = await generateFullArticle(article.fullContentGeneratorPrompt);
      onSelectArticle(article.title, fullContent);
    } catch (e) {
      alert("Failed to generate full article. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Loader2 className="animate-spin mb-4 text-brand-500" size={32} />
        <p>Curating Band 9.0 reading materials for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-amber-500" /> Recommended for You
          </h2>
          <p className="text-slate-500">AI-curated articles based on Band 9 criteria.</p>
        </div>
        <button onClick={fetchRecommendations} className="text-brand-600 hover:underline text-sm font-medium">
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-300 transition-all group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-serif font-bold text-xl text-slate-800 group-hover:text-brand-700">{rec.title}</h3>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">{rec.topic}</span>
            </div>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">{rec.excerpt}...</p>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wide">{rec.difficulty} Difficulty</span>
              <button 
                onClick={() => handleSelect(rec, idx)}
                disabled={generatingId !== null}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center gap-2"
              >
                {generatingId === idx ? <Loader2 className="animate-spin" size={16} /> : <BookOpen size={16} />}
                Start Reading
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleRecommendations;