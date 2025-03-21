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
  const handleComplete = () => {
    const solved = PROMPTS[currentIndex];
    const newHistory = [...history, solved];
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

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
            <li key={index}>• {item}</li>
          ))}
        </ul>
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
