import { useEffect, useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          return !rec || rec.correctCount < 2;
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

  const handleDownload = () => {
    const csvContent = [
      ["word", "correctCount", "skipCount", "lastAnswered", "sentence"],
      ...records.map((r) => [
        r.word,
        r.correctCount,
        r.skipCount,
        r.lastAnswered,
        r.sentence ?? "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learning_records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (Array.isArray(json)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
          setRecords(json);
          setWords([]);
          setCurrentIndex(0);
          alert("✅ アップロード成功！再出題されます");
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        console.error("❌ JSONの読み込みに失敗しました", err);
        alert("❌ JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
  };

  const currentWord = words[currentIndex];
  const totalWords = records.length;

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
          <p>✅ 「続きを学習する」で次の出題を取得できます。</p>

          <ProgressSummary
            records={records}
            totalWords={totalWords}
            view={view}
            onChangeView={setView}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={() => {
                setWords([]);
                setCurrentIndex(0);
              }}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
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
              onClick={() => {
                if (confirm("本当に履歴をリセットしますか？")) {
                  localStorage.removeItem(STORAGE_KEY);
                  setRecords([]);
                  setWords([]);
                  setCurrentIndex(0);
                }
              }}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🗑️ 履歴をリセット
            </button>

            <button
              onClick={handleDownload}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📥 CSVでダウンロード
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📤 JSONをアップロード
            </button>

            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
