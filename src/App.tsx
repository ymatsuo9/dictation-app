import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";

type WordData = {
  word: string;
  count: number;
  rank: number;
  sentence?: string;
};

type LearningRecord = {
  word: string;
  sentence?: string;
  correctCount: number;
  skipCount: number;
  lastAnswered: string;
};

const STORAGE_KEY = "dictation-history";
const MAX_QUESTIONS = 10;
const RANK_LIMIT = 1000; // 上位1000語までを対象にする

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function App() {
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<LearningRecord[]>([]);

  // ✅ JSONファイルを読み込む
  useEffect(() => {
    fetch("/en_50k.json")
      .then((res) => res.json())
      .then((data: WordData[]) => {
        const withSentence = data.filter((w) => w.sentence);

        // 頻度上位（rankが小さい）かつ例文付きの語だけを対象にする
        const topRanked = withSentence.filter((w) => w.rank <= RANK_LIMIT);

        const learnedWords = new Set(
          records.filter((r) => r.correctCount >= 2).map((r) => r.word)
        );

        const candidates = topRanked.filter((w) => !learnedWords.has(w.word));

        const randomSubset = shuffle(candidates).slice(0, MAX_QUESTIONS);

        setWords(randomSubset);
        setCurrentIndex(0);
      });
  }, [records]);

  // ✅ localStorage から履歴を読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const updateLearningRecord = (
    word: string,
    sentence: string | undefined,
    wasCorrect: boolean
  ) => {
    const now = new Date().toISOString();
    setRecords((prev) => {
      const existing = prev.find((r) => r.word === word);
      let updated: LearningRecord;

      if (existing) {
        updated = {
          ...existing,
          correctCount: wasCorrect
            ? existing.correctCount + 1
            : existing.correctCount,
          skipCount: wasCorrect ? existing.skipCount : existing.skipCount + 1,
          lastAnswered: now,
        };
        const others = prev.filter((r) => r.word !== word);
        return [...others, updated];
      } else {
        updated = {
          word,
          sentence,
          correctCount: wasCorrect ? 1 : 0,
          skipCount: wasCorrect ? 0 : 1,
          lastAnswered: now,
        };
        return [...prev, updated];
      }
    });
  };

  // ✅ records 更新時に保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleComplete = (wasCorrect: boolean) => {
    const currentWord = words[currentIndex];
    if (currentWord) {
      updateLearningRecord(currentWord.word, currentWord.sentence, wasCorrect);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const currentWord = words[currentIndex];

  if (!currentWord) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>🎉 全て完了しました！</h1>
        <h2 style={{ marginTop: "1rem" }}>✅ 学習履歴：</h2>
        <ul>
          {records.map((r) => (
            <li key={r.word}>
              <strong>{r.word}</strong>: 正解 {r.correctCount} 回 / スキップ{" "}
              {r.skipCount} 回
              {r.sentence && (
                <div style={{ fontSize: "0.9em", color: "#555" }}>
                  例文: {r.sentence}
                </div>
              )}
            </li>
          ))}
        </ul>

        <button
          style={{
            marginTop: "2rem",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setRecords([]);
            setCurrentIndex(0);
          }}
        >
          🔄 履歴をリセットして再スタート
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧠 英単語ディクテーション</h1>
      <TypingBox
        prompt={currentWord.sentence ?? currentWord.word}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default App;
