"use client";

import { PlayIcon } from "./icons";

interface AnalyzeButtonProps {
  enabled: boolean;
  onClick: () => void;
}

export function AnalyzeButton({ enabled, onClick }: AnalyzeButtonProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <button
        type="button"
        className={`btn btn-primary ${enabled ? "glow" : ""}`}
        disabled={!enabled}
        onClick={onClick}
      >
        <PlayIcon /> Analyze Statement
      </button>
    </div>
  );
}
