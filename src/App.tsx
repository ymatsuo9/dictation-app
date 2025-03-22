import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";
import { ProgressSummary } from "./components/ProgressSummary";
import { WordData, LearningRecord } from "./types";

const STORAGE_KEY = "dictation-learning-records";
const MAX_QUESTIONS = 5;
const RANK_LIMIT = 1000;

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function App() {
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [view, setView] = useState<"latest" | "all">("latest");

  // 履歴読み込み
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("✅ ロードした履歴：", parsed);
      setRecords(parsed);
    } else {
      console.log("⚠️ ローカルストレージに履歴が見つかりませんでした");
    }
    setRecordsLoaded(true);
  }, []);

  // 履歴が読み込まれてから fetch + 出題決定
  useEffect(() => {
    if (!recordsLoaded || words.length > 0) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const latestRecords: LearningRecord[] = stored ? JSON.parse(stored) : [];
    console.log("🔁 fetch & 出題決定開始（最新履歴使用）", latestRecords);

    fetch("/en_50k.json")
      .then((res) => res.json())
      .then((data: WordData[]) => {
        console.log("📦 読み込んだ単語数:", data.length);
        const withSentence = data.filter((w) => w.sentence);
        const topRanked = withSentence.filter((w) => w.rank <= RANK_LIMIT);

        const candidates = topRanked.filter((w) => {
          const rec = latestRecords.find((r) => r.word === w.word);
          const eligible = !rec || (rec.correctCount < 2 && rec.skipCount < 2);
          return eligible;
        });

        const randomSubset = shuffle(candidates).slice(0, MAX_QUESTIONS);
        console.log(
          "🎯 出題候補語:",
          randomSubset.map((w) => w.word)
        );
        setWords(randomSubset);
        setCurrentIndex(0);
      });
  }, [recordsLoaded, words.length]);

  const updateLearningRecord = (
    word: string,
    sentence: string | undefined,
    wasCorrect: boolean
  ) => {
    console.log(`📝 updateLearningRecord: ${word}, 正解=${wasCorrect}`);
    const now = new Date().toISOString();

    setRecords((prev) => {
      const newRecords = [...prev];
      const existingIndex = newRecords.findIndex((r) => r.word === word);

      if (existingIndex !== -1) {
        const existing = newRecords[existingIndex];
        const updated: LearningRecord = {
          ...existing,
          correctCount: wasCorrect
            ? existing.correctCount + 1
            : existing.correctCount,
          skipCount: wasCorrect ? existing.skipCount : existing.skipCount + 1,
          lastAnswered: now,
          sentence: sentence ?? existing.sentence,
        };
        newRecords[existingIndex] = updated;
      } else {
        const newRecord: LearningRecord = {
          word,
          sentence,
          correctCount: wasCorrect ? 1 : 0,
          skipCount: wasCorrect ? 0 : 1,
          lastAnswered: now,
        };
        newRecords.push(newRecord);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const handleComplete = (wasCorrect: boolean) => {
    const currentWord = words[currentIndex];
    if (currentWord) {
      updateLearningRecord(currentWord.word, currentWord.sentence, wasCorrect);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleContinue = () => {
    setWords([]);
    setRecordsLoaded(false);
    setTimeout(() => setRecordsLoaded(true), 100);
  };

  const handleReset = () => {
    if (confirm("本当に履歴をリセットしますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      setRecords([]);
      setWords([]);
      setCurrentIndex(0);
      setRecordsLoaded(false);
      setTimeout(() => setRecordsLoaded(true), 100);
    }
  };

  const currentWord = words[currentIndex];

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧠 英単語ディクテーション</h1>
      {currentWord ? (
        <TypingBox
          prompt={currentWord.sentence ?? currentWord.word}
          onComplete={handleComplete}
        />
      ) : (
        <>
          <ProgressSummary
            records={records}
            totalWords={50000}
            view={view}
            onChangeView={(v) => setView(v)}
          />
          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleContinue}
              style={{
                marginRight: "1rem",
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ▶️ 続きを学習する
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🗑️ 履歴をリセット
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
