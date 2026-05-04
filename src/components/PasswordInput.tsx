"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, KeyIcon } from "./icons";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PasswordInput({ value, onChange }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      <div className="input-wrapper">
        <span className="input-wrapper-icon" aria-hidden>
          <KeyIcon />
        </span>
        <input
          className="input-field"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="PDF Password"
          autoComplete="off"
          spellCheck={false}
          aria-label="PDF password"
        />
        <button
          type="button"
          className="input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      <div className="input-hint">
        Leave blank if your PDF is not password-protected
      </div>
    </div>
  );
}
