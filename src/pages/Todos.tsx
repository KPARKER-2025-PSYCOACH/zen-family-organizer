import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  collapsed: boolean;
}

const STORAGE_KEY = "parentassist_todo_lists";

const loadLists = (): TodoList[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLists = (lists: TodoList[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
};

const TodosPage = () => {
  const [lists, setLists] = useState<TodoList[]>(loadLists);
  const [newListName, setNewListName] = useState("");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const newItemRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  const addList = () => {
    const name = newListName.trim();
    if (!name) return;
    setLists((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, items: [], collapsed: false },
    ]);
    setNewListName("");
  };

  const deleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const toggleCollapse = (listId: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, collapsed: !l.collapsed } : l))
    );
  };

  const addItem = (listId: string) => {
    const text = (newItemTexts[listId] || "").trim();
    if (!text) return;
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: [
                ...l.items,
                { id: crypto.randomUUID(), text, completed: false },
              ],
            }
          : l
      )
    );
    setNewItemTexts((prev) => ({ ...prev, [listId]: "" }));
    // Re-focus the input
    setTimeout(() => newItemRefs.current[listId]?.focus(), 0);
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, completed: !i.completed } : i
              ),
            }
          : l
      )
    );
  };

  const deleteItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="To Do Lists"
        subtitle="Keep track of tasks, errands, and reminders"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Create new list */}
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addList();
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="New list name…"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newListName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Create list
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lists */}
        {lists.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No lists yet</p>
            <p className="text-sm mt-1">Create your first list above</p>
          </div>
        )}

        {lists.map((list) => {
          const completedCount = list.items.filter((i) => i.completed).length;
          const totalCount = list.items.length;

          return (
            <Card key={list.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(list.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    {list.collapsed ? (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <CardTitle className="truncate">{list.name}</CardTitle>
                    {totalCount > 0 && (
                      <span className="text-sm font-normal text-muted-foreground shrink-0">
                        {completedCount}/{totalCount}
                      </span>
                    )}
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{list.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the list and all its items.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteList(list.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              {!list.collapsed && (
                <CardContent className="space-y-2">
                  {list.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 group"
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(list.id, item.id)}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteItem(list.id, item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}

                  {/* Add item */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addItem(list.id);
                    }}
                    className="flex gap-2 pt-2"
                  >
                    <Input
                      ref={(el) => { newItemRefs.current[list.id] = el; }}
                      placeholder="Add an item…"
                      value={newItemTexts[list.id] || ""}
                      onChange={(e) =>
                        setNewItemTexts((prev) => ({
                          ...prev,
                          [list.id]: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={!(newItemTexts[list.id] || "").trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TodosPage;
