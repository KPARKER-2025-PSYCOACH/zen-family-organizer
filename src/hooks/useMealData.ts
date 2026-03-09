import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Recipe, CuisineType, RecipeDifficulty } from "@/types";

export interface DbRecipe extends Recipe {
  dbId: string; // the supabase row id
}

export interface PlannedMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner";
  name: string;
  recipe?: Recipe;
  recipeDbId?: string;
}

export const useMealData = () => {
  const [recipes, setRecipes] = useState<DbRecipe[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, PlannedMeal[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const [recipesRes, mealsRes] = await Promise.all([
      supabase.from("saved_recipes").select("*").order("created_at", { ascending: false }),
      supabase.from("meal_plan_entries").select("*"),
    ]);

    const dbRecipes: DbRecipe[] = (recipesRes.data || []).map((r: any) => ({
      dbId: r.id,
      id: r.id,
      title: r.title,
      description: r.description,
      cuisine: r.cuisine as CuisineType,
      difficulty: r.difficulty as RecipeDifficulty,
      prepTime: r.prep_time,
      cookTime: r.cook_time,
      servings: r.servings,
      ingredients: r.ingredients as any[],
      instructions: r.instructions as string[],
      savedAt: new Date(r.created_at),
    }));
    setRecipes(dbRecipes);

    const plan: Record<string, PlannedMeal[]> = {};
    for (const m of mealsRes.data || []) {
      const recipe = dbRecipes.find(r => r.dbId === m.recipe_id);
      const meal: PlannedMeal = {
        id: m.id,
        mealType: m.meal_type as any,
        name: m.name,
        recipe,
        recipeDbId: m.recipe_id || undefined,
      };
      if (!plan[m.day_of_week]) plan[m.day_of_week] = [];
      plan[m.day_of_week].push(meal);
    }
    setMealPlan(plan);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveRecipe = async (recipe: Recipe): Promise<DbRecipe | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    // Check if already saved
    if (recipes.find(r => r.title.toLowerCase() === recipe.title.toLowerCase())) {
      return recipes.find(r => r.title.toLowerCase() === recipe.title.toLowerCase())!;
    }
    const { data, error } = await supabase.from("saved_recipes").insert({
      user_id: session.user.id,
      title: recipe.title,
      description: recipe.description || "",
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients as any,
      instructions: recipe.instructions as any,
    }).select().single();
    if (error) { toast.error("Failed to save recipe"); return null; }
    const dbRecipe: DbRecipe = { ...recipe, id: data.id, dbId: data.id, savedAt: new Date(data.created_at) };
    setRecipes(prev => [dbRecipe, ...prev]);
    return dbRecipe;
  };

  const updateRecipe = async (recipeId: string, recipe: Recipe) => {
    const { error } = await supabase.from("saved_recipes").update({
      title: recipe.title,
      description: recipe.description || "",
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients as any,
      instructions: recipe.instructions as any,
    }).eq("id", recipeId);
    if (error) { toast.error("Failed to update recipe"); return; }
    setRecipes(prev => prev.map(r => r.dbId === recipeId ? { ...r, ...recipe, id: recipeId, dbId: recipeId } : r));
    // Update meal plan references
    setMealPlan(prev => {
      const updated = { ...prev };
      for (const day of Object.keys(updated)) {
        updated[day] = updated[day].map(m =>
          m.recipeDbId === recipeId ? { ...m, name: recipe.title, recipe: { ...recipe, id: recipeId } } : m
        );
      }
      return updated;
    });
  };

  const deleteRecipe = async (recipeId: string) => {
    await supabase.from("saved_recipes").delete().eq("id", recipeId);
    setRecipes(prev => prev.filter(r => r.dbId !== recipeId));
  };

  const addMealToPlan = async (day: string, mealType: string, name: string, recipe?: Recipe) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // If recipe provided, ensure it's saved
    let recipeId: string | null = null;
    if (recipe) {
      const existing = recipes.find(r => r.title.toLowerCase() === recipe.title.toLowerCase());
      if (existing) {
        recipeId = existing.dbId;
      } else {
        const saved = await saveRecipe(recipe);
        if (saved) recipeId = saved.dbId;
      }
    }

    const { data, error } = await supabase.from("meal_plan_entries").insert({
      user_id: session.user.id,
      day_of_week: day,
      meal_type: mealType,
      name,
      recipe_id: recipeId,
    }).select().single();
    if (error) { toast.error("Failed to add meal"); return; }

    const meal: PlannedMeal = { id: data.id, mealType: mealType as any, name, recipe, recipeDbId: recipeId || undefined };
    setMealPlan(prev => ({ ...prev, [day]: [...(prev[day] || []), meal] }));
  };

  const removeMealFromPlan = async (day: string, mealId: string) => {
    await supabase.from("meal_plan_entries").delete().eq("id", mealId);
    setMealPlan(prev => {
      const updated = (prev[day] || []).filter(m => m.id !== mealId);
      const newPlan = { ...prev };
      if (updated.length === 0) delete newPlan[day]; else newPlan[day] = updated;
      return newPlan;
    });
  };

  const moveMeal = async (fromDay: string, mealId: string, toDay: string, toMealType: string) => {
    const { error } = await supabase.from("meal_plan_entries").update({
      day_of_week: toDay,
      meal_type: toMealType,
    }).eq("id", mealId);
    if (error) { toast.error("Failed to move meal"); return; }

    setMealPlan(prev => {
      const meal = (prev[fromDay] || []).find(m => m.id === mealId);
      if (!meal) return prev;
      const updated = { ...prev };
      updated[fromDay] = (updated[fromDay] || []).filter(m => m.id !== mealId);
      if (updated[fromDay].length === 0) delete updated[fromDay];
      const movedMeal = { ...meal, mealType: toMealType as any };
      updated[toDay] = [...(updated[toDay] || []), movedMeal];
      return updated;
    });
  };

  return { recipes, mealPlan, loading, saveRecipe, updateRecipe, deleteRecipe, addMealToPlan, removeMealFromPlan, moveMeal, setRecipes };
};
