import React from "react";
import { LearningRecord } from "../types";

export type ViewMode = "latest" | "all";

type Props = {
  records: LearningRecord[];
  totalWords: number;
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
};

export const ProgressSummary: React.FC<Props> = ({
  records,
  totalWords,
  view,
  onChangeView,
}) => {
  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.lastAnswered).getTime() - new Date(a.lastAnswered).getTime()
  );
  const visible = view === "latest" ? sorted.slice(0, 10) : sorted;
  const correctWords = records.filter((r) => r.correctCount >= 1).length;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2>✅ 学習履歴：</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
        <button
          onClick={() => onChangeView("latest")}
          style={{
            padding: "6px 12px",
            backgroundColor: view === "latest" ? "#ddd" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          最新10件
        </button>
        <button
          onClick={() => onChangeView("all")}
          style={{
            padding: "6px 12px",
            backgroundColor: view === "all" ? "#ddd" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          全件表示
        </button>
      </div>

      <ul>
        {visible.map((r) => (
          <li key={r.word} style={{ marginBottom: "0.5rem" }}>
            <strong>{r.word}</strong>: 正解 {r.correctCount} 回 / スキップ{" "}
            {r.skipCount} 回
            {r.sentence && (
              <div style={{ fontSize: "0.9em", color: "#555" }}>
                例文: {r.sentence}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1.5rem" }}>
        <h3>📊 学習進捗サマリー</h3>
        <p>
          できた単語の数: {correctWords} / {totalWords}（
          {Math.round((correctWords / totalWords) * 100)}%）
        </p>
      </div>
    </div>
  );
};
