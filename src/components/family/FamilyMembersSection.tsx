import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Camera, Cake, Heart, X, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyMembers, calculateAge, MEMBER_COLORS, type FamilyMemberProfile } from "@/hooks/useFamilyMembers";

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Gluten Free", "Dairy Free",
  "Nut Free", "Egg Free", "Soy Free", "Lactose Intolerant", "Low Carb", "Keto", "Paleo",
  "Halal", "Kosher", "Low Sodium", "Diabetic Friendly",
];

interface FamilyMembersSectionProps {
  members: FamilyMemberProfile[];
  loading: boolean;
  onAdd: (member: Omit<FamilyMemberProfile, "id" | "user_id" | "created_at" | "updated_at">) => Promise<FamilyMemberProfile>;
  onUpdate: (id: string, updates: Partial<FamilyMemberProfile>) => Promise<FamilyMemberProfile>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm = (): Partial<FamilyMemberProfile> => ({
  name: "",
  birth_date: null,
  photo_url: null,
  color: MEMBER_COLORS[0],
  dietary_requirements: [],
  likes: [],
  dislikes: [],
  hobbies: [],
  notes: null,
});

const FamilyMembersSection = ({ members, loading, onAdd, onUpdate, onDelete }: FamilyMembersSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FamilyMemberProfile>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [customDietaryInput, setCustomDietaryInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), color: MEMBER_COLORS[members.length % MEMBER_COLORS.length] });
    setCustomDietaryInput("");
    setDialogOpen(true);
  };

  const openEdit = (m: FamilyMemberProfile) => {
    setEditingId(m.id);
    setForm({ ...m });
    setCustomDietaryInput("");
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo");
    }
  };

  const toggleDietary = (req: string) => {
    const current = form.dietary_requirements || [];
    setForm({ ...form, dietary_requirements: current.includes(req) ? current.filter(r => r !== req) : [...current, req] });
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name!,
        birth_date: form.birth_date || null,
        photo_url: form.photo_url || null,
        color: form.color || MEMBER_COLORS[0],
        dietary_requirements: form.dietary_requirements || [],
        likes: form.likes || [],
        dislikes: form.dislikes || [],
        hobbies: form.hobbies || [],
        notes: form.notes || null,
      };
      if (editingId) {
        await onUpdate(editingId, payload);
        toast.success("Member updated!");
      } else {
        await onAdd(payload);
        toast.success("Member added!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8 text-center text-muted-foreground">Loading family members…</CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Family Members</h2>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </div>

        {members.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No family members yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your family to personalise meals, gifts, and tasks</p>
              <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add First Member</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {members.map(m => {
              const age = calculateAge(m.birth_date);
              return (
                <Card key={m.id} className="shadow-soft hover:shadow-glow transition-all cursor-pointer group relative" onClick={() => openEdit(m)}>
                  <CardContent className="pt-4 pb-3 px-3 flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 mb-2">
                      {m.photo_url ? (
                        <AvatarImage src={m.photo_url} alt={m.name} />
                      ) : null}
                      <AvatarFallback style={{ backgroundColor: m.color, color: "#fff", fontSize: 16 }}>
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate w-full">{m.name}</p>
                    {age !== null && (
                      <p className="text-xs text-muted-foreground">{age} years old</p>
                    )}
                    {m.dietary_requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-center">
                        {m.dietary_requirements.slice(0, 2).map(r => (
                          <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                        ))}
                        {m.dietary_requirements.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{m.dietary_requirements.length - 2}</Badge>
                        )}
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
            {/* Add card */}
            <Card className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={openAdd}>
              <CardContent className="pt-4 pb-3 px-3 flex flex-col items-center justify-center h-full text-muted-foreground">
                <Plus className="h-8 w-8 mb-1" />
                <p className="text-xs">Add</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Family Member" : "Add Family Member"}</DialogTitle>
            <DialogDescription>Save their details to personalise meals, gifts, and task assignments</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo + Color */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {form.photo_url ? <AvatarImage src={form.photo_url} /> : null}
                  <AvatarFallback style={{ backgroundColor: form.color, color: "#fff", fontSize: 20 }}>
                    {form.name ? initials(form.name) : <Camera className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Or pick a colour</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {MEMBER_COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, photo_url: null, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name + Birth Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emily" />
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.birth_date || ""} onChange={e => setForm({ ...form, birth_date: e.target.value || null })} />
                {form.birth_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Cake className="h-3 w-3" /> {calculateAge(form.birth_date)} years old
                  </p>
                )}
              </div>
            </div>

            {/* Dietary Requirements */}
            <div className="space-y-2">
              <Label>Dietary Requirements</Label>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map(r => (
                  <Badge
                    key={r}
                    variant={form.dietary_requirements?.includes(r) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleDietary(r)}
                  >{r}</Badge>
                ))}
                {/* Show any custom ones already saved that aren't in the standard list */}
                {(form.dietary_requirements || []).filter(r => !DIETARY_OPTIONS.includes(r)).map(r => (
                  <Badge
                    key={r}
                    variant="default"
                    className="cursor-pointer text-xs"
                    onClick={() => toggleDietary(r)}
                  >{r} ✕</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom requirement…"
                  value={customDietaryInput}
                  onChange={e => setCustomDietaryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = customDietaryInput.trim();
                      if (trimmed && !(form.dietary_requirements || []).includes(trimmed)) {
                        setForm({ ...form, dietary_requirements: [...(form.dietary_requirements || []), trimmed] });
                      }
                      setCustomDietaryInput("");
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => {
                    const trimmed = customDietaryInput.trim();
                    if (trimmed && !(form.dietary_requirements || []).includes(trimmed)) {
                      setForm({ ...form, dietary_requirements: [...(form.dietary_requirements || []), trimmed] });
                    }
                    setCustomDietaryInput("");
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Likes */}
            <div className="space-y-1">
              <Label>Likes <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input
                placeholder="e.g. Pasta, Football, Drawing"
                value={form.likes?.join(", ") || ""}
                onChange={e => setForm({ ...form, likes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              />
            </div>

            {/* Dislikes */}
            <div className="space-y-1">
              <Label>Dislikes <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input
                placeholder="e.g. Mushrooms, Loud noises"
                value={form.dislikes?.join(", ") || ""}
                onChange={e => setForm({ ...form, dislikes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              />
            </div>

            {/* Hobbies */}
            <div className="space-y-1">
              <Label>Hobbies & Interests <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input
                placeholder="e.g. Reading, Swimming, Lego"
                value={form.hobbies?.join(", ") || ""}
                onChange={e => setForm({ ...form, hobbies: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                placeholder="Anything else useful…"
                value={form.notes || ""}
                onChange={e => setForm({ ...form, notes: e.target.value || null })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : editingId ? "Update Member" : "Add Member"}
              </Button>
              {editingId && (
                <Button variant="destructive" onClick={() => { handleDelete(editingId); setDialogOpen(false); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyMembersSection;
