import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, ClipboardPaste, Save } from "lucide-react";
import { SPENDING_CATEGORIES, type SpendingEntry, type EntryInput, formatGBP } from "@/hooks/useSpendingData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GridRow {
  id: string | null;
  date: string;
  description: string;
  // One amount field per category — only one should be filled
  amounts: Record<string, string>;
  dirty: boolean;
  saving: boolean;
}

interface Props {
  month: number;
  year: number;
  entries: SpendingEntry[];
  onAdd: (entry: EntryInput) => Promise<void>;
  onUpdate: (id: string, entry: EntryInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefetch: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Column indices: 0=date, 1=description, 2..15=categories, 16=delete (not focusable)
const TOTAL_COLS = 2 + SPENDING_CATEGORIES.length;

function entryToRow(e: SpendingEntry): GridRow {
  const amounts: Record<string, string> = {};
  amounts[e.category] = Number(e.amount).toFixed(2);
  return {
    id: e.id,
    date: e.date,
    description: e.description || "",
    amounts,
    dirty: false,
    saving: false,
  };
}

function emptyRow(year: number, month: number): GridRow {
  return {
    id: null,
    date: `${year}-${pad2(month)}-${pad2(new Date().getDate())}`,
    description: "",
    amounts: {},
    dirty: true,
    saving: false,
  };
}

function getFilledCategory(row: GridRow): { category: string; amount: number } | null {
  for (const cat of SPENDING_CATEGORIES) {
    const v = row.amounts[cat];
    if (v && v.trim() !== "") {
      const amt = parseFloat(v);
      if (!isNaN(amt) && amt > 0) return { category: cat, amount: amt };
    }
  }
  return null;
}

// Short labels for column headers on smaller screens
const SHORT_LABELS: Record<string, string> = {
  "Car/ Transport Costs": "Transport",
  "Insurance/Tax": "Insurance",
  "Childcare/Nursery Fees": "Childcare",
  "Clubs/ Sports": "Clubs",
  "Clothes & Shoes": "Clothes",
  "Dining & Takeaways": "Dining",
  "Subscriptions/Memberships": "Subs",
  "Outings/ Leisure": "Leisure",
  "Savings Contribution": "Savings",
  "Holiday/Vacation": "Holiday",
  "Debt/Loan Repayments": "Debt",
};

export default function SpreadsheetGrid({ month, year, entries, onAdd, onUpdate, onDelete, onRefetch }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<GridRow[]>([]);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Sync from entries
  useEffect(() => {
    setRows(prev => {
      const saved = entries
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(entryToRow);
      const unsaved = prev.filter(r => r.id === null && r.dirty);
      return [...saved, ...unsaved];
    });
  }, [entries]);

  // Focus management
  useEffect(() => {
    if (!focusCell) return;
    const key = `${focusCell.row}-${focusCell.col}`;
    const el = inputRefs.current.get(key);
    if (el) {
      el.focus();
      el.select();
    }
  }, [focusCell]);

  const setRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }, []);

