import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPENDING_CATEGORIES, type SpendingEntry, type EntryInput } from "@/hooks/useSpendingData";

interface Props {
  entry: SpendingEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: EntryInput) => Promise<void>;
}

const EditSpendingDialog = ({ entry, open, onOpenChange, onSave }: Props) => {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setDescription(entry.description || "");
      setAmount(String(entry.amount));
      setCategory(entry.category);
    }
  }, [entry]);

  const handleSubmit = async () => {
    if (!entry || !category || !amount || !date) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    await onSave(entry.id, { date, description, amount: parsed, category });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {SPENDING_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input placeholder="What was it for?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={saving || !category || !amount || parseFloat(amount) <= 0} className="w-full">
            {saving ? "Saving..." : "Update Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSpendingDialog;
