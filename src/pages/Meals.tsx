import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Users, Calendar, BookOpen, ShoppingCart, Download, Share2, Clock, ChefHat, Sparkles, Trash2, Eye, Upload, RefreshCw, Pencil, Settings2, GripVertical } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import RecipeEditorDialog from "@/components/meals/RecipeEditorDialog";
import { useFamilyMembers, calculateAge } from "@/hooks/useFamilyMembers";
import { useMealData } from "@/hooks/useMealData";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import type { Recipe, GroceryItem, DietaryRequirement, CuisineType } from "@/types";

// ============ Constants ============

const DIETARY_REQUIREMENTS: { value: DietaryRequirement; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'nut_free', label: 'Nut Free' },
  { value: 'egg_free', label: 'Egg Free' },
  { value: 'soy_free', label: 'Soy Free' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'low_sodium', label: 'Low Sodium' },
  { value: 'diabetic_friendly', label: 'Diabetic Friendly' },
];

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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type MealType = 'breakfast' | 'lunch' | 'dinner';

const MEAL_TYPE_INFO: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Breakfast', icon: '🌅' },
  lunch: { label: 'Lunch', icon: '☀️' },
  dinner: { label: 'Dinner', icon: '🌙' },
};

// ============ Main Component ============

const MealsPage = () => {
  const { members: familyMembers } = useFamilyMembers();
  const { recipes, mealPlan, loading: dataLoading, saveRecipe, updateRecipe, deleteRecipe, addMealToPlan, removeMealFromPlan } = useMealData();
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | 'any'>('any');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingMealType, setEditingMealType] = useState<MealType>('dinner');
  const [savedDietaryReqs, setSavedDietaryReqs] = useState<DietaryRequirement[]>(() => {
    try { return JSON.parse(localStorage.getItem('parentassist_dietary_reqs') || '[]'); } catch { return []; }
  });
  const [customDietaryReqs, setCustomDietaryReqs] = useState<{ value: string; label: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('parentassist_custom_dietary') || '[]'); } catch { return []; }
  });
  const [newCustomReq, setNewCustomReq] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRecipe, setEditorRecipe] = useState<Partial<Recipe> | null>(null);
  const [editorTitle, setEditorTitle] = useState('Add Recipe');
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);
  const [scanningRecipe, setScanningRecipe] = useState(false);

  const [showBreakfast, setShowBreakfast] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('parentassist_show_breakfast') || 'false'); } catch { return false; }
  });
  const [showLunch, setShowLunch] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('parentassist_show_lunch') || 'false'); } catch { return false; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [quickMealName, setQuickMealName] = useState('');

  // Persist UI preferences in localStorage (these are fine as local-only)
  const updateDietaryReqs = (reqs: DietaryRequirement[]) => { setSavedDietaryReqs(reqs); localStorage.setItem('parentassist_dietary_reqs', JSON.stringify(reqs)); };
  const updateCustomDietaryReqs = (reqs: { value: string; label: string }[]) => { setCustomDietaryReqs(reqs); localStorage.setItem('parentassist_custom_dietary', JSON.stringify(reqs)); };
  const updateShowBreakfast = (v: boolean) => { setShowBreakfast(v); localStorage.setItem('parentassist_show_breakfast', JSON.stringify(v)); };
  const updateShowLunch = (v: boolean) => { setShowLunch(v); localStorage.setItem('parentassist_show_lunch', JSON.stringify(v)); };

  const toggleSavedDietaryReq = (req: DietaryRequirement) => {
    updateDietaryReqs(savedDietaryReqs.includes(req) ? savedDietaryReqs.filter(r => r !== req) : [...savedDietaryReqs, req]);
  };

  const visibleMealTypes: MealType[] = [
    ...(showBreakfast ? ['breakfast' as MealType] : []),
    ...(showLunch ? ['lunch' as MealType] : []),
    'dinner',
  ];

  // ============ Recipe search ============

  const fetchRecipes = async (offset: number, append: boolean) => {
    if (append) setIsLoadingMore(true); else setIsSearching(true);
    try {
      const familyDietaryReqs = [...new Set(familyMembers.flatMap(m => m.dietary_requirements))];
      const allDietaryReqs = [
        ...savedDietaryReqs.map(r => DIETARY_REQUIREMENTS.find(d => d.value === r)?.label || r),
        ...familyDietaryReqs,
      ].filter((v, i, a) => a.indexOf(v) === i);

      const familyContext = familyMembers.length > 0
        ? `Family members: ${familyMembers.map(m => {
            const age = calculateAge(m.birth_date);
            return `${m.name}${age ? ` (${age}yo)` : ""}${m.likes.length ? `, likes: ${m.likes.join(", ")}` : ""}${m.dislikes.length ? `, dislikes: ${m.dislikes.join(", ")}` : ""}`;
          }).join("; ")}`
        : "";

      const { data, error } = await supabase.functions.invoke('meal-search', {
        body: { cuisine: selectedCuisine, query: familyContext ? `${searchQuery}. ${familyContext}` : searchQuery, dietaryRequirements: allDietaryReqs, offset },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const newRecipes: Recipe[] = (data?.recipes || []).map((r: any, i: number) => ({ ...r, id: r.id || `ai-${Date.now()}-${i}` }));
      if (append) { setSearchResults(prev => [...prev, ...newRecipes]); } else { setSearchResults(newRecipes); }
      setSearchOffset(offset + 10);
    } catch (e: any) {
      console.error('Meal search error:', e);
      toast.error('Failed to search for recipes. Please try again.');
    } finally { setIsSearching(false); setIsLoadingMore(false); }
  };

  const handleSearchRecipes = () => { setSearchOffset(0); fetchRecipes(0, false); };
  const handleLoadMore = () => { fetchRecipes(searchOffset, true); };

  // ============ Meal plan actions ============

  const handleAddToDay = (recipe: Recipe, day: string) => {
    addMealToPlan(day, 'dinner', recipe.title, recipe);
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    saveRecipe(recipe);
  };

  const getMealsForDayType = (day: string, mealType: MealType) => {
    return (mealPlan[day] || []).filter(m => m.mealType === mealType);
  };

  // ============ Grocery list ============

  const handleGenerateGroceryList = () => {
    const allMeals = Object.values(mealPlan).flat();
    const plannedRecipes = allMeals.filter(m => m.recipe).map(m => m.recipe!);
    const allIngredients: GroceryItem[] = [];
    plannedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        allIngredients.push({ id: `${recipe.id}-${ing.item}`, item: ing.item, amount: ing.amount, unit: ing.unit, category: 'other', checked: false });
      });
    });
    setGroceryList(allIngredients);
  };

  const handleToggleGroceryItem = (id: string) => {
    setGroceryList(list => list.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // ============ Custom dietary ============

  const handleAddCustomReq = () => {
    const trimmed = newCustomReq.trim();
    if (!trimmed) return;
    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    if (customDietaryReqs.some(r => r.value === value)) return;
    updateCustomDietaryReqs([...customDietaryReqs, { value, label: trimmed }]);
    updateDietaryReqs([...savedDietaryReqs, value as DietaryRequirement]);
    setNewCustomReq('');
  };

  const handleRemoveCustomReq = (value: string) => {
    updateCustomDietaryReqs(customDietaryReqs.filter(r => r.value !== value));
    updateDietaryReqs(savedDietaryReqs.filter(r => r !== value));
  };

  // ============ Recipe scanning ============

  const handleScanRecipeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningRecipe(true);
    try {
      let fileContent = "";
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        fileContent = textDecoder.decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      } else { fileContent = await file.text(); }
      if (fileContent.length > 10000) fileContent = fileContent.substring(0, 10000);
      if (fileContent.length < 10) { toast.error("Could not read file content"); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/scan-recipe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent, fileName: file.name }),
      });
      const data = await res.json();
      if (data.success && data.recipe) {
        setEditorRecipe({ ...data.recipe, id: `scan-${Date.now()}` });
        setEditorTitle('Review Scanned Recipe');
        setEditingRecipeId(null);
        setEditorOpen(true);
        toast.success('Recipe parsed! Review and save below.');
      } else { toast.error(data.error || 'Failed to parse recipe'); }
    } catch (err) { console.error('Recipe scan error:', err); toast.error('Failed to scan recipe'); }
    finally { setScanningRecipe(false); if (recipeFileInputRef.current) recipeFileInputRef.current.value = ""; }
  };

  const handleOpenManualEntry = () => { setEditorRecipe(null); setEditorTitle('Add Recipe Manually'); setEditingRecipeId(null); setEditorOpen(true); };

  const handleEditRecipe = (recipe: Recipe) => { setEditorRecipe(recipe); setEditorTitle('Edit Recipe'); setEditingRecipeId(recipe.id); setEditorOpen(true); };

  const handleEditorSave = (recipe: Recipe) => {
    if (editingRecipeId) {
      updateRecipe(editingRecipeId, recipe);
      toast.success('Recipe updated!');
    } else {
      saveRecipe(recipe);
      toast.success('Recipe saved!');
    }
  };

  const handleExportGroceryList = () => {
    const text = groceryList.filter(item => !item.checked).map(item => `- ${item.amount} ${item.unit} ${item.item}`).join('\n');
    const blob = new Blob([`Shopping List\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shopping-list.txt'; a.click();
  };

  const handleShareGroceryList = async () => {
    const text = groceryList.filter(item => !item.checked).map(item => `- ${item.amount} ${item.unit} ${item.item}`).join('\n');
    if (navigator.share) { await navigator.share({ title: 'Shopping List', text }); }
    else { await navigator.clipboard.writeText(text); alert('List copied to clipboard!'); }
  };

  const openDayDialog = (day: string, mealType: MealType) => {
    setEditingDay(day);
    setEditingMealType(mealType);
    setQuickMealName('');
  };

  const handleQuickAdd = () => {
    if (!quickMealName.trim() || !editingDay) return;
    const name = quickMealName.trim();
    const stubRecipe: Recipe = {
      id: `manual-${Date.now()}`,
      title: name,
      description: '',
      cuisine: 'british',
      difficulty: 'easy',
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      ingredients: [],
      instructions: [],
      savedAt: new Date(),
    };
    addMealToPlan(editingDay, editingMealType, name, stubRecipe);
    setQuickMealName('');
    toast.success('Meal added! You can flesh out the recipe in the Recipes tab.');
  };

  const handleSelectRecipeForDay = (recipe: Recipe) => {
    if (!editingDay) return;
    addMealToPlan(editingDay, editingMealType, recipe.title, recipe);
    setEditingDay(null);
  };

  const totalPlannedMeals = Object.values(mealPlan).flat().length;

  // ============ Render ============

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Meal Planner" subtitle="Plan your family's meals for the week" />
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Meal Planner" subtitle="Plan your family's meals for the week" />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="planner" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="search"><Sparkles className="h-4 w-4 mr-1 hidden sm:inline" />Find Meals</TabsTrigger>
            <TabsTrigger value="planner"><Calendar className="h-4 w-4 mr-1 hidden sm:inline" />Planner</TabsTrigger>
            <TabsTrigger value="recipes"><BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />Recipes</TabsTrigger>
          </TabsList>

          {familyMembers.length > 0 && (
            <Card className="shadow-soft">
              <CardContent className="py-3 px-4">
                <p className="text-sm text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-1" />
                  Personalising for {familyMembers.length} family member{familyMembers.length > 1 ? "s" : ""}: {familyMembers.map(m => m.name).join(", ")}
                  {familyMembers.some(m => m.dietary_requirements.length > 0) && (
                    <span> · Dietary: {[...new Set(familyMembers.flatMap(m => m.dietary_requirements))].join(", ")}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ============ Search Tab ============ */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />AI Meal Search</CardTitle>
                <CardDescription>Find recipes that work for your whole family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dietary Requirements <span className="text-xs text-muted-foreground">(saved across searches)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_REQUIREMENTS.map(req => (
                      <Badge key={req.value} variant={savedDietaryReqs.includes(req.value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleSavedDietaryReq(req.value)}>
                        {req.label}{savedDietaryReqs.includes(req.value) && " ✕"}
                      </Badge>
                    ))}
                    {customDietaryReqs.map(req => (
                      <Badge key={req.value} variant={savedDietaryReqs.includes(req.value as DietaryRequirement) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleSavedDietaryReq(req.value as DietaryRequirement)}>
                        {req.label}{savedDietaryReqs.includes(req.value as DietaryRequirement) && " ✕"}
                        <button className="ml-1 text-xs opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveCustomReq(req.value); }}>×</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input className="h-8 text-sm max-w-[200px]" placeholder="Add custom requirement..." value={newCustomReq} onChange={e => setNewCustomReq(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCustomReq()} />
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleAddCustomReq} disabled={!newCustomReq.trim()}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cuisine Type</Label>
                    <Select value={selectedCuisine} onValueChange={(v) => setSelectedCuisine(v as CuisineType | 'any')}>
                      <SelectTrigger><SelectValue placeholder="Any cuisine" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any cuisine</SelectItem>
                        {CUISINE_TYPES.map(cuisine => (<SelectItem key={cuisine.value} value={cuisine.value}>{cuisine.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Request</Label>
                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. kid-friendly, under 30 mins" />
                  </div>
                </div>

                <Button onClick={handleSearchRecipes} disabled={isSearching} className="w-full gap-2">
                  {isSearching ? <>Searching...</> : <><Search className="h-4 w-4" />Find Recipes</>}
                </Button>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recipe Suggestions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {searchResults.map(recipe => (
                    <Card key={recipe.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div><CardTitle className="text-lg">{recipe.title}</CardTitle><CardDescription>{recipe.description}</CardDescription></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{recipe.prepTime + recipe.cookTime} mins</span>
                          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{recipe.servings} servings</span>
                          <Badge variant="outline">{CUISINE_TYPES.find(c => c.value === recipe.cuisine)?.label}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewingRecipe(recipe)} className="gap-1"><Eye className="h-4 w-4" />View</Button>
                          <Button size="sm" variant="outline" onClick={() => handleSaveRecipe(recipe)}>Save to Bank</Button>
                          <Select onValueChange={(day) => handleAddToDay(recipe, day)}>
                            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Add to day" /></SelectTrigger>
                            <SelectContent>{DAYS_OF_WEEK.map(day => (<SelectItem key={day} value={day}>{day}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="gap-2">
                    {isLoadingMore ? <>Loading...</> : <><Search className="h-4 w-4" />Find more recipes</>}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ Planner Tab ============ */}
          <TabsContent value="planner" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-semibold">Weekly Meal Plan</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
                  <Settings2 className="h-4 w-4" /> Meal types
                </Button>
                <Button onClick={handleGenerateGroceryList} disabled={totalPlannedMeals === 0} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />Generate Grocery List
                </Button>
              </div>
            </div>

            {showSettings && (
              <Card className="shadow-soft">
                <CardContent className="py-4 space-y-3">
                  <p className="text-sm font-medium">Show meal types</p>
                  <p className="text-xs text-muted-foreground">Dinner is always shown. Toggle breakfast and lunch if you want to plan those too.</p>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="show-breakfast" checked={showBreakfast} onCheckedChange={updateShowBreakfast} />
                      <Label htmlFor="show-breakfast" className="text-sm">🌅 Breakfast</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="show-lunch" checked={showLunch} onCheckedChange={updateShowLunch} />
                      <Label htmlFor="show-lunch" className="text-sm">☀️ Lunch</Label>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <Switch checked disabled />
                      <Label className="text-sm">🌙 Dinner</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {/* Row 1: Mon-Thu */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {DAYS_OF_WEEK.slice(0, 4).map(day => (
                  <DayCard key={day} day={day} visibleMealTypes={visibleMealTypes} getMealsForDayType={getMealsForDayType} openDayDialog={openDayDialog} removeMealFromPlan={removeMealFromPlan} />
                ))}
              </div>
              {/* Row 2: Fri-Sun */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS_OF_WEEK.slice(4).map(day => (
                  <DayCard key={day} day={day} visibleMealTypes={visibleMealTypes} getMealsForDayType={getMealsForDayType} openDayDialog={openDayDialog} removeMealFromPlan={removeMealFromPlan} />
                ))}
              </div>
            </div>

            {/* Add meal dialog */}
            <Dialog open={!!editingDay} onOpenChange={(open) => { if (!open) setEditingDay(null); }}>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDay} — {MEAL_TYPE_INFO[editingMealType].icon} {MEAL_TYPE_INFO[editingMealType].label}</DialogTitle>
                  <DialogDescription>Type a meal name or pick from your saved recipes</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type a meal</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Spaghetti Bolognese"
                        value={quickMealName}
                        onChange={e => setQuickMealName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { handleQuickAdd(); } }}
                      />
                      <Button onClick={handleQuickAdd} disabled={!quickMealName.trim()} size="sm">Add</Button>
                    </div>
                  </div>

                  {recipes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Or pick from saved recipes</Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {recipes.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors" onClick={() => handleSelectRecipeForDay(r)}>
                            <div>
                              <p className="font-medium text-sm">{r.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />{r.prepTime + r.cookTime} mins
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Recent search results</Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {searchResults.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors" onClick={() => handleSelectRecipeForDay(r)}>
                            <div>
                              <p className="font-medium text-sm">{r.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />{r.prepTime + r.cookTime} mins
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipes.length === 0 && searchResults.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No saved recipes yet — type a meal name above or use "Find Meals" to search</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Grocery List */}
            {groceryList.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Grocery List</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportGroceryList} className="gap-1"><Download className="h-4 w-4" />Export</Button>
                      <Button variant="outline" size="sm" onClick={handleShareGroceryList} className="gap-1"><Share2 className="h-4 w-4" />Share</Button>
                    </div>
                  </div>
                  <CardDescription>Tick off items you already have</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {groceryList.map(item => (
                      <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${item.checked ? 'bg-muted line-through text-muted-foreground' : 'bg-secondary/30'}`}>
                        <Checkbox checked={item.checked} onCheckedChange={() => handleToggleGroceryItem(item.id)} />
                        <span>{item.amount} {item.unit} {item.item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ Recipe Bank Tab ============ */}
          <TabsContent value="recipes" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-semibold">Saved Recipes</h2>
              <div className="flex gap-2">
                <input ref={recipeFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleScanRecipeFile} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => recipeFileInputRef.current?.click()} disabled={scanningRecipe} className="gap-2">
                  {scanningRecipe ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {scanningRecipe ? 'Scanning...' : 'Scan Recipe'}
                </Button>
                <Button size="sm" onClick={handleOpenManualEntry} className="gap-2"><Plus className="h-4 w-4" /> Add Manually</Button>
              </div>
            </div>

            {recipes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No saved recipes</p>
                  <p className="text-sm text-muted-foreground mt-1">Search for recipes and save your favourites</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {CUISINE_TYPES.filter(c => recipes.some(r => r.cuisine === c.value)).map(cuisine => (
                    <TabsTrigger key={cuisine.value} value={cuisine.value}>{cuisine.label}</TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} onView={() => setViewingRecipe(recipe)} onEdit={() => handleEditRecipe(recipe)} onAddToDay={(day) => handleAddToDay(recipe, day)} onDelete={() => deleteRecipe(recipe.id)} />
                    ))}
                  </div>
                </TabsContent>
                {CUISINE_TYPES.filter(c => recipes.some(r => r.cuisine === c.value)).map(cuisine => (
                  <TabsContent key={cuisine.value} value={cuisine.value}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recipes.filter(r => r.cuisine === cuisine.value).map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onView={() => setViewingRecipe(recipe)} onEdit={() => handleEditRecipe(recipe)} onAddToDay={(day) => handleAddToDay(recipe, day)} onDelete={() => deleteRecipe(recipe.id)} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </TabsContent>
        </Tabs>

        {/* Recipe Detail Dialog */}
        <Dialog open={!!viewingRecipe} onOpenChange={() => setViewingRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {viewingRecipe && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div><DialogTitle className="text-2xl">{viewingRecipe.title}</DialogTitle><CardDescription>{viewingRecipe.description}</CardDescription></div>
                  </div>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Prep: {viewingRecipe.prepTime} mins</span>
                    <span className="flex items-center gap-1"><ChefHat className="h-4 w-4" />Cook: {viewingRecipe.cookTime} mins</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />Serves {viewingRecipe.servings}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <ul className="space-y-1">
                      {viewingRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" />{ing.amount} {ing.unit} {ing.item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="space-y-2">
                      {viewingRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <RecipeEditorDialog open={editorOpen} onOpenChange={setEditorOpen} recipe={editorRecipe} onSave={handleEditorSave} title={editorTitle} />
      </div>
    </div>
  );
};

// ============ Recipe Card ============

const RecipeCard = ({ recipe, onView, onEdit, onAddToDay, onDelete }: { recipe: Recipe; onView: () => void; onEdit: () => void; onAddToDay: (day: string) => void; onDelete: () => void }) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div><CardTitle className="text-lg">{recipe.title}</CardTitle><Badge variant="outline" className="mt-1">{CUISINE_TYPES.find(c => c.value === recipe.cuisine)?.label}</Badge></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4"><Clock className="h-4 w-4" />{recipe.prepTime + recipe.cookTime} mins</div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onView} className="gap-1"><Eye className="h-4 w-4" /> View</Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1"><Pencil className="h-4 w-4" /> Edit</Button>
        <Select onValueChange={onAddToDay}>
          <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Add to..." /></SelectTrigger>
          <SelectContent>{DAYS_OF_WEEK.map(day => (<SelectItem key={day} value={day}>{day}</SelectItem>))}</SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </CardContent>
  </Card>
);

// ============ Day Card for horizontal planner ============

const DayCard = ({ day, visibleMealTypes, getMealsForDayType, openDayDialog, removeMealFromPlan }: {
  day: string;
  visibleMealTypes: MealType[];
  getMealsForDayType: (day: string, mealType: MealType) => { id: string; name: string; recipe?: any; mealType: string }[];
  openDayDialog: (day: string, mealType: MealType) => void;
  removeMealFromPlan: (day: string, mealId: string) => void;
}) => (
  <Card className="shadow-soft">
    <CardContent className="py-3 px-3">
      <div className="font-medium text-sm mb-2 text-center border-b pb-1">{day}</div>
      <div className="space-y-2">
        {visibleMealTypes.map(mealType => {
          const meals = getMealsForDayType(day, mealType);
          return (
            <div key={mealType}>
              {visibleMealTypes.length > 1 && (
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{MEAL_TYPE_INFO[mealType].icon} {MEAL_TYPE_INFO[mealType].label}</p>
              )}
              <div className="space-y-1">
                {meals.map(meal => (
                  <div key={meal.id} className="flex items-center justify-between p-1.5 rounded bg-secondary/40 border text-xs">
                    <span className="truncate flex-1">{meal.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeMealFromPlan(day, meal.id)}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground hover:text-foreground h-6 text-[10px]"
                  onClick={() => openDayDialog(day, mealType)}
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  Add
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

export default MealsPage;
