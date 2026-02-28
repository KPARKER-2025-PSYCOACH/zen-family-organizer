import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
}

export interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  collapsed: boolean;
  starred: boolean;
  position: number;
}

export const useTodoData = () => {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: listRows, error: listErr } = await supabase
      .from("todo_lists")
      .select("*")
      .order("position", { ascending: true });

    if (listErr) { console.error(listErr); setLoading(false); return; }

    const { data: itemRows, error: itemErr } = await supabase
      .from("todo_items")
      .select("*")
      .order("position", { ascending: true });

    if (itemErr) { console.error(itemErr); setLoading(false); return; }

    const mapped: TodoList[] = (listRows || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      collapsed: l.collapsed,
      starred: l.starred,
      position: l.position,
      items: (itemRows || [])
        .filter((i: any) => i.list_id === l.id)
        .map((i: any) => ({ id: i.id, text: i.text, completed: i.completed, position: i.position })),
    }));

    setLists(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const addList = async (name: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const position = lists.length;
    const { data, error } = await supabase
      .from("todo_lists")
      .insert({ user_id: session.user.id, name, position })
      .select()
      .single();
    if (error) { toast.error("Failed to create list"); return; }
    setLists(prev => [...prev, { id: data.id, name, collapsed: false, starred: false, position, items: [] }]);
  };

  const deleteList = async (listId: string) => {
    await supabase.from("todo_lists").delete().eq("id", listId);
    setLists(prev => prev.filter(l => l.id !== listId));
  };

  const toggleCollapse = async (listId: string) => {
    setLists(prev => prev.map(l => l.id === listId ? { ...l, collapsed: !l.collapsed } : l));
    const list = lists.find(l => l.id === listId);
    if (list) await supabase.from("todo_lists").update({ collapsed: !list.collapsed }).eq("id", listId);
  };

  const toggleStar = async (listId: string) => {
    const newLists = lists.map(l => ({ ...l, starred: l.id === listId ? !l.starred : false }));
    setLists(newLists);
    // Unstar all, then star the selected
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("todo_lists").update({ starred: false }).eq("user_id", session.user.id);
    const target = lists.find(l => l.id === listId);
    if (target && !target.starred) {
      await supabase.from("todo_lists").update({ starred: true }).eq("id", listId);
    }
  };

  const reorderLists = async (reordered: TodoList[]) => {
    setLists(reordered);
    const updates = reordered.map((l, i) => supabase.from("todo_lists").update({ position: i }).eq("id", l.id));
    await Promise.all(updates);
  };

  const addItem = async (listId: string, text: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const list = lists.find(l => l.id === listId);
    const position = list ? list.items.length : 0;
    const { data, error } = await supabase
      .from("todo_items")
      .insert({ list_id: listId, user_id: session.user.id, text, position })
      .select()
      .single();
    if (error) { toast.error("Failed to add item"); return; }
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, items: [...l.items, { id: data.id, text, completed: false, position }] } : l
    ));
  };

  const toggleItem = async (listId: string, itemId: string) => {
    const list = lists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (!item) return;
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) } : l
    ));
    await supabase.from("todo_items").update({ completed: !item.completed }).eq("id", itemId);
  };

  const deleteItem = async (listId: string, itemId: string) => {
    await supabase.from("todo_items").delete().eq("id", itemId);
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
    ));
  };

  return { lists, loading, addList, deleteList, toggleCollapse, toggleStar, reorderLists, addItem, toggleItem, deleteItem };
};
