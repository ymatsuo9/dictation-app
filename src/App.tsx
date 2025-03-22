import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";
import { ProgressSummary } from "./components/ProgressSummary";
import { LearningRecord, WordData } from "./types";

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
  const totalWords = records.filter(
    (r) => r.correctCount > 0 || r.skipCount > 0
  ).length;

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
          if (rec) {
            console.log(
              `🔍 ${w.word}: 正解=${rec.correctCount}, スキップ=${rec.skipCount}, 対象=${eligible}`
            );
          }
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
        console.log("🔎 既存レコード:", existing);
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
        console.log("✅ 更新後の履歴:", updated);
      } else {
        const newRecord: LearningRecord = {
          word,
          sentence,
          correctCount: wasCorrect ? 1 : 0,
          skipCount: wasCorrect ? 0 : 1,
          lastAnswered: now,
        };
        newRecords.push(newRecord);
        console.log("🆕 新規追加:", newRecord);
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

  const currentWord = words[currentIndex];

  if (!currentWord) {
    const shownRecords =
      view === "latest"
        ? [...records]
            .sort(
              (a, b) =>
                new Date(b.lastAnswered).getTime() -
                new Date(a.lastAnswered).getTime()
            )
            .slice(0, 10)
        : records;

    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>🧠 英単語ディクテーション</h1>
        <h2>✅ 学習履歴：</h2>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setView("latest")}
            style={{
              marginRight: "1rem",
              padding: "6px 12px",
              backgroundColor: view === "latest" ? "#ccc" : "#eee",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            最新10件
          </button>
          <button
            onClick={() => setView("all")}
            style={{
              padding: "6px 12px",
              backgroundColor: view === "all" ? "#ccc" : "#eee",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            全件表示
          </button>
        </div>
        <ul>
          {shownRecords.map((r) => (
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

        <ProgressSummary
          records={records}
          totalWords={totalWords}
          view={view}
          onChangeView={setView}
        />

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "2rem",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "1rem",
          }}
        >
          ▶️ 続きを学習する
        </button>

        <button
          onClick={() => {
            if (confirm("本当に履歴をリセットしますか？")) {
              localStorage.removeItem(STORAGE_KEY);
              setRecords([]);
              setWords([]);
              setCurrentIndex(0);
              setRecordsLoaded(false);
              setTimeout(() => {
                setRecordsLoaded(true);
              }, 100);
            }
          }}
          style={{
            marginTop: "2rem",
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
