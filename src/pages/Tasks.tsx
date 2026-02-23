import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";
import {
  Plus,
  X,
  GripVertical,
  ChefHat,
  ShoppingCart,
  Flame,
  Loader,
  Trash2,
  Baby,
  Bus,
  BookOpen,
  Bath,
  Moon,
  Sandwich,
  Shirt,
  Sparkles,
  Flower2,
  Dog,
  Sofa,
  Receipt,
  CalendarCheck,
  PartyPopper,
  Car,
  UserPlus,
  Pencil,
  Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────
interface Task {
  id: string;
  text: string;
  category: string;
  icon: string;
}

interface FamilyMember {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

interface TasksState {
  members: FamilyMember[];
  library: Task[];
  customTasks: Task[];
}

// ── Constants ─────────────────────────────────────────
const STORAGE_KEY = "parentassist_family_tasks";

const AVATAR_COLORS = [
  "hsl(175 26% 34%)",
  "hsl(17 51% 58%)",
  "hsl(103 20% 45%)",
  "hsl(260 50% 55%)",
  "hsl(340 55% 55%)",
  "hsl(30 70% 55%)",
  "hsl(200 60% 45%)",
  "hsl(50 70% 50%)",
];

const ICON_MAP: Record<string, React.ReactNode> = {
  "chef-hat": <ChefHat className="h-3.5 w-3.5" />,
  "shopping-cart": <ShoppingCart className="h-3.5 w-3.5" />,
  flame: <Flame className="h-3.5 w-3.5" />,
  loader: <Loader className="h-3.5 w-3.5" />,
  trash2: <Trash2 className="h-3.5 w-3.5" />,
  baby: <Baby className="h-3.5 w-3.5" />,
  bus: <Bus className="h-3.5 w-3.5" />,
  "book-open": <BookOpen className="h-3.5 w-3.5" />,
  bath: <Bath className="h-3.5 w-3.5" />,
  moon: <Moon className="h-3.5 w-3.5" />,
  sandwich: <Sandwich className="h-3.5 w-3.5" />,
  shirt: <Shirt className="h-3.5 w-3.5" />,
  sparkles: <Sparkles className="h-3.5 w-3.5" />,
  flower2: <Flower2 className="h-3.5 w-3.5" />,
  dog: <Dog className="h-3.5 w-3.5" />,
  sofa: <Sofa className="h-3.5 w-3.5" />,
  receipt: <Receipt className="h-3.5 w-3.5" />,
  "calendar-check": <CalendarCheck className="h-3.5 w-3.5" />,
  "party-popper": <PartyPopper className="h-3.5 w-3.5" />,
  car: <Car className="h-3.5 w-3.5" />,
};

const DEFAULT_LIBRARY: Task[] = [
  // Kitchen
  { id: "t-1", text: "Meal Planning", category: "Kitchen", icon: "chef-hat" },
  { id: "t-2", text: "Grocery Shopping", category: "Kitchen", icon: "shopping-cart" },
  { id: "t-3", text: "Cooking Dinner", category: "Kitchen", icon: "flame" },
  { id: "t-4", text: "Loading Dishwasher", category: "Kitchen", icon: "loader" },
  { id: "t-5", text: "Emptying Bins", category: "Kitchen", icon: "trash2" },
  // Kids
  { id: "t-6", text: "School Drop-off", category: "Kids", icon: "bus" },
  { id: "t-7", text: "School Pick-up", category: "Kids", icon: "bus" },
  { id: "t-8", text: "Homework Help", category: "Kids", icon: "book-open" },
  { id: "t-9", text: "Bath Time", category: "Kids", icon: "bath" },
  { id: "t-10", text: "Bedtime Routine", category: "Kids", icon: "moon" },
  { id: "t-11", text: "Packing Lunchboxes", category: "Kids", icon: "sandwich" },
  // Home
  { id: "t-12", text: "Laundry & Folding", category: "Home", icon: "shirt" },
  { id: "t-13", text: "Vacuuming/Mopping", category: "Home", icon: "sparkles" },
  { id: "t-14", text: "Watering Plants", category: "Home", icon: "flower2" },
  { id: "t-15", text: "Pet Feeding", category: "Home", icon: "dog" },
  { id: "t-16", text: "Tidying Living Room", category: "Home", icon: "sofa" },
  // Admin
  { id: "t-17", text: "Paying Bills", category: "Admin", icon: "receipt" },
  { id: "t-18", text: "Booking Appointments", category: "Admin", icon: "calendar-check" },
  { id: "t-19", text: "Birthday Party Planning", category: "Admin", icon: "party-popper" },
  { id: "t-20", text: "Car Maintenance", category: "Admin", icon: "car" },
];

const loadState = (): TasksState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { members: [], library: DEFAULT_LIBRARY, customTasks: [] };
};

const saveState = (state: TasksState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// ── Draggable Task Card ───────────────────────────────
const DraggableTask = ({
  task,
  onDelete,
  origin,
}: {
  task: Task;
  onDelete?: () => void;
  origin: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${origin}::${task.id}`,
    data: { task, origin },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-sm shadow-sm group cursor-grab active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground shrink-0">{ICON_MAP[task.icon] ?? null}</span>
      <span className="flex-1 truncate">{task.text}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Overlay (ghost while dragging) ────────────────────
const TaskOverlay = ({ task }: { task: Task }) => (
  <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-sm shadow-lg w-52">
    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="text-muted-foreground">{ICON_MAP[task.icon] ?? null}</span>
    <span className="flex-1 truncate">{task.text}</span>
  </div>
);

// ── Droppable Member Column ───────────────────────────
const MemberColumn = ({
  member,
  onRename,
  onRemove,
  onDeleteTask,
}: {
  member: FamilyMember;
  onRename: (name: string) => void;
  onRemove: () => void;
  onDeleteTask: (taskId: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `member::${member.id}` });
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(member.name);

  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 transition-colors min-w-[220px] w-[220px] shrink-0 ${
        isOver ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Avatar className="h-8 w-8">
          <AvatarFallback style={{ backgroundColor: member.color, color: "#fff", fontSize: 12 }}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {editing ? (
          <form
            className="flex-1 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              onRename(nameVal.trim() || member.name);
              setEditing(false);
            }}
          >
            <Input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onBlur={() => {
                onRename(nameVal.trim() || member.name);
                setEditing(false);
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm font-semibold truncate hover:underline"
          >
            {member.name}
          </button>
        )}
        {!editing && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 p-2 min-h-[200px] max-h-[60vh]">
        <div className="space-y-2">
          {member.tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Drop tasks here
            </p>
          )}
          {member.tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              origin={`member::${member.id}`}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────
const TasksPage = () => {
  const [state, setState] = useState<TasksState>(loadState);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [customTaskText, setCustomTaskText] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Handlers ──
  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    const color = AVATAR_COLORS[state.members.length % AVATAR_COLORS.length];
    setState((prev) => ({
      ...prev,
      members: [...prev.members, { id: crypto.randomUUID(), name, color, tasks: [] }],
    }));
    setNewMemberName("");
  };

  const removeMember = (id: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

  const renameMember = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, name } : m)),
    }));
  };

  const addCustomTask = () => {
    const text = customTaskText.trim();
    if (!text) return;
    const task: Task = { id: crypto.randomUUID(), text, category: "Custom", icon: "sparkles" };
    setState((prev) => ({ ...prev, customTasks: [...prev.customTasks, task] }));
    setCustomTaskText("");
  };

  const deleteLibraryTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      library: prev.library.filter((t) => t.id !== taskId),
      customTasks: prev.customTasks.filter((t) => t.id !== taskId),
    }));
  };

  const deleteMemberTask = (memberId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) } : m
      ),
    }));
  };

  // ── DnD ──
  const onDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task: Task = active.data.current?.task;
    const originStr: string = active.data.current?.origin;
    const destStr = String(over.id);

    if (!task || !originStr) return;

    // Determine destination member
    const destMemberId = destStr.startsWith("member::") ? destStr.replace("member::", "") : null;
    if (!destMemberId) return;

    // Remove from origin if it was a member column
    const originMemberId = originStr.startsWith("member::") ? originStr.replace("member::", "") : null;

    setState((prev) => {
      let members = prev.members;

      // Remove from origin member
      if (originMemberId) {
        members = members.map((m) =>
          m.id === originMemberId ? { ...m, tasks: m.tasks.filter((t) => t.id !== task.id) } : m
        );
      }

      // Create a fresh copy of the task when dragging from library
      const newTask = originMemberId ? task : { ...task, id: crypto.randomUUID() };

      // Add to destination member (avoid duplicates for same-column drops)
      members = members.map((m) =>
        m.id === destMemberId && (originMemberId !== destMemberId || !originMemberId)
          ? { ...m, tasks: [...m.tasks, newTask] }
          : m
      );

      return { ...prev, members };
    });
  };

  const allLibraryTasks = [...state.library, ...state.customTasks];
  const categories = [...new Set(allLibraryTasks.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Balance Family Tasks" subtitle="Assign and track household responsibilities" />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="container mx-auto px-4 py-6">
          {/* Add member bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addMember();
                }}
                className="flex gap-3"
              >
                <Input
                  placeholder="Family member name…"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 max-w-xs"
                />
                <Button type="submit" disabled={!newMemberName.trim()}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Family Member
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex gap-6">
            {/* Task library sidebar */}
            <div className="w-64 shrink-0">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Task Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add custom task */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCustomTask();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Custom task…"
                      value={customTaskText}
                      onChange={(e) => setCustomTaskText(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button type="submit" size="sm" variant="secondary" disabled={!customTaskText.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </form>

                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-4 pr-2">
                      {categories.map((cat) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {cat}
                          </p>
                          <div className="space-y-1.5">
                            {allLibraryTasks
                              .filter((t) => t.category === cat)
                              .map((task) => (
                                <DraggableTask
                                  key={task.id}
                                  task={task}
                                  origin="library"
                                  onDelete={() => deleteLibraryTask(task.id)}
                                />
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Member columns */}
            <div className="flex-1 overflow-x-auto">
              {state.members.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No family members yet</p>
                  <p className="text-sm mt-1">Add a member above, then drag tasks into their column</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  {state.members.map((member) => (
                    <MemberColumn
                      key={member.id}
                      member={member}
                      onRename={(name) => renameMember(member.id, name)}
                      onRemove={() => removeMember(member.id)}
                      onDeleteTask={(taskId) => deleteMemberTask(member.id, taskId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>{activeTask ? <TaskOverlay task={activeTask} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
};

export default TasksPage;
