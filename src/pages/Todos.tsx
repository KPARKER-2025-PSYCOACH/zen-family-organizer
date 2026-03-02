import { useState, useRef } from "react";
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
  Star,
  Pencil,
  Check,
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
import { useTodoData, type TodoList } from "@/hooks/useTodoData";

/* ── Sortable list card ── */
interface SortableListCardProps {
  list: TodoList;
  toggleCollapse: (id: string) => void;
  deleteList: (id: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  addItem: (listId: string, text: string) => void;
  toggleStar: (id: string) => void;
  renameList: (id: string, name: string) => void;
  updateItemText: (listId: string, itemId: string, text: string) => void;
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
  toggleStar,
  renameList,
  updateItemText,
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

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.name);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = list.items.filter((i) => i.completed).length;
  const totalCount = list.items.length;

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== list.name) renameList(list.id, trimmed);
    setEditingTitle(false);
  };

  const startEditItem = (itemId: string, text: string) => {
    setEditingItemId(itemId);
    setItemDraft(text);
  };

  const commitItemEdit = () => {
    if (editingItemId && itemDraft.trim()) {
      updateItemText(list.id, editingItemId, itemDraft.trim());
    }
    setEditingItemId(null);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`h-full ${list.starred ? "ring-2 ring-yellow-400/60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {editingTitle ? (
              <form onSubmit={e => { e.preventDefault(); commitTitle(); }} className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  autoFocus
                  className="h-8 text-sm font-semibold"
                />
                <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => toggleCollapse(list.id)}
                onDoubleClick={(e) => { e.stopPropagation(); setTitleDraft(list.name); setEditingTitle(true); }}
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
            )}

            {!editingTitle && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => { setTitleDraft(list.name); setEditingTitle(true); }}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => toggleStar(list.id)}
              aria-label={list.starred ? "Unstar list" : "Star as priority list"}
            >
              <Star className={`h-4 w-4 ${list.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </Button>

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
                {editingItemId === item.id ? (
                  <form onSubmit={e => { e.preventDefault(); commitItemEdit(); }} className="flex items-center gap-2 flex-1">
                    <Input
                      value={itemDraft}
                      onChange={e => setItemDraft(e.target.value)}
                      onBlur={commitItemEdit}
                      autoFocus
                      className="h-7 text-sm"
                    />
                    <Button type="submit" size="icon" variant="ghost" className="h-6 w-6">
                      <Check className="h-3 w-3" />
                    </Button>
                  </form>
                ) : (
                  <span
                    className={`flex-1 text-sm cursor-pointer ${
                      item.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                    onDoubleClick={() => startEditItem(item.id, item.text)}
                  >
                    {item.text}
                  </span>
                )}
                {editingItemId !== item.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => startEditItem(item.id, item.text)}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteItem(list.id, item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = (newItemText || "").trim();
                if (!text) return;
                addItem(list.id, text);
                setNewItemText(list.id, "");
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
                disabled={!newItemText?.trim()}
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
  const { lists, loading, addList, deleteList, toggleCollapse, toggleStar, reorderLists, addItem, toggleItem, deleteItem, renameList, updateItemText } = useTodoData();
  const [newListName, setNewListName] = useState("");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const newItemRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleAddList = () => {
    const name = newListName.trim();
    if (!name) return;
    addList(name);
    setNewListName("");
  };

  const handleAddItem = (listId: string, text: string) => {
    addItem(listId, text);
    setTimeout(() => newItemRefs.current[listId]?.focus(), 0);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lists.findIndex((l) => l.id === active.id);
    const newIndex = lists.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const updated = [...lists];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    reorderLists(updated);
  };

  const activeList = lists.find((l) => l.id === activeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="To Do Lists" subtitle="Keep track of tasks, errands, and reminders" />
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="To Do Lists"
        subtitle="Keep track of tasks, errands, and reminders"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddList();
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
                  addItem={handleAddItem}
                  toggleStar={toggleStar}
                  renameList={renameList}
                  updateItemText={updateItemText}
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
