"use client";

import type { ProcessingStep } from "@/types";
import { CheckIcon, SpinnerIcon } from "./icons";

interface ProcessingStatusProps {
  step: ProcessingStep;
  progress: number;
  onCancel: () => void;
}

const STEPS: { id: ProcessingStep; label: string }[] = [
  { id: "decrypting", label: "Decrypting PDF" },
  { id: "extracting", label: "Extracting transactions" },
  { id: "sanitizing", label: "Sanitizing data" },
  { id: "parsing", label: "Categorizing with AI" },
  { id: "validating", label: "Building dashboard" },
];

function getStatus(
  current: ProcessingStep,
  step: ProcessingStep
): "pending" | "active" | "done" {
  const order = STEPS.map((s) => s.id);
  const currIdx = order.indexOf(current);
  const stepIdx = order.indexOf(step);
  if (stepIdx < currIdx) return "done";
  if (stepIdx === currIdx) return "active";
  return "pending";
}

export function ProcessingStatus({
  step,
  progress,
  onCancel,
}: ProcessingStatusProps) {
  return (
    <div className="processing fade-in">
      <h2>Analyzing your statement...</h2>
      <div className="processing-steps">
        {STEPS.map((s) => {
          const status = getStatus(step, s.id);
          return (
            <div key={s.id} className="processing-step" data-status={status}>
              <span className="processing-icon" data-status={status}>
                {status === "done" && (
                  <CheckIcon width={16} height={16} />
                )}
                {status === "active" && (
                  <SpinnerIcon width={16} height={16} />
                )}
              </span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="processing-meta">{progress}%</div>
      <div style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
