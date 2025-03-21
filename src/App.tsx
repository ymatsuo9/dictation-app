import { useState } from "react";
import { TypingBox } from "./components/TypingBox";

const PROMPTS = [
  "Hello, how are you?",
  "React is a JavaScript library.",
  "Typing is fun!",
];

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = () => {
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 1000); // 1秒待って次へ
  };

  if (currentIndex >= PROMPTS.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>🎉 全て完了しました！お疲れさまです！</h1>
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
