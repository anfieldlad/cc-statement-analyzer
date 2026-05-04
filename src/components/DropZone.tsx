"use client";

import { useCallback, useRef, useState } from "react";
import { FileIcon, XIcon } from "./icons";

interface DropZoneProps {
  file: File | null;
  onFile: (file: File | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DropZone({ file, onFile }: DropZoneProps) {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setActive(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setActive(true);
  }, []);

  const onDragLeave = useCallback(() => setActive(false), []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) onFile(selected);
      e.target.value = "";
    },
    [onFile]
  );

  if (file) {
    return (
      <div className="dropzone" data-active="false" role="region">
        <div className="dropzone-file">
          <span className="dropzone-icon">
            <FileIcon width={24} height={24} />
          </span>
          <div className="dropzone-file-info">
            <div className="dropzone-file-name">{file.name}</div>
            <div className="dropzone-file-meta">{formatBytes(file.size)}</div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onFile(null)}
            aria-label="Remove file"
          >
            <XIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dropzone"
      data-active={active ? "true" : "false"}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF statement"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="dropzone-input"
        onChange={onChange}
        tabIndex={-1}
      />
      <div className="dropzone-icon" aria-hidden>
        <FileIcon width={28} height={28} />
      </div>
      <div className="dropzone-title">
        Drag &amp; drop your PDF statement here
      </div>
      <div>
        or <span className="dropzone-browse">Browse files</span>
      </div>
      <div className="dropzone-hint">Accepted: .pdf up to 10MB</div>
    </div>
  );
}
