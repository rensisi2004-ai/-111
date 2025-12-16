export interface VocabWord {
  word: string;
  phonetic?: string;
  meaning: string;
  contextSentence: string;
  synonyms: string[];
  mastered: boolean;
  mistakeCount?: number; // Track how often this word was forgotten/marked difficult
  id: string;
}

export interface SentenceAnalysis {
  original: string;
  translation: string;
  grammarNotes: string;
  keyPhrases: string[];
}

export interface DifficultSentence {
  id: string;
  articleTitle: string;
  original: string;
  translation: string;
  notes: string;
  dateAdded: number;
}

export interface ArticleData {
  id: string;
  title: string;
  content: string;
  dateAdded: number;
  analysis?: {
    sentences: SentenceAnalysis[];
    summary: string;
    level: string;
    vocabulary: VocabWord[];
  };
}

export enum QuestionType {
  TRUE_FALSE_NG = 'True/False/NG',
  MULTIPLE_CHOICE = 'Multiple Choice',
  HEADING_MATCHING = 'Heading Matching',
  SENTENCE_COMPLETION = 'Sentence Completion',
  SUMMARY_COMPLETION = 'Summary Completion',
  MATCHING_FEATURES = 'Matching Features'
}

export interface MistakeRecord {
  id: string;
  articleId?: string;
  questionType: QuestionType;
  questionText: string;
  wrongAnswer: string;
  correctAnswer: string;
  reason: string;
  aiAdvice: string;
  date: number;
}

export interface RecommendedArticle {
  title: string;
  topic: string;
  difficulty: string;
  excerpt: string;
  fullContentGeneratorPrompt: string; // Used to fetch full text
}

export interface StudyPlan {
  weekId: string;
  focusArea: string;
  priorityVocab: VocabWord[];
  reviewSentences: DifficultSentence[];
  advice: string;
}