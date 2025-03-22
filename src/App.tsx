import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";
import { LearningRecord, WordData } from "./types";
import { ProgressSummary } from "./components/ProgressSummary";

const STORAGE_KEY = "dictation-learning-records";
const MAX_QUESTIONS = 5;

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function App() {
  const [wordsWithSentence, setWordsWithSentence] = useState<WordData[]>([]);
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [view, setView] = useState<"latest" | "all">("latest");

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

  useEffect(() => {
    if (!recordsLoaded || wordsWithSentence.length > 0) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const latestRecords: LearningRecord[] = stored ? JSON.parse(stored) : [];
    console.log("🔁 fetch & 出題決定開始（最新履歴使用）", latestRecords);

    fetch("/en_50k.json")
      .then((res) => res.json())
      .then((data: WordData[]) => {
        console.log("📦 読み込んだ単語数:", data.length);
        const withSentence = data.filter((w) => w.sentence);
        setWordsWithSentence(withSentence);

        const candidates = withSentence.filter((w) => {
          const rec = latestRecords.find((r) => r.word === w.word);
          const eligible = !rec || rec.correctCount < 2;
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
  }, [recordsLoaded, wordsWithSentence.length]);

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

  const handleReset = () => {
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
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dictation-records.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
          setRecords(json);
          alert("✅ インポートが完了しました。");
        } else {
          alert("⚠️ 不正なファイル形式です。");
        }
      } catch {
        alert("⚠️ 読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  };

  const currentWord = words[currentIndex];

  if (!currentWord) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>🧠 英単語ディクテーション</h1>
        <h2>✅ 学習履歴：</h2>
        <ProgressSummary
          records={records}
          totalWords={wordsWithSentence.length}
          view={view}
          onChangeView={setView}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => window.location.reload()}
            style={buttonStyleBlue}
          >
            ▶️ 続きを学習する
          </button>
          <button onClick={handleReset} style={buttonStyleRed}>
            🗑️ 履歴をリセット
          </button>
          <button onClick={handleExport} style={buttonStyleGray}>
            📤 JSONをダウンロード
          </button>
          <label style={{ ...buttonStyleGray, cursor: "pointer" }}>
            📥 JSONをアップロード
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
        </div>
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

const buttonStyleBlue = {
  padding: "10px 16px",
  fontSize: "14px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const buttonStyleRed = {
  ...buttonStyleBlue,
  backgroundColor: "#dc3545",
};

const buttonStyleGray = {
  ...buttonStyleBlue,
  backgroundColor: "#6c757d",
};

export default App;
