import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Plus, Search, User, Calendar, Sparkles, ExternalLink, Heart, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import type { GiftRecipient, GiftOccasion, GiftSuggestion, AgeCategory, PersonalityType } from "@/types";

const AGE_CATEGORIES: { value: AgeCategory; label: string }[] = [
  { value: 'baby', label: 'Baby (0-2)' },
  { value: 'toddler', label: 'Toddler (2-5)' },
  { value: 'child', label: 'Child (5-12)' },
  { value: 'teenager', label: 'Teenager (13-19)' },
  { value: 'young_adult', label: 'Young Adult (20-35)' },
  { value: 'adult', label: 'Adult (35-60)' },
  { value: 'older_adult', label: 'Older Adult (60+)' },
];

const PERSONALITY_TYPES: { value: PersonalityType; label: string; category: string }[] = [
  // Social & Interaction Style
  { value: 'life_of_party', label: 'Life of the Party', category: 'Social Style' },
  { value: 'quiet_contemplator', label: 'Quiet Contemplator', category: 'Social Style' },
  { value: 'networking_pro', label: 'Networking Pro', category: 'Social Style' },
  // Lifestyle & Values
  { value: 'eco_conscious', label: 'Eco-Conscious', category: 'Lifestyle' },
  { value: 'minimalist', label: 'Minimalist', category: 'Lifestyle' },
  { value: 'luxury_seeker', label: 'Luxury Seeker', category: 'Lifestyle' },
  { value: 'wellness_guru', label: 'Wellness Guru', category: 'Lifestyle' },
  // Gift Vibe
  { value: 'pragmatist', label: 'The Pragmatist', category: 'Gift Vibe' },
  { value: 'sentimentalist', label: 'The Sentimentalist', category: 'Gift Vibe' },
  { value: 'trendsetter', label: 'The Trendsetter', category: 'Gift Vibe' },
  { value: 'quirky_creative', label: 'Quirky Creative', category: 'Gift Vibe' },
  // Activity Profile
  { value: 'homebody', label: 'The Homebody', category: 'Activity' },
  { value: 'urban_explorer', label: 'Urban Explorer', category: 'Activity' },
  { value: 'wild_heart', label: 'Wild Heart', category: 'Activity' },
];

const SUGGESTED_INTERESTS = [
  'Reading', 'Cooking', 'Gaming', 'Music', 'Art', 'Sports', 'Travel', 'Photography',
  'Gardening', 'Technology', 'Fashion', 'Movies', 'Crafts', 'Fitness', 'Pets',
  'Board Games', 'Wine', 'Coffee', 'Meditation', 'Collecting', 'Writing', 'Dancing'
];

