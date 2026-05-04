"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  type Category,
  type Transaction,
} from "@/types";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { SearchIcon, XIcon } from "./icons";

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  filterCategory: Category | null;
  onClearFilter: () => void;
  onCategoryChange: (index: number, next: Category) => void;
}

type SortKey = "date" | "merchant" | "amount" | "category";
type SortDir = "asc" | "desc";

export function TransactionTable({
  transactions,
  currency,
  filterCategory,
  onClearFilter,
  onCategoryChange,
}: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const indexed = transactions.map((t, i) => ({ t, i }));
    let out = indexed;
    if (filterCategory) {
      out = out.filter(({ t }) => t.category === filterCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(({ t }) => t.merchant.toLowerCase().includes(q));
    }
    out.sort((a, b) => {
      const ka = a.t[sortKey];
      const kb = b.t[sortKey];
      let cmp = 0;
      if (typeof ka === "number" && typeof kb === "number") {
        cmp = ka - kb;
      } else {
        cmp = String(ka).localeCompare(String(kb));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [transactions, filterCategory, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <span aria-hidden> {sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3 className="table-title">
            Transactions ({filtered.length}
            {filtered.length !== transactions.length
              ? ` / ${transactions.length}`
              : ""}
            )
          </h3>
        </div>
        <div className="table-search">
          <SearchIcon width={16} height={16} />
          <input
            type="search"
            placeholder="Search merchants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search transactions"
          />
        </div>
      </div>

      {filterCategory && (
        <div className="table-filter-banner">
          <span>
            Filtered by category:{" "}
            <strong style={{ color: CATEGORY_COLORS[filterCategory] }}>
              {filterCategory}
            </strong>
          </span>
          <button type="button" className="btn btn-ghost" onClick={onClearFilter}>
            <XIcon width={14} height={14} /> Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">No transactions match your filters.</div>
      ) : (
        <div className="table-scroll">
          <table className="tx-table">
            <thead>
              <tr>
                <th
                  data-active={sortKey === "date"}
                  onClick={() => toggleSort("date")}
                >
                  Date{sortIndicator("date")}
                </th>
                <th
                  data-active={sortKey === "merchant"}
                  onClick={() => toggleSort("merchant")}
                >
                  Merchant{sortIndicator("merchant")}
                </th>
                <th
                  data-active={sortKey === "amount"}
                  onClick={() => toggleSort("amount")}
                  style={{ textAlign: "right" }}
                >
                  Amount{sortIndicator("amount")}
                </th>
                <th
                  data-active={sortKey === "category"}
                  onClick={() => toggleSort("category")}
                >
                  Category{sortIndicator("category")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ t, i }) => (
                <tr key={`${i}-${t.date}-${t.merchant}`}>
                  <td>{formatDateShort(t.date)}</td>
                  <td className="tx-merchant" title={t.merchant}>
                    {t.merchant}
                  </td>
                  <td
                    className={`tx-amount ${t.amount < 0 ? "negative" : ""}`}
                  >
                    {formatCurrency(t.amount, currency)}
                  </td>
                  <td>
                    <label className="category-select">
                      <span
                        className="category-dot"
                        style={{
                          backgroundColor: CATEGORY_COLORS[t.category],
                        }}
                      />
                      <select
                        value={t.category}
                        onChange={(e) =>
                          onCategoryChange(i, e.target.value as Category)
                        }
                        aria-label={`Category for ${t.merchant}`}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
