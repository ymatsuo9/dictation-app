import { useState, useEffect } from "react";

type Props = {
  prompt: string;
  onComplete: () => void;
};

export const TypingBox = ({ prompt, onComplete }: Props) => {
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (input === prompt && !isCorrect) {
      setIsCorrect(true);
      onComplete(); // ✅ 1回だけ呼ばれるように
    }
  }, [input, prompt, isCorrect, onComplete]);

  useEffect(() => {
    setInput("");
    setIsCorrect(false);
    setShowPrompt(false); // 新しい問題に切り替わったら非表示に戻す
  }, [prompt]);

  useEffect(() => {
    // 一部のブラウザで読み上げが機能するためのウォームアップ
    speechSynthesis.getVoices();
  }, []);

  const handlePlay = () => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = "en-US";
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
    setShowPrompt(false); // 読み上げた直後はまだ非表示のまま
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (!showPrompt) {
      setShowPrompt(true); // 入力が始まったら表示する
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
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

      {showPrompt && (
        <p>
          <strong>お題：</strong>
          {prompt}
        </p>
      )}

      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="聞こえたとおりに入力..."
        style={{ width: "100%", padding: "8px", fontSize: "16px" }}
      />
      <p style={{ marginTop: "10px" }}>
        {isCorrect ? "✅ 正解です！" : "⏳ タイピング中…"}
      </p>
    </div>
  );
};
