import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SPENDING_CATEGORIES = [
  "Bills",
  "Groceries",
  "Car/ Transport Costs",
  "Insurance/Tax",
  "Childcare/Nursery Fees",
  "Clubs/ Sports",
  "Clothes & Shoes",
  "Dining & Takeaways",
  "Subscriptions/Memberships",
  "Outings/ Leisure",
  "Savings Contribution",
  "Holiday/Vacation",
  "Debt/Loan Repayments",
  "Other",
] as const;

export type SpendingCategory = typeof SPENDING_CATEGORIES[number];

export interface SpendingEntry {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface EntryInput {
  date: string;
  description: string;
  amount: number;
  category: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const getMonthName = (m: number) => MONTHS[m - 1] || "";
export const getMonthShort = (m: number) => MONTHS[m - 1]?.substring(0, 3) || "";

export const formatGBP = (v: number) => `£${v.toFixed(2)}`;

export function useSpendingData(year: number) {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("spending_entries")
      .select("*")
      .eq("year", year)
      .eq("user_id", session.user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Failed to fetch spending:", error);
    } else {
      setEntries((data as SpendingEntry[]) || []);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async (entry: EntryInput) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const d = new Date(entry.date);
    const { error } = await supabase.from("spending_entries").insert({
      user_id: session.user.id,
      date: entry.date,
      description: entry.description,
      amount: entry.amount,
      category: entry.category,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
    if (error) {
      toast({ title: "Error", description: "Failed to add entry", variant: "destructive" });
    } else {
      toast({ title: "Expense added" });
      fetchEntries();
    }
  };

  const updateEntry = async (id: string, entry: EntryInput) => {
    const d = new Date(entry.date);
    const { error } = await supabase.from("spending_entries").update({
      date: entry.date,
      description: entry.description,
      amount: entry.amount,
      category: entry.category,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to update entry", variant: "destructive" });
    } else {
      toast({ title: "Expense updated" });
      fetchEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("spending_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Aggregations
  const totalByCategory = useMemo(() =>
    SPENDING_CATEGORIES.map(cat => ({
      category: cat,
      total: entries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
    })), [entries]);

  const totalByMonth = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: MONTHS[i].substring(0, 3),
      total: entries.filter(e => e.month === i + 1).reduce((s, e) => s + Number(e.amount), 0),
    })), [entries]);

  const grandTotal = useMemo(() =>
    entries.reduce((s, e) => s + Number(e.amount), 0), [entries]);

  const topCategory = useMemo(() => {
    const sorted = [...totalByCategory].sort((a, b) => b.total - a.total);
    return sorted[0]?.total > 0 ? sorted[0].category : null;
  }, [totalByCategory]);

  const monthsWithData = useMemo(() =>
    new Set(entries.map(e => e.month)).size, [entries]);

  const avgPerMonth = useMemo(() =>
    monthsWithData > 0 ? grandTotal / monthsWithData : 0, [grandTotal, monthsWithData]);

  return {
    entries, loading, addEntry, updateEntry, deleteEntry,
    totalByCategory, totalByMonth, grandTotal, topCategory, avgPerMonth,
    entryCount: entries.length, refetch: fetchEntries,
  };
}
