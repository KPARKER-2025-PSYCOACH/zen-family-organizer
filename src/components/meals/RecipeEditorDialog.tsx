import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { Recipe, CuisineType, RecipeDifficulty } from "@/types";

const CUISINE_TYPES: { value: CuisineType; label: string }[] = [
  { value: 'italian', label: '🇮🇹 Italian' },
  { value: 'chinese', label: '🇨🇳 Chinese' },
  { value: 'indian', label: '🇮🇳 Indian' },
  { value: 'mexican', label: '🇲🇽 Mexican' },
  { value: 'japanese', label: '🇯🇵 Japanese' },
  { value: 'thai', label: '🇹🇭 Thai' },
  { value: 'mediterranean', label: '🌊 Mediterranean' },
  { value: 'french', label: '🇫🇷 French' },
  { value: 'american', label: '🇺🇸 American' },
  { value: 'korean', label: '🇰🇷 Korean' },
  { value: 'vietnamese', label: '🇻🇳 Vietnamese' },
  { value: 'greek', label: '🇬🇷 Greek' },
  { value: 'spanish', label: '🇪🇸 Spanish' },
  { value: 'middle_eastern', label: '🌍 Middle Eastern' },
  { value: 'british', label: '🇬🇧 British' },
];

interface RecipeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Partial<Recipe> | null;
  onSave: (recipe: Recipe) => void;
  title?: string;
}

const emptyRecipe: Partial<Recipe> = {
  title: '',
  description: '',
  cuisine: 'british',
  difficulty: 'easy',
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  ingredients: [{ item: '', amount: '', unit: '' }],
  instructions: [''],
};

const RecipeEditorDialog = ({ open, onOpenChange, recipe, onSave, title = "Edit Recipe" }: RecipeEditorDialogProps) => {
  const [form, setForm] = useState<Partial<Recipe>>(emptyRecipe);

  useEffect(() => {
    if (recipe) {
      setForm({
        ...emptyRecipe,
        ...recipe,
        ingredients: recipe.ingredients?.length ? recipe.ingredients : [{ item: '', amount: '', unit: '' }],
        instructions: recipe.instructions?.length ? recipe.instructions : [''],
      });
    } else {
      setForm(emptyRecipe);
    }
  }, [recipe, open]);

  const updateField = <K extends keyof Recipe>(key: K, value: Recipe[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const ings = [...(form.ingredients || [])];
    ings[index] = { ...ings[index], [field]: value };
    setForm(prev => ({ ...prev, ingredients: ings }));
  };

  const addIngredient = () => {
    setForm(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), { item: '', amount: '', unit: '' }] }));
  };

  const removeIngredient = (index: number) => {
    setForm(prev => ({ ...prev, ingredients: (prev.ingredients || []).filter((_, i) => i !== index) }));
  };

  const updateInstruction = (index: number, value: string) => {
    const insts = [...(form.instructions || [])];
    insts[index] = value;
    setForm(prev => ({ ...prev, instructions: insts }));
  };

  const addInstruction = () => {
    setForm(prev => ({ ...prev, instructions: [...(prev.instructions || []), ''] }));
  };

  const removeInstruction = (index: number) => {
    setForm(prev => ({ ...prev, instructions: (prev.instructions || []).filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!form.title) return;
    const saved: Recipe = {
      id: form.id || `manual-${Date.now()}`,
      title: form.title || 'Untitled',
      description: form.description || '',
      cuisine: (form.cuisine || 'british') as CuisineType,
      difficulty: (form.difficulty || 'easy') as RecipeDifficulty,
      prepTime: form.prepTime || 0,
      cookTime: form.cookTime || 0,
      servings: form.servings || 4,
      ingredients: (form.ingredients || []).filter(i => i.item.trim()),
      instructions: (form.instructions || []).filter(s => s.trim()),
      savedAt: new Date(),
    };
    onSave(saved);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in or edit the recipe details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title & Description */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Chicken Tikka Masala" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="A brief description..." rows={2} />
          </div>

          {/* Cuisine, Difficulty, Times */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Cuisine</Label>
              <Select value={form.cuisine || 'british'} onValueChange={v => updateField('cuisine', v as CuisineType)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Difficulty</Label>
              <Select value={form.difficulty || 'easy'} onValueChange={v => updateField('difficulty', v as RecipeDifficulty)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prep (mins)</Label>
              <Input type="number" className="h-9" value={form.prepTime || 0} onChange={e => updateField('prepTime', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cook (mins)</Label>
              <Input type="number" className="h-9" value={form.cookTime || 0} onChange={e => updateField('cookTime', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Servings</Label>
            <Input type="number" className="h-9 w-24" value={form.servings || 4} onChange={e => updateField('servings', parseInt(e.target.value) || 1)} />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addIngredient} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(form.ingredients || []).map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input className="h-8 w-16 text-xs" placeholder="Qty" value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} />
                  <Input className="h-8 w-16 text-xs" placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} />
                  <Input className="h-8 flex-1 text-xs" placeholder="Ingredient" value={ing.item} onChange={e => updateIngredient(i, 'item', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeIngredient(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Instructions</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addInstruction} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {(form.instructions || []).map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Badge variant="outline" className="mt-1 shrink-0">{i + 1}</Badge>
                  <Textarea className="min-h-[40px] text-xs" rows={1} value={step} onChange={e => updateInstruction(i, e.target.value)} placeholder={`Step ${i + 1}...`} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1" onClick={() => removeInstruction(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!form.title?.trim()}>
            Save Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeEditorDialog;
