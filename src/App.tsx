import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";

type WordData = {
  word: string;
  count: number;
  rank: number;
};

const STORAGE_KEY = "dictation-history";

function App() {
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  // ✅ JSONファイルを読み込む
  useEffect(() => {
    fetch("/en_50k.json")
      .then((res) => res.json())
      .then((data: WordData[]) => {
        setWords(data.slice(0, 100)); // 上位100語で出題してみる
      });
  }, []);

  // ✅ localStorage から履歴を読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const handleComplete = (wasCorrect: boolean) => {
    const currentWord = words[currentIndex];
    if (wasCorrect && currentWord) {
      const newHistory = [...history, currentWord.word];
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const currentWord = words[currentIndex];

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
      <TypingBox prompt={currentWord.word} onComplete={handleComplete} />
    </div>
  );
}

export default App;
