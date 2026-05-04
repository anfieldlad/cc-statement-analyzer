"use client";

import { useDarkMode } from "@/hooks/useDarkMode";
import { MoonIcon, ShieldIcon, SunIcon } from "./icons";

interface HeaderProps {
  rightSlot?: React.ReactNode;
}

export function Header({ rightSlot }: HeaderProps) {
  const { theme, toggle } = useDarkMode();

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div className="app-logo">
          <span className="app-logo-icon">
            <ShieldIcon width={16} height={16} />
          </span>
          Spending Insights
        </div>
        <div className="app-header-actions">
          {rightSlot}
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
