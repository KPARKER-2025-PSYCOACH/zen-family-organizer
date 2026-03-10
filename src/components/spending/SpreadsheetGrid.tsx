import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ClipboardPaste } from "lucide-react";
import { SPENDING_CATEGORIES, type SpendingEntry, type EntryInput, formatGBP } from "@/hooks/useSpendingData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GridRow {
  id: string | null; // null = new unsaved row
  date: string;
  description: string;
  category: string;
  amount: string;
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

function entriesToRows(entries: SpendingEntry[]): GridRow[] {
  return entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({
      id: e.id,
      date: e.date,
      description: e.description || "",
      category: e.category,
      amount: Number(e.amount).toFixed(2),
      dirty: false,
      saving: false,
    }));
}

function emptyRow(year: number, month: number): GridRow {
  return {
    id: null,
    date: `${year}-${pad2(month)}-${pad2(new Date().getDate())}`,
    description: "",
    category: "",
    amount: "",
    dirty: true,
    saving: false,
  };
}

const COLUMNS = ["date", "description", "category", "amount"] as const;
type ColKey = typeof COLUMNS[number];

export default function SpreadsheetGrid({ month, year, entries, onAdd, onUpdate, onDelete, onRefetch }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<GridRow[]>([]);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLButtonElement>>(new Map());

  // Sync from entries prop
  useEffect(() => {
    setRows(prev => {
      const saved = entriesToRows(entries);
      // Keep unsaved dirty rows at the bottom
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
      if (el instanceof HTMLInputElement) el.select();
    }
  }, [focusCell]);

  const setRef = useCallback((key: string, el: HTMLInputElement | HTMLButtonElement | null) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }, []);

  const updateRow = useCallback((idx: number, col: ColKey, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [col]: value, dirty: true } : r));
  }, []);

  const addEmptyRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow(year, month)]);
    // Focus the date cell of new row after render
    setTimeout(() => {
      setFocusCell({ row: rows.length, col: 0 });
    }, 50);
  }, [year, month, rows.length]);

  const saveRow = useCallback(async (idx: number) => {
    const row = rows[idx];
    if (!row || !row.dirty) return;

    const parsed = parseFloat(row.amount);
    if (!row.category || !row.date || isNaN(parsed) || parsed <= 0) return;

    setRows(prev => prev.map((r, i) => i === idx ? { ...r, saving: true } : r));

    const entry: EntryInput = {
      date: row.date,
      description: row.description,
      amount: parsed,
      category: row.category,
    };

    try {
      if (row.id) {
        await onUpdate(row.id, entry);
      } else {
        await onAdd(entry);
      }
    } catch {
      // toast already handled in hook
    }
    // refetch will update rows via useEffect
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

  // Keyboard nav: Tab, Enter, Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (nextCol >= 0 && nextCol < COLUMNS.length) {
        setFocusCell({ row: rowIdx, col: nextCol });
      } else if (!e.shiftKey && nextCol >= COLUMNS.length) {
        // Save current row and move to next row
        saveRow(rowIdx);
        if (rowIdx + 1 < rows.length) {
          setFocusCell({ row: rowIdx + 1, col: 0 });
        } else {
          addEmptyRow();
        }
      } else if (e.shiftKey && nextCol < 0 && rowIdx > 0) {
        setFocusCell({ row: rowIdx - 1, col: COLUMNS.length - 1 });
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

  // Paste handler — parse tab-separated or comma-separated rows
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length <= 1) return; // Let single-line paste work normally on the cell

    e.preventDefault();

    const newRows: GridRow[] = [];
    for (const line of lines) {
      // Try tab-separated first, then comma
      let parts = line.split("\t");
      if (parts.length < 3) parts = line.split(",");

      if (parts.length >= 3) {
        let dateStr = parts[0].trim();
        const desc = parts[1].trim();
        // Category might be in position 2 or we need to detect
        let cat = parts.length >= 4 ? parts[2].trim() : "Other";
        let amtStr = parts.length >= 4 ? parts[3].trim() : parts[2].trim();

        // Parse date — accept dd/mm/yyyy or yyyy-mm-dd
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split("/");
          dateStr = `${y}-${pad2(parseInt(m))}-${pad2(parseInt(d))}`;
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dateStr = `${year}-${pad2(month)}-01`;
        }

        // Clean amount
        amtStr = amtStr.replace(/[£$,]/g, "").trim();
        const amt = parseFloat(amtStr);

        // Match category
        const matchedCat = SPENDING_CATEGORIES.find(c =>
          c.toLowerCase() === cat.toLowerCase()
        ) || SPENDING_CATEGORIES.find(c =>
          c.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(c.toLowerCase().split("/")[0])
        ) || "Other";

        newRows.push({
          id: null,
          date: dateStr,
          description: desc,
          category: matchedCat,
          amount: isNaN(amt) ? "" : amt.toFixed(2),
          dirty: true,
          saving: false,
        });
      }
    }

    if (newRows.length > 0) {
      setRows(prev => [...prev, ...newRows]);
      toast({ title: `${newRows.length} rows pasted`, description: "Review and save with Enter or Tab past the last column" });
    }
  }, [year, month, toast]);

  // Save all dirty rows
  const saveAllDirty = useCallback(async () => {
    const dirtyIdxs = rows.map((r, i) => r.dirty ? i : -1).filter(i => i >= 0);
    for (const idx of dirtyIdxs) {
      await saveRow(idx);
    }
    onRefetch();
  }, [rows, saveRow, onRefetch]);

  // Category totals for this month
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const amt = parseFloat(row.amount);
      if (!isNaN(amt) && amt > 0 && row.category) {
        totals[row.category] = (totals[row.category] || 0) + amt;
      }
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const monthTotal = useMemo(() =>
    rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0), [rows]);

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
              Save {dirtyCount} {dirtyCount === 1 ? "change" : "changes"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ClipboardPaste className="h-4 w-4" />
          <span className="hidden sm:inline">Paste rows from Excel/Sheets • Tab to navigate • Enter to save</span>
          <span className="sm:hidden">Paste supported</span>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b sticky top-0 z-10">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-[130px]">Date</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[180px]">Description</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-[200px]">Category</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground w-[120px]">Amount (£)</th>
              <th className="px-2 py-2.5 w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div className="space-y-3">
                    <p className="text-muted-foreground">No expenses this month</p>
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
                  "border-b last:border-0 transition-colors",
                  row.dirty && "bg-accent/30",
                  row.saving && "opacity-60",
                  deleteConfirm === ri && "bg-destructive/10"
                )}
              >
                {/* Date */}
                <td className="px-1 py-0.5">
                  <input
                    ref={el => setRef(`${ri}-0`, el)}
                    type="date"
                    value={row.date}
                    onChange={e => updateRow(ri, "date", e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ri, 0)}
                    onBlur={() => saveRow(ri)}
                    className="w-full px-2 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-sm"
                    disabled={row.saving}
                  />
                </td>
                {/* Description */}
                <td className="px-1 py-0.5">
                  <input
                    ref={el => setRef(`${ri}-1`, el)}
                    type="text"
                    value={row.description}
                    onChange={e => updateRow(ri, "description", e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ri, 1)}
                    onBlur={() => saveRow(ri)}
                    placeholder="What was it for?"
                    className="w-full px-2 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-sm placeholder:text-muted-foreground/40"
                    disabled={row.saving}
                  />
                </td>
                {/* Category */}
                <td className="px-1 py-0.5">
                  <Select
                    value={row.category}
                    onValueChange={v => {
                      updateRow(ri, "category", v);
                      // Auto-save after category selection if row is otherwise complete
                      const r = rows[ri];
                      if (r && r.date && r.amount && parseFloat(r.amount) > 0) {
                        setTimeout(() => saveRow(ri), 100);
                      }
                    }}
                  >
                    <SelectTrigger
                      ref={el => setRef(`${ri}-2`, el as any)}
                      className="border-0 shadow-none bg-transparent h-8 text-sm focus:ring-2 focus:ring-primary/30"
                      onKeyDown={e => handleKeyDown(e, ri, 2)}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SPENDING_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                {/* Amount */}
                <td className="px-1 py-0.5">
                  <input
                    ref={el => setRef(`${ri}-3`, el)}
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={e => updateRow(ri, "amount", e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ri, 3)}
                    onBlur={() => saveRow(ri)}
                    placeholder="0.00"
                    className="w-full px-2 py-1.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-primary/30 rounded text-sm text-right placeholder:text-muted-foreground/40"
                    disabled={row.saving}
                  />
                </td>
                {/* Actions */}
                <td className="px-1 py-0.5 text-center">
                  {deleteConfirm === ri ? (
                    <div className="flex gap-0.5">
                      <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteRow(ri)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirm(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 hover:text-destructive"
                      style={{ opacity: undefined }}
                      onFocus={e => (e.currentTarget.style.opacity = "1")}
                      onBlur={e => (e.currentTarget.style.opacity = "")}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "")}
                      onClick={() => setDeleteConfirm(ri)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            {rows.length > 0 && (
              <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                <td className="px-3 py-2.5" colSpan={3}>
                  TOTAL — {rows.length} {rows.length === 1 ? "entry" : "entries"}
                </td>
                <td className="px-3 py-2.5 text-right">{formatGBP(monthTotal)}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Category subtotals */}
      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {categoryTotals.map(([cat, total]) => (
            <div key={cat} className="px-3 py-2 rounded-md bg-muted/40 text-sm flex justify-between gap-2">
              <span className="truncate text-muted-foreground">{cat}</span>
              <span className="font-medium shrink-0">{formatGBP(total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
