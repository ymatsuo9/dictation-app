import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";

// ✅ ステップ1: 単語データ構造（拡張可能）
const WORD_DATA = [
  {
    word: "cat",
    sentence: "The cat is sleeping.",
    level: 1,
    tags: ["animal", "beginner"],
  },
  {
    word: "dog",
    sentence: "The dog is barking.",
    level: 1,
    tags: ["animal", "beginner"],
  },
  {
    word: "book",
    sentence: "I am reading a book.",
    level: 1,
    tags: ["object", "beginner"],
  },
  {
    word: "milk",
    sentence: "I drink milk every morning.",
    level: 2,
    tags: ["food", "daily"],
  },
  {
    word: "React",
    sentence: "React is a JavaScript library.",
    level: 5,
    tags: ["tech", "intermediate"],
  },
];

const STORAGE_KEY = "dictation-history";
const TARGET_LEVEL = 2; // 例：初級〜中級（レベル2まで）を対象

function App() {
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<null | (typeof WORD_DATA)[0]>(
    null
  );
  const [history, setHistory] = useState<string[]>([]);

  // 起動時にlocalStorageから履歴を読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // 使用済み単語を除いて次を選ぶ
  useEffect(() => {
    const candidates = WORD_DATA.filter(
      (w) => !usedWords.includes(w.word) && w.level <= TARGET_LEVEL
    );
    if (candidates.length > 0) {
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      setCurrentWord(next);
    } else {
      setCurrentWord(null);
    }
  }, [usedWords]);

  // 正解またはスキップ時の処理
  const handleComplete = (wasCorrect: boolean) => {
    if (wasCorrect && currentWord) {
      const newHistory = [...history, currentWord.sentence];
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }

    if (currentWord) {
      setUsedWords((prev) => [...prev, currentWord.word]);
    }
  };

  if (!currentWord) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>🎉 全て完了しました！</h1>
        <h2 style={{ marginTop: "1rem" }}>✅ 正解した履歴：</h2>
        <ul>
          {history.map((item, index) => (
            <li key={index}>{item}</li>
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
            setHistory([]);
            setUsedWords([]);
          }}
        >
          🔄 履歴をリセットして再スタート
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧠 ディクテーション練習（単語ベース）</h1>
      <TypingBox prompt={currentWord.sentence} onComplete={handleComplete} />
    </div>
  );
}

export default App;
