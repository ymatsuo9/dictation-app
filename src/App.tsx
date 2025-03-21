import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";

const WORDS = ["cat", "dog", "book", "hello", "milk"];

const SENTENCES: Record<string, string> = {
  cat: "The cat is sleeping.",
  dog: "The dog is barking.",
  book: "I am reading a book.",
  hello: "Hello, how are you?",
  milk: "I drink milk every morning.",
};

const STORAGE_KEY = "dictation-history";

function App() {
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // 起動時にlocalStorageから履歴を読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // 初回 or usedWordsが更新されたら次の問題を選ぶ
  useEffect(() => {
    const remaining = WORDS.filter((w) => !usedWords.includes(w));
    if (remaining.length > 0) {
      const nextWord = remaining[Math.floor(Math.random() * remaining.length)];
      setCurrentWord(nextWord);
    } else {
      setCurrentWord(null); // 全問終了！
    }
  }, [usedWords]);

  const handleComplete = (wasCorrect: boolean) => {
    if (wasCorrect && currentWord) {
      const sentence = SENTENCES[currentWord];
      const newHistory = [...history, sentence];
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }

    if (currentWord) {
      setUsedWords((prev) => [...prev, currentWord]);
    }
  };

  if (currentWord === null) {
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
      <TypingBox prompt={SENTENCES[currentWord]} onComplete={handleComplete} />
    </div>
  );
}

export default App;
