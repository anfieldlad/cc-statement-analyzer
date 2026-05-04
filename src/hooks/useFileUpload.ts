"use client";

import { useCallback, useState } from "react";

const MAX_SIZE = 10 * 1024 * 1024;

export interface FileUploadState {
  file: File | null;
  error: string | null;
}

export function useFileUpload() {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    error: null,
  });

  const setFile = useCallback((file: File | null) => {
    if (!file) {
      setState({ file: null, error: null });
      return;
    }
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setState({ file: null, error: "Only PDF files are accepted" });
      return;
    }
    if (file.size > MAX_SIZE) {
      setState({ file: null, error: "File is too large. Maximum size is 10MB" });
      return;
    }
    setState({ file, error: null });
  }, []);

  const clear = useCallback(() => {
    setState({ file: null, error: null });
  }, []);

  return { ...state, setFile, clear };
}
