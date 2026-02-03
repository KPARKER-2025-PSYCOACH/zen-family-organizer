// ============ Calendar Types ============
export interface CalendarConnection {
  id: string;
  provider: 'google' | 'apple' | 'outlook';
  email: string;
  connected: boolean;
  lastSynced?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  category: 'school' | 'health' | 'travel' | 'birthday' | 'meal' | 'work' | 'personal' | 'other';
  source: 'manual' | 'synced' | 'email';
  calendarId?: string;
}

// ============ Email Types ============
export interface EmailConnection {
  id: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'icloud';
  email: string;
  connected: boolean;
  foldersToScan: string[];
  lastScanned?: Date;
}

export interface DetectedEvent {
  id: string;
  emailSubject: string;
  emailFrom: string;
  detectedDate: Date;
  detectedTime?: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  suggestGift: boolean;
  giftReason?: string;
  approved: boolean;
}

// ============ Gift Types ============
export type AgeCategory = 'baby' | 'toddler' | 'child' | 'teenager' | 'young_adult' | 'adult' | 'older_adult';

export type PersonalityType = 
  | 'life_of_party' | 'quiet_contemplator' | 'networking_pro'
  | 'eco_conscious' | 'minimalist' | 'luxury_seeker' | 'wellness_guru'
  | 'pragmatist' | 'sentimentalist' | 'trendsetter' | 'quirky_creative'
  | 'homebody' | 'urban_explorer' | 'wild_heart';

export interface GiftRecipient {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  ageCategory?: AgeCategory;
  dislikes: string[];
  hobbies: string[];
  personalityTypes: PersonalityType[];
  notes?: string;
}

export interface GiftOccasion {
  id: string;
  recipientId: string;
  occasion: string;
  date: Date;
  budget?: { min: number; max: number };
  purchased: boolean;
  giftIdea?: string;
}

export interface GiftSuggestion {
  id: string;
  title: string;
  description: string;
  price: number;
  url: string;
  imageUrl?: string;
  matchScore: number;
}

// ============ Meal Planning Types ============
export type DietaryRequirement = 
  | 'vegetarian' | 'vegan' | 'pescatarian' 
  | 'gluten_free' | 'dairy_free' | 'nut_free' | 'egg_free' | 'soy_free'
  | 'low_carb' | 'keto' | 'paleo' | 'halal' | 'kosher'
  | 'low_sodium' | 'diabetic_friendly';

export type CuisineType = 
  | 'italian' | 'chinese' | 'indian' | 'mexican' | 'japanese' 
  | 'thai' | 'mediterranean' | 'french' | 'american' | 'korean'
  | 'vietnamese' | 'greek' | 'spanish' | 'middle_eastern' | 'british';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  dietaryRequirements: DietaryRequirement[];
  likes: string[];
  dislikes: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: CuisineType;
  difficulty: RecipeDifficulty;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  ingredients: { item: string; amount: string; unit: string }[];
  instructions: string[];
  imageUrl?: string;
  savedAt?: Date;
}

export interface MealPlan {
  id: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;
}

export interface GroceryItem {
  id: string;
  item: string;
  amount: string;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'other';
  checked: boolean;
}
