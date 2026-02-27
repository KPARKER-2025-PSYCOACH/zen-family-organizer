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
  GripVertical,
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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

/* ── Sortable list card ── */
interface SortableListCardProps {
  list: TodoList;
  toggleCollapse: (id: string) => void;
  deleteList: (id: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  addItem: (listId: string) => void;
  newItemText: string;
  setNewItemText: (listId: string, value: string) => void;
  inputRef: (listId: string, el: HTMLInputElement | null) => void;
}

const SortableListCard = ({
  list,
  toggleCollapse,
  deleteList,
  toggleItem,
  deleteItem,
  addItem,
  newItemText,
  setNewItemText,
  inputRef,
}: SortableListCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = list.items.filter((i) => i.completed).length;
  const totalCount = list.items.length;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Drag handle */}
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addItem(list.id);
              }}
              className="flex gap-2 pt-2"
            >
              <Input
                ref={(el) => inputRef(list.id, el)}
                placeholder="Add an item…"
                value={newItemText}
                onChange={(e) => setNewItemText(list.id, e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!newItemText.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

/* ── Page ── */
const TodosPage = () => {
  const [lists, setLists] = useState<TodoList[]>(loadLists);
  const [newListName, setNewListName] = useState("");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const newItemRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLists((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  const activeList = lists.find((l) => l.id === activeId);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="To Do Lists"
        subtitle="Keep track of tasks, errands, and reminders"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
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

        {lists.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No lists yet</p>
            <p className="text-sm mt-1">Create your first list above</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((l) => l.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <SortableListCard
                  key={list.id}
                  list={list}
                  toggleCollapse={toggleCollapse}
                  deleteList={deleteList}
                  toggleItem={toggleItem}
                  deleteItem={deleteItem}
                  addItem={addItem}
                  newItemText={newItemTexts[list.id] || ""}
                  setNewItemText={(id, val) =>
                    setNewItemTexts((prev) => ({ ...prev, [id]: val }))
                  }
                  inputRef={(id, el) => {
                    newItemRefs.current[id] = el;
                  }}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeList ? (
              <Card className="shadow-lg rotate-2 opacity-90">
                <CardHeader className="pb-3">
                  <CardTitle className="truncate">{activeList.name}</CardTitle>
                </CardHeader>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TodosPage;
