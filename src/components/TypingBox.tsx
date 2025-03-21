import { useState, useEffect } from "react";

type Props = {
  prompt: string;
  onComplete: () => void;
};

export const TypingBox = ({ prompt, onComplete }: Props) => {
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false); // ← 追加
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .trim();

  useEffect(() => {
    const voices = speechSynthesis.getVoices();
    console.log("[Voice一覧]", voices);
  }, []);

  useEffect(() => {
    const handleVoicesReady = () => {
      const voices = speechSynthesis.getVoices();
      console.log("[voiceschanged発火]", voices);
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    };

    // Chromeではvoiceschangedが発火しない場合もあるので、2段構え
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesReady);
    handleVoicesReady(); // 一度直接呼ぶ（即時チェック）

    // クリーンアップ
    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesReady
      );
    };
  }, []);

  useEffect(() => {
    setInput("");
    setIsCorrect(false);
    setShowPrompt(false); // 新しい問題に切り替わったら非表示に戻す
  }, [prompt]);

  useEffect(() => {
    if (normalize(input) === normalize(prompt) && !isCorrect) {
      setIsCorrect(true);
      setShowPrompt(true);

      // 少し待ってから次に進む（1000ms = 1秒）
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [input, prompt, isCorrect, onComplete]);

  const handlePlay = () => {
    console.log("handlePlay called");

    if (!voicesReady) {
      console.warn("Voice data not ready yet.");
      return;
    }

    speechSynthesis.cancel();

    setTimeout(() => {
      const voices = speechSynthesis.getVoices();
      const enVoice =
        voices.find(
          (v) => v.lang === "en-US" && v.name.toLowerCase().includes("google")
        ) || voices.find((v) => v.lang === "en-US");

      if (!enVoice) {
        console.warn("⚠️ en-US voice not found, skipping playback.");
        return; // ← 見つからなければ再生しない
      }

      console.log("🎤 使用Voice:", enVoice.name);

      const utterance = new SpeechSynthesisUtterance(prompt);
      utterance.voice = enVoice;
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
      setShowPrompt(false);
    }, 100); // ← 💡 100msディレイ
  };

  console.log("voicesReady:", voicesReady);
  console.log(
    voicesReady
      ? "✅ JSX分岐: 読み上げるボタンを表示"
      : "⏳ JSX分岐: 読み込み中表示"
  );

  return (
    <div style={{ marginTop: "20px" }}>
      {voicesReady ? (
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
      ) : (
        <p style={{ fontSize: "14px", color: "#888" }}>
          🔄 音声の準備中です...
        </p>
      )}

      {showPrompt && (
        <p>
          <strong>お題：</strong>
          {prompt}
        </p>
      )}

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
