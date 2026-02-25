import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { SPENDING_CATEGORIES } from "@/hooks/useSpendingData";

interface Props {
  onAdd: (entry: { date: string; description: string; amount: number; category: string }) => Promise<void>;
}

const AddSpendingDialog = ({ onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!category || !amount || !date) return;
    setSaving(true);
    await onAdd({ date, description, amount: parseFloat(amount), category });
    setSaving(false);
    setOpen(false);
    setDescription("");
    setAmount("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
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
          <Button onClick={handleSubmit} disabled={saving || !category || !amount} className="w-full">
            {saving ? "Saving..." : "Add Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSpendingDialog;
