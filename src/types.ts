export type WordData = {
  word: string;
  count: number;
  rank: number;
  sentence?: string;
};

export type LearningRecord = {
  word: string;
  sentence?: string;
  correctCount: number;
  skipCount: number;
  lastAnswered: string;
};
