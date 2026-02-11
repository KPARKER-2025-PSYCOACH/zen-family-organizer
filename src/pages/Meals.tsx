import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { UtensilsCrossed, Plus, Search, Users, Calendar, BookOpen, ShoppingCart, Download, Share2, Clock, ChefHat, Sparkles, GripVertical, Trash2, Eye } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import type { FamilyMember, Recipe, MealPlan, GroceryItem, DietaryRequirement, CuisineType, RecipeDifficulty } from "@/types";

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

const DIFFICULTY_INFO: Record<RecipeDifficulty, { label: string; color: string; icon: string }> = {
  easy: { label: 'Easy', color: 'bg-green-100 text-green-800', icon: '👍' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '👨‍🍳' },
  hard: { label: 'Hard', color: 'bg-red-100 text-red-800', icon: '🔥' },
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MealsPage = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, Recipe | null>>({});
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | 'any'>('any');
  const [selectedDifficulty, setSelectedDifficulty] = useState<RecipeDifficulty | 'any'>('any');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [savedDietaryReqs, setSavedDietaryReqs] = useState<DietaryRequirement[]>(() => {
    try {
      const stored = localStorage.getItem('parentassist_dietary_reqs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);

  useEffect(() => {
    localStorage.setItem('parentassist_dietary_reqs', JSON.stringify(savedDietaryReqs));
  }, [savedDietaryReqs]);

  const toggleSavedDietaryReq = (req: DietaryRequirement) => {
    setSavedDietaryReqs(prev =>
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  // New family member form
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    name: '',
    age: 0,
    dietaryRequirements: [],
    likes: [],
    dislikes: [],
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.age) return;
    
    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name,
      age: newMember.age,
      dietaryRequirements: newMember.dietaryRequirements || [],
      likes: newMember.likes || [],
      dislikes: newMember.dislikes || [],
    };
    
    setFamilyMembers([...familyMembers, member]);
    setNewMember({ name: '', age: 0, dietaryRequirements: [], likes: [], dislikes: [] });
    setIsAddingMember(false);
  };

  const toggleDietaryRequirement = (requirement: DietaryRequirement) => {
    const current = newMember.dietaryRequirements || [];
    if (current.includes(requirement)) {
      setNewMember({ ...newMember, dietaryRequirements: current.filter(r => r !== requirement) });
    } else {
      setNewMember({ ...newMember, dietaryRequirements: [...current, requirement] });
    }
  };

  const fetchRecipes = async (offset: number, append: boolean) => {
    if (append) setIsLoadingMore(true); else setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('meal-search', {
        body: {
          cuisine: selectedCuisine,
          difficulty: selectedDifficulty,
          query: searchQuery,
          dietaryRequirements: savedDietaryReqs.map(r =>
            DIETARY_REQUIREMENTS.find(d => d.value === r)?.label || r
          ),
          offset,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const newRecipes: Recipe[] = (data?.recipes || []).map((r: any, i: number) => ({
        ...r,
        id: r.id || `ai-${Date.now()}-${i}`,
      }));

      if (append) {
        setSearchResults(prev => [...prev, ...newRecipes]);
      } else {
        setSearchResults(newRecipes);
      }
      setSearchOffset(offset + 10);
    } catch (e: any) {
      console.error('Meal search error:', e);
      toast.error('Failed to search for recipes. Please try again.');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearchRecipes = () => {
    setSearchOffset(0);
    fetchRecipes(0, false);
  };

  const handleLoadMore = () => {
    fetchRecipes(searchOffset, true);
  };

  const handleAddToDay = (recipe: Recipe, day: string) => {
    setMealPlan({ ...mealPlan, [day]: recipe });
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    if (!recipes.find(r => r.id === recipe.id)) {
      setRecipes([...recipes, { ...recipe, savedAt: new Date() }]);
    }
  };

  const handleRemoveFromDay = (day: string) => {
    const newPlan = { ...mealPlan };
    delete newPlan[day];
    setMealPlan(newPlan);
  };

  const handleGenerateGroceryList = () => {
    const plannedRecipes = Object.values(mealPlan).filter(Boolean) as Recipe[];
    const allIngredients: GroceryItem[] = [];
    
    plannedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        allIngredients.push({
          id: `${recipe.id}-${ing.item}`,
          item: ing.item,
          amount: ing.amount,
          unit: ing.unit,
          category: 'other', // TODO: categorize properly
          checked: false,
        });
      });
    });
    
    setGroceryList(allIngredients);
  };

  const handleToggleGroceryItem = (id: string) => {
    setGroceryList(list => 
      list.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleExportGroceryList = () => {
    // TODO: Generate PDF
    const text = groceryList
      .filter(item => !item.checked)
      .map(item => `- ${item.amount} ${item.unit} ${item.item}`)
      .join('\n');
    
    const blob = new Blob([`Shopping List\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
  };

  const handleShareGroceryList = async () => {
    const text = groceryList
      .filter(item => !item.checked)
      .map(item => `- ${item.amount} ${item.unit} ${item.item}`)
      .join('\n');
    
    if (navigator.share) {
      await navigator.share({
        title: 'Shopping List',
        text: text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert('List copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Meal Planner" 
        subtitle="Plan your family's meals for the week"
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="planner" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="family">
              <Users className="h-4 w-4 mr-1 hidden sm:inline" />
              Family
            </TabsTrigger>
            <TabsTrigger value="search">
              <Sparkles className="h-4 w-4 mr-1 hidden sm:inline" />
              Find Meals
            </TabsTrigger>
            <TabsTrigger value="planner">
              <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="recipes">
              <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
              Recipes
            </TabsTrigger>
          </TabsList>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Family Members</h2>
              <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                    <DialogDescription>
                      Add dietary preferences for meal suggestions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="member-name">Name *</Label>
                        <Input 
                          id="member-name" 
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="e.g. Emily"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-age">Age *</Label>
                        <Input 
                          id="member-age" 
                          type="number"
                          value={newMember.age || ''}
                          onChange={(e) => setNewMember({ ...newMember, age: parseInt(e.target.value) || 0 })}
                          placeholder="e.g. 8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Dietary Requirements</Label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_REQUIREMENTS.map(req => (
                          <Badge 
                            key={req.value}
                            variant={newMember.dietaryRequirements?.includes(req.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDietaryRequirement(req.value)}
                          >
                            {req.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="likes">Likes</Label>
                      <Input 
                        id="likes"
                        placeholder="e.g. Pasta, Chicken, Rice (comma separated)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const likes = e.currentTarget.value.split(',').map(l => l.trim()).filter(l => l);
                            setNewMember({ ...newMember, likes });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dislikes">Dislikes</Label>
                      <Input 
                        id="dislikes"
                        placeholder="e.g. Mushrooms, Spicy food (comma separated)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const dislikes = e.currentTarget.value.split(',').map(d => d.trim()).filter(d => d);
                            setNewMember({ ...newMember, dislikes });
                          }
                        }}
                      />
                    </div>

                    <Button onClick={handleAddMember} className="w-full">
                      Add Family Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {familyMembers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No family members added</p>
                  <p className="text-sm text-muted-foreground mt-1">Add members to get personalised meal suggestions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.map(member => (
                  <Card key={member.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.age} years old</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {member.dietaryRequirements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.dietaryRequirements.map(req => (
                            <Badge key={req} variant="secondary" className="text-xs">
                              {DIETARY_REQUIREMENTS.find(r => r.value === req)?.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Meal Search
                </CardTitle>
                <CardDescription>
                  Find recipes that work for your whole family
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Persistent Dietary Requirements */}
                <div className="space-y-2">
                  <Label>Dietary Requirements <span className="text-xs text-muted-foreground">(saved across searches)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_REQUIREMENTS.map(req => (
                      <Badge
                        key={req.value}
                        variant={savedDietaryReqs.includes(req.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSavedDietaryReq(req.value)}
                      >
                        {req.label}
                        {savedDietaryReqs.includes(req.value) && " ✕"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cuisine Type</Label>
                    <Select value={selectedCuisine} onValueChange={(v) => setSelectedCuisine(v as CuisineType | 'any')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any cuisine</SelectItem>
                        {CUISINE_TYPES.map(cuisine => (
                          <SelectItem key={cuisine.value} value={cuisine.value}>
                            {cuisine.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as RecipeDifficulty | 'any')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any difficulty</SelectItem>
                        <SelectItem value="easy">Easy (Quick & Simple)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard (Chef Level)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Request</Label>
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. kid-friendly, under 30 mins"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSearchRecipes}
                  disabled={isSearching}
                  className="w-full gap-2"
                >
                  {isSearching ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Find Recipes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recipe Suggestions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {searchResults.map(recipe => (
                    <Card key={recipe.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{recipe.title}</CardTitle>
                            <CardDescription>{recipe.description}</CardDescription>
                          </div>
                          <Badge className={DIFFICULTY_INFO[recipe.difficulty].color}>
                            {DIFFICULTY_INFO[recipe.difficulty].icon} {DIFFICULTY_INFO[recipe.difficulty].label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.prepTime + recipe.cookTime} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {recipe.servings} servings
                          </span>
                          <Badge variant="outline">
                            {CUISINE_TYPES.find(c => c.value === recipe.cuisine)?.label}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setViewingRecipe(recipe)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSaveRecipe(recipe)}
                          >
                            Save to Bank
                          </Button>
                          <Select onValueChange={(day) => handleAddToDay(recipe, day)}>
                            <SelectTrigger className="w-[140px] h-9">
                              <SelectValue placeholder="Add to day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="gap-2"
                  >
                    {isLoadingMore ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Find more recipes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Weekly Meal Plan</h2>
              <Button 
                onClick={handleGenerateGroceryList}
                disabled={Object.keys(mealPlan).length === 0}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Generate Grocery List
              </Button>
            </div>

            <div className="grid gap-4">
              {DAYS_OF_WEEK.map(day => {
                const recipe = mealPlan[day];
                return (
                  <Card key={day}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-24 font-medium">{day}</div>
                          {recipe ? (
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
                              onClick={() => setViewingRecipe(recipe)}
                            >
                              <div>
                                <p className="font-medium">{recipe.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {recipe.prepTime + recipe.cookTime} mins
                                  <Badge variant="outline" className="text-xs">
                                    {DIFFICULTY_INFO[recipe.difficulty].icon}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No meal planned</p>
                          )}
                        </div>
                        {recipe && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFromDay(day)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Grocery List */}
            {groceryList.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Grocery List
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportGroceryList} className="gap-1">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareGroceryList} className="gap-1">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Tick off items you already have
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {groceryList.map(item => (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${item.checked ? 'bg-muted line-through text-muted-foreground' : 'bg-secondary/30'}`}
                      >
                        <Checkbox 
                          checked={item.checked}
                          onCheckedChange={() => handleToggleGroceryItem(item.id)}
                        />
                        <span>{item.amount} {item.unit} {item.item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recipe Bank Tab */}
          <TabsContent value="recipes" className="space-y-6">
            <h2 className="text-xl font-semibold">Saved Recipes</h2>

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
                  {CUISINE_TYPES.filter(c => 
                    recipes.some(r => r.cuisine === c.value)
                  ).map(cuisine => (
                    <TabsTrigger key={cuisine.value} value={cuisine.value}>
                      {cuisine.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map(recipe => (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onView={() => setViewingRecipe(recipe)}
                        onAddToDay={(day) => handleAddToDay(recipe, day)}
                        onDelete={() => setRecipes(recipes.filter(r => r.id !== recipe.id))}
                      />
                    ))}
                  </div>
                </TabsContent>

                {CUISINE_TYPES.filter(c => 
                  recipes.some(r => r.cuisine === c.value)
                ).map(cuisine => (
                  <TabsContent key={cuisine.value} value={cuisine.value}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recipes.filter(r => r.cuisine === cuisine.value).map(recipe => (
                        <RecipeCard 
                          key={recipe.id} 
                          recipe={recipe} 
                          onView={() => setViewingRecipe(recipe)}
                          onAddToDay={(day) => handleAddToDay(recipe, day)}
                          onDelete={() => setRecipes(recipes.filter(r => r.id !== recipe.id))}
                        />
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
                    <div>
                      <DialogTitle className="text-2xl">{viewingRecipe.title}</DialogTitle>
                      <DialogDescription>{viewingRecipe.description}</DialogDescription>
                    </div>
                    <Badge className={DIFFICULTY_INFO[viewingRecipe.difficulty].color}>
                      {DIFFICULTY_INFO[viewingRecipe.difficulty].icon} {DIFFICULTY_INFO[viewingRecipe.difficulty].label}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Prep: {viewingRecipe.prepTime} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <ChefHat className="h-4 w-4" />
                      Cook: {viewingRecipe.cookTime} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Serves {viewingRecipe.servings}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <ul className="space-y-1">
                      {viewingRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {ing.amount} {ing.unit} {ing.item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="space-y-2">
                      {viewingRecipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                            {i + 1}
                          </span>
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
      </div>
    </div>
  );
};

// Recipe Card Component
const RecipeCard = ({ 
  recipe, 
  onView, 
  onAddToDay, 
  onDelete 
}: { 
  recipe: Recipe; 
  onView: () => void; 
  onAddToDay: (day: string) => void; 
  onDelete: () => void;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg">{recipe.title}</CardTitle>
          <Badge variant="outline" className="mt-1">
            {CUISINE_TYPES.find(c => c.value === recipe.cuisine)?.label}
          </Badge>
        </div>
        <Badge className={DIFFICULTY_INFO[recipe.difficulty].color}>
          {DIFFICULTY_INFO[recipe.difficulty].icon}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Clock className="h-4 w-4" />
        {recipe.prepTime + recipe.cookTime} mins
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onView} className="gap-1">
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Select onValueChange={onAddToDay}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue placeholder="Add to..." />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map(day => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default MealsPage;