  const updateDate = useCallback((idx: number, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, date: value, dirty: true } : r));
  }, []);

  const updateDescription = useCallback((idx: number, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, description: value, dirty: true } : r));
  }, []);

  const updateAmount = useCallback((idx: number, category: string, value: string) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      // If user types into a category and another already has a value, clear the old one
      const newAmounts = { ...r.amounts };
      // Clear other categories if this one gets a value
      if (value.trim() !== "") {
        for (const cat of SPENDING_CATEGORIES) {
          if (cat !== category) delete newAmounts[cat];
        }
      }
      if (value.trim() === "") {
        delete newAmounts[category];
      } else {
        newAmounts[category] = value;
      }
      return { ...r, amounts: newAmounts, dirty: true };
    }));
  }, []);

  const addEmptyRow = useCallback(() => {
    setRows(prev => {
      const newR = emptyRow(year, month);
      return [...prev, newR];
    });
    setTimeout(() => setFocusCell({ row: rows.length, col: 0 }), 50);
  }, [year, month, rows.length]);

  const saveRow = useCallback(async (idx: number) => {
    const row = rows[idx];
    if (!row || !row.dirty) return;

    const filled = getFilledCategory(row);
    if (!filled || !row.date) return;

    setRows(prev => prev.map((r, i) => i === idx ? { ...r, saving: true } : r));

    const entry: EntryInput = {
      date: row.date,
      description: row.description,
      amount: filled.amount,
      category: filled.category,
    };

    try {
      if (row.id) {
        await onUpdate(row.id, entry);
      } else {
        await onAdd(entry);
      }
    } catch {
      // handled in hook
    }
  }, [rows, onAdd, onUpdate]);

  const deleteRow = useCallback(async (idx: number) => {
    const row = rows[idx];
    if (row.id) {
      await onDelete(row.id);
    } else {
      setRows(prev => prev.filter((_, i) => i !== idx));
    }
    setDeleteConfirm(null);
  }, [rows, onDelete]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const next = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (next >= 0 && next < TOTAL_COLS) {
        setFocusCell({ row: rowIdx, col: next });
      } else if (!e.shiftKey && next >= TOTAL_COLS) {
        saveRow(rowIdx);
        if (rowIdx + 1 < rows.length) {
          setFocusCell({ row: rowIdx + 1, col: 0 });
        } else {
          addEmptyRow();
        }
      } else if (e.shiftKey && next < 0 && rowIdx > 0) {
        setFocusCell({ row: rowIdx - 1, col: TOTAL_COLS - 1 });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      saveRow(rowIdx);
      if (rowIdx + 1 < rows.length) {
        setFocusCell({ row: rowIdx + 1, col: colIdx });
      } else {
        addEmptyRow();
      }
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  }, [rows.length, saveRow, addEmptyRow]);

  // Paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length <= 1) return;
    e.preventDefault();

    const newRows: GridRow[] = [];
    for (const line of lines) {
      let parts = line.split("\t");
      if (parts.length < 3) parts = line.split(",");
      if (parts.length < 3) continue;

      let dateStr = parts[0].trim();
      const desc = parts[1].trim();
      let cat = parts.length >= 4 ? parts[2].trim() : "Other";
      let amtStr = parts.length >= 4 ? parts[3].trim() : parts[2].trim();

      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split("/");
        dateStr = `${y}-${pad2(parseInt(m))}-${pad2(parseInt(d))}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dateStr = `${year}-${pad2(month)}-01`;
      }

      amtStr = amtStr.replace(/[£$,]/g, "").trim();
      const amt = parseFloat(amtStr);

      const matchedCat = SPENDING_CATEGORIES.find(c =>
        c.toLowerCase() === cat.toLowerCase()
      ) || SPENDING_CATEGORIES.find(c =>
        c.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(c.toLowerCase().split("/")[0])
      ) || "Other";

      const amounts: Record<string, string> = {};
      if (!isNaN(amt) && amt > 0) amounts[matchedCat] = amt.toFixed(2);

      newRows.push({ id: null, date: dateStr, description: desc, amounts, dirty: true, saving: false });
    }

    if (newRows.length > 0) {
      setRows(prev => [...prev, ...newRows]);
      toast({ title: `${newRows.length} rows pasted`, description: "Review and press Enter or Tab to save" });
    }
  }, [year, month, toast]);

  const saveAllDirty = useCallback(async () => {
    const dirtyIdxs = rows.map((r, i) => r.dirty ? i : -1).filter(i => i >= 0);
    for (const idx of dirtyIdxs) {
      await saveRow(idx);
    }
    onRefetch();
  }, [rows, saveRow, onRefetch]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      for (const cat of SPENDING_CATEGORIES) {
        const v = parseFloat(row.amounts[cat] || "");
        if (!isNaN(v) && v > 0) totals[cat] = (totals[cat] || 0) + v;
      }
    }
    return totals;
  }, [rows]);

  const monthTotal = useMemo(() =>
    Object.values(categoryTotals).reduce((s, v) => s + v, 0), [categoryTotals]);

  const dirtyCount = rows.filter(r => r.dirty).length;

  return (
    <div className="space-y-3" onPaste={handlePaste} ref={gridRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addEmptyRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Row
          </Button>
          {dirtyCount > 0 && (
            <Button size="sm" onClick={saveAllDirty} className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save {dirtyCount} {dirtyCount === 1 ? "change" : "changes"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardPaste className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Paste from Excel • Tab across • Enter to save & next row</span>
          <span className="sm:hidden">Paste supported</span>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="border rounded-lg overflow-x-auto bg-card">
        <table className="text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b sticky top-0 z-10">
              <th className="px-2 py-2 text-left font-medium text-muted-foreground border-r border-border/50 whitespace-nowrap min-w-[110px] sticky left-0 bg-muted/60 z-20">Date</th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground border-r border-border/50 whitespace-nowrap min-w-[130px]">Description</th>
              {SPENDING_CATEGORIES.map(cat => (
                <th key={cat} className="px-1.5 py-2 text-right font-medium text-muted-foreground border-r border-border/50 whitespace-nowrap min-w-[80px]" title={cat}>
                  {SHORT_LABELS[cat] || cat}
                </th>
              ))}
              <th className="px-1 py-2 w-[36px]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={TOTAL_COLS + 1} className="text-center py-16">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No expenses this month</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button size="sm" onClick={addEmptyRow} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add first expense
                      </Button>
                      <span className="text-xs text-muted-foreground">or paste from a spreadsheet</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((row, ri) => (
              <tr
                key={row.id || `new-${ri}`}
                className={cn(
                  "border-b last:border-0 transition-colors group",
                  row.dirty && "bg-accent/20",
                  row.saving && "opacity-50 pointer-events-none",
                  deleteConfirm === ri && "bg-destructive/10"
                )}
              >
                {/* Date */}
                <td className="px-0.5 py-0 border-r border-border/30 sticky left-0 bg-card z-10">
                  <input
                    ref={el => setRef(`${ri}-0`, el)}
                    type="date"
                    value={row.date}
                    onChange={e => updateDate(ri, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ri, 0)}
                    onBlur={() => saveRow(ri)}
                    className="w-full px-1.5 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-xs"
                    disabled={row.saving}
                  />
                </td>
                {/* Description */}
                <td className="px-0.5 py-0 border-r border-border/30">
                  <input
                    ref={el => setRef(`${ri}-1`, el)}
                    type="text"
                    value={row.description}
                    onChange={e => updateDescription(ri, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ri, 1)}
                    onBlur={() => saveRow(ri)}
                    placeholder="optional"
                    className="w-full px-1.5 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-xs placeholder:text-muted-foreground/30"
                    disabled={row.saving}
                  />
                </td>
                {/* Category amount columns */}
                {SPENDING_CATEGORIES.map((cat, ci) => {
                  const val = row.amounts[cat] || "";
                  const hasOther = Object.keys(row.amounts).some(k => k !== cat && row.amounts[k]?.trim());
                  return (
                    <td key={cat} className={cn(
                      "px-0 py-0 border-r border-border/30",
                      val && "bg-primary/5"
                    )}>
                      <input
                        ref={el => setRef(`${ri}-${ci + 2}`, el)}
                        type="number"
                        step="0.01"
                        min="0"
                        value={val}
                        onChange={e => updateAmount(ri, cat, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, ri, ci + 2)}
                        onBlur={() => saveRow(ri)}
                        placeholder=""
                        className={cn(
                          "w-full px-1 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-xs text-right tabular-nums",
                          hasOther && !val && "opacity-30"
                        )}
                        disabled={row.saving}
                      />
                    </td>
                  );
                })}
                {/* Delete */}
                <td className="px-0.5 py-0 text-center">
                  {deleteConfirm === ri ? (
                    <div className="flex gap-0.5">
                      <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => deleteRow(ri)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <button className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground" onClick={() => setDeleteConfirm(null)}>✕</button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={() => setDeleteConfirm(ri)}
                      tabIndex={-1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {/* Category totals row */}
            {rows.length > 0 && (
              <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20 sticky bottom-0">
                <td className="px-2 py-2 text-xs sticky left-0 bg-primary/5 z-10">TOTAL</td>
                <td className="px-2 py-2 text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? "entry" : "entries"}</td>
                {SPENDING_CATEGORIES.map(cat => {
                  const t = categoryTotals[cat] || 0;
                  return (
                    <td key={cat} className="px-1 py-2 text-xs text-right tabular-nums">
                      {t > 0 ? formatGBP(t) : ""}
                    </td>
                  );
                })}
                <td className="px-1 py-2 text-xs text-right font-bold tabular-nums whitespace-nowrap">
                </td>
              </tr>
            )}
            {/* Grand total row */}
            {rows.length > 0 && (
              <tr className="bg-primary/10 font-bold border-t border-primary/20">
                <td className="px-2 py-2 text-xs sticky left-0 bg-primary/10 z-10" colSpan={2}>
                  MONTH TOTAL
                </td>
                <td colSpan={SPENDING_CATEGORIES.length} className="px-2 py-2 text-xs text-right tabular-nums">
                  {formatGBP(monthTotal)}
                </td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
