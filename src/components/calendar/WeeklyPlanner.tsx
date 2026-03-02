import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlannerItem {
  id: string;
  text: string;
}

interface WeeklyPlannerProps {
  weekStart: Date;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const STORAGE_KEY = "parentassist_weekly_planner";

const getWeekKey = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
};

const WeeklyPlanner = ({ weekStart }: WeeklyPlannerProps) => {
  const weekKey = getWeekKey(weekStart);
  const [items, setItems] = useState<Record<string, PlannerItem[]>>({});
  const [newTexts, setNewTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${weekKey}`);
      if (stored) setItems(JSON.parse(stored));
      else setItems({});
    } catch {
      setItems({});
    }
  }, [weekKey]);

  const save = useCallback((updated: Record<string, PlannerItem[]>) => {
    setItems(updated);
    localStorage.setItem(`${STORAGE_KEY}_${weekKey}`, JSON.stringify(updated));
  }, [weekKey]);

  const addItem = (day: string) => {
    const text = (newTexts[day] || "").trim();
    if (!text) return;
    const updated = { ...items, [day]: [...(items[day] || []), { id: `${Date.now()}`, text }] };
    save(updated);
    setNewTexts(prev => ({ ...prev, [day]: "" }));
  };

  const removeItem = (day: string, id: string) => {
    const updated = { ...items, [day]: (items[day] || []).filter(i => i.id !== id) };
    save(updated);
  };

  const updateItem = (day: string, id: string, text: string) => {
    const updated = { ...items, [day]: (items[day] || []).map(i => i.id === id ? { ...i, text } : i) };
    save(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Weekly Planner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {WEEKDAYS.map(day => (
            <div key={day} className="space-y-2">
              <p className="text-sm font-semibold text-center border-b pb-1">{day}</p>
              <div className="space-y-1 min-h-[60px]">
                {(items[day] || []).map(item => (
                  <div key={item.id} className="flex items-center gap-1 group">
                    <Input
                      value={item.text}
                      onChange={e => updateItem(day, item.id, e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                    <button
                      onClick={() => removeItem(day, item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <form
                onSubmit={e => { e.preventDefault(); addItem(day); }}
                className="flex gap-1"
              >
                <Input
                  placeholder="Add…"
                  value={newTexts[day] || ""}
                  onChange={e => setNewTexts(prev => ({ ...prev, [day]: e.target.value }))}
                  className="h-7 text-xs px-2"
                />
                <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={!(newTexts[day] || "").trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPlanner;
