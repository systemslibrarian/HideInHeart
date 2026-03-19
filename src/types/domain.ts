export type Verse = {
  id: string;
  reference: string;
  translation: string;
  parts: string[];
  answers: string[];
  decoys: string[];
  themeId: string;
};

export type AttemptInput = {
  userId: string;
  verseId: string;
  correctCount: number;
  totalBlanks: number;
  attemptIndex: number;
  elapsedMs: number;
};

export type ScoreRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  best_session: number;
};
