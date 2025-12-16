import React, { useState } from 'react';
import { Upload, FileText, ArrowRight, Loader2 } from 'lucide-react';

interface ArticleInputProps {
  onAnalyze: (title: string, text: string) => Promise<void>;
  loading: boolean;
}

const ArticleInput: React.FC<ArticleInputProps> = ({ onAnalyze, loading }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
        setTitle(file.name.replace('.txt', ''));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && title.trim()) {
      onAnalyze(title, text);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">New Reading Session</h2>
        <p className="text-slate-500">Paste an article or upload a text file to begin intensive analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Article Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            placeholder="e.g., Cambridge 16 Test 1 Passage 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Content
            <span className="float-right text-xs font-normal text-slate-400">
              <label htmlFor="file-upload" className="cursor-pointer text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Upload size={14} /> Upload .txt
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </span>
          </label>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-serif leading-relaxed text-slate-700 resize-none"
            placeholder="Paste your English article here..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing with Gemini AI...
            </>
          ) : (
            <>
              Start Intensive Reading <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ArticleInput;
