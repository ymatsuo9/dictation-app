import { useState, useEffect } from "react";

type Props = {
  prompt: string;
  onComplete: () => void;
};

export const TypingBox = ({ prompt, onComplete }: Props) => {
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (input === prompt && !isCorrect) {
      setIsCorrect(true);
      onComplete(); // ✅ 1回だけ呼ばれるように
    }
  }, [input, prompt, isCorrect, onComplete]);

  useEffect(() => {
    setInput("");
    setIsCorrect(false);
  }, [prompt]);

  return (
    <div style={{ marginTop: "20px" }}>
      <p>
        <strong>お題：</strong>
        {prompt}
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="聞こえたとおりに入力..."
        style={{ width: "100%", padding: "8px", fontSize: "16px" }}
      />
      <p style={{ marginTop: "10px" }}>
        {isCorrect ? "✅ 正解です！" : "⏳ タイピング中…"}
      </p>
    </div>
  );
};
