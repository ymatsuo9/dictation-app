import { useEffect, useState } from "react";
import { TypingBox } from "./components/TypingBox";

const PROMPTS = [
  "Hello, how are you?",
  "React is a JavaScript library.",
  "Typing is fun!",
];

const STORAGE_KEY = "dictation-history";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  // 起動時にlocalStorageから履歴を読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // 正解したときに履歴を更新
  const handleComplete = (wasCorrect: boolean) => {
    const solved = PROMPTS[currentIndex];

    // ✅ 正解だったときだけ履歴に追加
    if (wasCorrect) {
      const newHistory = [...history, solved];
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }

    // ✅ 問題は常に次に進む
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 1000);
  };

  if (currentIndex >= PROMPTS.length) {
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
      <h1>🧠 ディクテーション練習</h1>
      <TypingBox prompt={PROMPTS[currentIndex]} onComplete={handleComplete} />
    </div>
  );
}

export default App;
