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

  useEffect(() => {
    // 一部のブラウザで読み上げが機能するためのウォームアップ
    speechSynthesis.getVoices();
  }, []);

  const handlePlay = () => {
    // キューにある前の読み上げをキャンセル
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = "en-US";
    utterance.rate = 1; // 話す速度（1が標準）
    speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <p>
        <strong>お題：</strong>
        {prompt}
      </p>

      <button
        onClick={handlePlay}
        style={{
          marginBottom: "10px",
          padding: "6px 12px",
          fontSize: "14px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        🔊 読み上げる
      </button>

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
