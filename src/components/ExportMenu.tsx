"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/types";
import { downloadCsv, downloadJson } from "@/lib/export";
import { ChevronDownIcon, DownloadIcon } from "./icons";

interface ExportMenuProps {
  transactions: Transaction[];
  currency: string;
}

export function ExportMenu({ transactions, currency }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="export-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DownloadIcon /> Export <ChevronDownIcon width={14} height={14} />
      </button>
      {open && (
        <div className="export-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadCsv(transactions, currency);
              setOpen(false);
            }}
          >
            Download CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadJson(transactions, currency);
              setOpen(false);
            }}
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}