const GiftsPage = () => {
  const [recipients, setRecipients] = useState<GiftRecipient[]>([]);
  const [occasions, setOccasions] = useState<GiftOccasion[]>([]);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<GiftRecipient | null>(null);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New recipient form state
  const [newRecipient, setNewRecipient] = useState<Partial<GiftRecipient>>({
    name: '',
    relationship: '',
    hobbies: [],
    dislikes: [],
    personalityTypes: [],
  });

  const handleAddRecipient = () => {
    if (!newRecipient.name) return;
    
    const recipient: GiftRecipient = {
      id: Date.now().toString(),
      name: newRecipient.name,
      relationship: newRecipient.relationship || '',
      age: newRecipient.age,
      ageCategory: newRecipient.ageCategory,
      hobbies: newRecipient.hobbies || [],
      dislikes: newRecipient.dislikes || [],
      personalityTypes: newRecipient.personalityTypes || [],
      notes: newRecipient.notes,
    };
    
    setRecipients([...recipients, recipient]);
    setNewRecipient({ name: '', relationship: '', hobbies: [], dislikes: [], personalityTypes: [] });
    setIsAddingRecipient(false);
  };

  const handleDeleteRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
    if (selectedRecipient?.id === id) {
      setSelectedRecipient(null);
    }
  };

  const handleSearchGifts = async () => {
    if (!selectedRecipient) {
      alert('Please select a recipient first');
      return;
    }
    
    setIsSearching(true);
    // TODO: Implement AI-powered gift search using OpenAI
    // Build prompt from recipient profile
    const prompt = buildGiftSearchPrompt(selectedRecipient, searchQuery);
    console.log('Search prompt:', prompt);
    
    setTimeout(() => {
      setIsSearching(false);
      // Mock suggestions for demo
      setSuggestions([
        {
          id: '1',
          title: 'Personalised Star Map',
          description: 'A custom poster showing the stars on a special date',
          price: 29.99,
          url: 'https://example.com/star-map',
          matchScore: 95,
        },
        {
          id: '2',
          title: 'Craft Gin Making Kit',
          description: 'Create your own botanical gin at home',
          price: 45.00,
          url: 'https://example.com/gin-kit',
          matchScore: 88,
        },
        {
          id: '3',
          title: 'Weighted Blanket',
          description: 'Premium weighted blanket for relaxation',
          price: 75.00,
          url: 'https://example.com/blanket',
          matchScore: 82,
        },
      ]);
    }, 2000);
  };

  const buildGiftSearchPrompt = (recipient: GiftRecipient, query: string) => {
    return `Find gift suggestions for:
Name: ${recipient.name}
Relationship: ${recipient.relationship}
Age: ${recipient.age || recipient.ageCategory || 'Unknown'}
Hobbies: ${recipient.hobbies.join(', ') || 'Not specified'}
Dislikes: ${recipient.dislikes.join(', ') || 'Not specified'}
Personality: ${recipient.personalityTypes.map(p => 
  PERSONALITY_TYPES.find(pt => pt.value === p)?.label
).join(', ') || 'Not specified'}
Additional context: ${query || 'No specific requirements'}`;
  };

  const toggleInterest = (interest: string) => {
    const current = newRecipient.hobbies || [];
    if (current.includes(interest)) {
      setNewRecipient({ ...newRecipient, hobbies: current.filter(h => h !== interest) });
    } else {
      setNewRecipient({ ...newRecipient, hobbies: [...current, interest] });
    }
  };

  const togglePersonality = (personality: PersonalityType) => {
    const current = newRecipient.personalityTypes || [];
    if (current.includes(personality)) {
      setNewRecipient({ ...newRecipient, personalityTypes: current.filter(p => p !== personality) });
    } else {
      setNewRecipient({ ...newRecipient, personalityTypes: [...current, personality] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Gift Ideas" 
        subtitle="Find the perfect gift for everyone"
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="recipients" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="recipients">People</TabsTrigger>
            <TabsTrigger value="occasions">Occasions</TabsTrigger>
            <TabsTrigger value="search">AI Search</TabsTrigger>
          </TabsList>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gift Recipients</h2>
              <Dialog open={isAddingRecipient} onOpenChange={setIsAddingRecipient}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Person
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Gift Recipient</DialogTitle>
                    <DialogDescription>
                      Save details to get personalised gift suggestions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input 
                          id="name" 
                          value={newRecipient.name}
                          onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                          placeholder="e.g. Sarah"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship</Label>
                        <Input 
                          id="relationship" 
                          value={newRecipient.relationship}
                          onChange={(e) => setNewRecipient({ ...newRecipient, relationship: e.target.value })}
                          placeholder="e.g. Sister, Friend, Colleague"
                        />
                      </div>
                    </div>

                    {/* Age */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Exact Age (if known)</Label>
                        <Input 
                          id="age" 
                          type="number"
                          value={newRecipient.age || ''}
                          onChange={(e) => setNewRecipient({ ...newRecipient, age: parseInt(e.target.value) || undefined })}
                          placeholder="e.g. 35"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Or Age Category</Label>
                        <Select 
                          value={newRecipient.ageCategory}
                          onValueChange={(value: AgeCategory) => setNewRecipient({ ...newRecipient, ageCategory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                          <SelectContent>
                            {AGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Hobbies/Interests */}
                    <div className="space-y-2">
                      <Label>Hobbies & Interests</Label>
                      <p className="text-sm text-muted-foreground">Click to select, or type your own below</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SUGGESTED_INTERESTS.map(interest => (
                          <Badge 
                            key={interest}
                            variant={newRecipient.hobbies?.includes(interest) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                      <Input 
                        placeholder="Add custom interests (comma separated)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget.value;
                            const newInterests = input.split(',').map(i => i.trim()).filter(i => i);
                            setNewRecipient({ 
                              ...newRecipient, 
                              hobbies: [...(newRecipient.hobbies || []), ...newInterests] 
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>

                    {/* Dislikes */}
                    <div className="space-y-2">
                      <Label htmlFor="dislikes">Dislikes</Label>
                      <Textarea 
                        id="dislikes"
                        value={newRecipient.dislikes?.join(', ')}
                        onChange={(e) => setNewRecipient({ 
                          ...newRecipient, 
                          dislikes: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                        })}
                        placeholder="e.g. Scented candles, Alcohol, Sweets"
                      />
                    </div>

                    {/* Personality Types */}
                    <div className="space-y-2">
                      <Label>Personality Type</Label>
                      <p className="text-sm text-muted-foreground">Select all that apply</p>
                      
                      {['Social Style', 'Lifestyle', 'Gift Vibe', 'Activity'].map(category => (
                        <div key={category} className="mt-3">
                          <p className="text-sm font-medium mb-2">{category}</p>
                          <div className="flex flex-wrap gap-2">
                            {PERSONALITY_TYPES.filter(p => p.category === category).map(personality => (
                              <Badge 
                                key={personality.value}
                                variant={newRecipient.personalityTypes?.includes(personality.value) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => togglePersonality(personality.value)}
                              >
                                {personality.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea 
                        id="notes"
                        value={newRecipient.notes || ''}
                        onChange={(e) => setNewRecipient({ ...newRecipient, notes: e.target.value })}
                        placeholder="Any other helpful information..."
                      />
                    </div>

                    <Button onClick={handleAddRecipient} className="w-full">
                      Save Person
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {recipients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No recipients added yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add people to get personalised gift suggestions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipients.map(recipient => (
                  <Card 
                    key={recipient.id} 
                    className={`cursor-pointer transition-all ${
                      selectedRecipient?.id === recipient.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedRecipient(recipient)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{recipient.name}</CardTitle>
                          <CardDescription>{recipient.relationship}</CardDescription>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecipient(recipient.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {recipient.age ? `${recipient.age} years old` : 
                           recipient.ageCategory ? AGE_CATEGORIES.find(c => c.value === recipient.ageCategory)?.label : 
                           'Age not specified'}
                        </p>
                        {recipient.hobbies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {recipient.hobbies.slice(0, 3).map(hobby => (
                              <Badge key={hobby} variant="secondary" className="text-xs">
                                {hobby}
                              </Badge>
                            ))}
                            {recipient.hobbies.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{recipient.hobbies.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Occasions Tab */}
          <TabsContent value="occasions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Occasions</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Occasion
              </Button>
            </div>

            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No occasions added yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add birthdays, holidays, and special events</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Gift Search
                </CardTitle>
                <CardDescription>
                  Find perfect gifts based on personality and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Recipient</Label>
                  <Select 
                    value={selectedRecipient?.id}
                    onValueChange={(id) => setSelectedRecipient(recipients.find(r => r.id === id) || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.relationship})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-query">Additional Requirements (optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="search-query"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Under £50, eco-friendly, experiences"
                    />
                    <Button 
                      onClick={handleSearchGifts}
                      disabled={isSearching || !selectedRecipient}
                      className="gap-2"
                    >
                      {isSearching ? (
                        <>Searching...</>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedRecipient && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                    <p className="font-medium mb-1">Searching for: {selectedRecipient.name}</p>
                    <p className="text-muted-foreground">
                      {selectedRecipient.hobbies.length > 0 && `Interests: ${selectedRecipient.hobbies.join(', ')}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search Results */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gift Suggestions</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map(suggestion => (
                    <Card key={suggestion.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <Badge variant="secondary">{suggestion.matchScore}% match</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">£{suggestion.price.toFixed(2)}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="gap-1" asChild>
                              <a href={suggestion.url} target="_blank" rel="noopener noreferrer">
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GiftsPage;
