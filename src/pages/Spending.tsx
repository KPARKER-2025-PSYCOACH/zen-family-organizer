import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PoundSterling, FileSpreadsheet, ExternalLink, Plus, CheckCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";

const CATEGORIES = [
  "Rent/Mortgage", "Council Tax", "Gas & Electricity", "Water", "Internet & TV", "Mobile Phone",
  "Groceries", "Household Supplies", "Fuel/Commuting", "Car Insurance/Tax",
  "Life & Home Insurance", "Childcare/Nursery Fees", "School Clubs & Sports Teams",
  "Music & Art Lessons", "Tutoring/Learning Apps", "School Uniforms & Gear",
  "School Lunches/Trips", "Nappies/Baby Essentials", "Kids' Clothes & Shoes",
  "Toys & Books", "Kids' Pocket Money", "Birthday Party Gifts (for others)",
  "Dining & Takeaways", "Streaming Subscriptions", "Family Outings",
  "Personal Care/Haircuts", "Gym/Fitness", "Medical/Dental",
  "Emergency Fund Contribution", "Holiday/Vacation Savings", "Christmas/Birthday Pot",
  "Debt/Loan Repayments"
];

const CATEGORY_GROUPS: Record<string, string[]> = {
  "🏠 Housing & Bills": ["Rent/Mortgage", "Council Tax", "Gas & Electricity", "Water", "Internet & TV", "Mobile Phone"],
  "🛒 Essentials": ["Groceries", "Household Supplies", "Fuel/Commuting", "Car Insurance/Tax", "Life & Home Insurance"],
  "👶 Kids & Education": ["Childcare/Nursery Fees", "School Clubs & Sports Teams", "Music & Art Lessons", "Tutoring/Learning Apps", "School Uniforms & Gear", "School Lunches/Trips", "Nappies/Baby Essentials", "Kids' Clothes & Shoes", "Toys & Books", "Kids' Pocket Money", "Birthday Party Gifts (for others)"],
  "🎉 Lifestyle": ["Dining & Takeaways", "Streaming Subscriptions", "Family Outings", "Personal Care/Haircuts", "Gym/Fitness", "Medical/Dental"],
  "💰 Savings & Debt": ["Emergency Fund Contribution", "Holiday/Vacation Savings", "Christmas/Birthday Pot", "Debt/Loan Repayments"],
};

interface SheetConnection {
  id: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  title: string;
  year: number;
  created_at: string;
}

const SpendingPage = () => {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SheetConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("template");

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("google-sheets-spending", {
        body: { action: "get_connections" },
      });

      if (res.data?.connections) {
        setConnections(res.data.connections);
      }
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("google-sheets-spending", {
        body: { action: "create_spreadsheet", year: parseInt(selectedYear) },
      });

      if (res.data?.error) {
        toast({ title: "Error", description: res.data.error, variant: "destructive" });
        return;
      }

      if (res.data?.success) {
        toast({ title: "Spreadsheet created!", description: "Your family budget spreadsheet is ready in Google Sheets." });
        window.open(res.data.spreadsheetUrl, "_blank");
        fetchConnections();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create spreadsheet", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const currentYearSheet = connections.find(c => c.year === parseInt(selectedYear));
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Family Spending"
        subtitle="Track and manage your household budget with Google Sheets"
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Google Sheets Connection */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Budget Spreadsheet</CardTitle>
                  <CardDescription>Create a fully formatted Google Sheet with monthly tabs and annual summary</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentYearSheet ? (
                  <Button variant="outline" onClick={() => window.open(currentYearSheet.spreadsheet_url, "_blank")} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in Sheets
                  </Button>
                ) : (
                  <Button onClick={createSpreadsheet} disabled={creating} className="gap-2">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create {selectedYear} Budget
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {connections.length > 0 && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {connections.map(c => (
                  <Badge
                    key={c.id}
                    variant={c.year === parseInt(selectedYear) ? "default" : "secondary"}
                    className="cursor-pointer gap-1"
                    onClick={() => window.open(c.spreadsheet_url, "_blank")}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {c.title}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Template Preview & Features */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="template">Template Preview</TabsTrigger>
            <TabsTrigger value="categories">Budget Categories</TabsTrigger>
            <TabsTrigger value="features">Spreadsheet Features</TabsTrigger>
          </TabsList>

          <TabsContent value="template">
            <Card className="shadow-soft overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Sheet Structure</CardTitle>
                <CardDescription>Each month gets its own tab with these columns. The "Difference" column auto-calculates and is colour-coded.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary text-primary-foreground">
                        <TableHead className="text-primary-foreground font-bold">Category</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Item Name</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Budgeted</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Actual</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Difference</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Payment</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Date</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CATEGORIES.slice(0, 6).map((cat, i) => (
                        <TableRow key={cat}>
                          <TableCell className="font-medium">{cat}</TableCell>
                          <TableCell className="text-muted-foreground">{cat}</TableCell>
                          <TableCell>£0.00</TableCell>
                          <TableCell>£0.00</TableCell>
                          <TableCell className="text-success font-medium">£0.00</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-secondary/50">
                        <TableCell colSpan={2} className="font-bold">... 26 more categories</TableCell>
                        <TableCell colSpan={7} className="text-muted-foreground text-sm">Includes kids, lifestyle, savings & debt categories</TableCell>
                      </TableRow>
                      <TableRow className="bg-secondary font-bold">
                        <TableCell colSpan={2}>TOTAL MONTHLY SPEND</TableCell>
                        <TableCell>=SUM(C:C)</TableCell>
                        <TableCell>=SUM(D:D)</TableCell>
                        <TableCell>=C-D</TableCell>
                        <TableCell colSpan={4}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CATEGORY_GROUPS).map(([group, cats]) => (
                <Card key={group} className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{group}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {cats.map(cat => (
                        <li key={cat} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features">
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureCard
                title="📊 Monthly Tabs"
                description="12 separate tabs (Jan-Dec), each with all 32 budget categories pre-filled and formatted with currency symbols."
              />
              <FeatureCard
                title="📐 Auto-Formulas"
                description="Difference column (=Budgeted-Actual) auto-calculates. Monthly totals sum automatically at the bottom of each tab."
              />
              <FeatureCard
                title="🎨 Conditional Formatting"
                description="Difference column turns RED when overspent (negative) and GREEN when under budget (positive) — at a glance."
              />
              <FeatureCard
                title="📈 Annual Summary Tab"
                description="A 13th tab aggregates all months with SUMIF formulas per category, monthly totals, and a YTD running total row."
              />
              <FeatureCard
                title="💷 Currency Formatting"
                description="All monetary columns are pre-formatted as £ GBP currency with two decimal places."
              />
              <FeatureCard
                title="🔗 Cross-Sheet Formulas"
                description="Annual Summary pulls data from each month tab automatically — no manual copying needed as the year progresses."
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="shadow-soft">
    <CardContent className="pt-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default SpendingPage;
