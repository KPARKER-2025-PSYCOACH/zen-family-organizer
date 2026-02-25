import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PoundSterling, FileSpreadsheet, ExternalLink, Plus, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import AddSpendingDialog from "@/components/spending/AddSpendingDialog";
import SpendingCharts from "@/components/spending/SpendingCharts";
import { useSpendingData, SPENDING_CATEGORIES, getMonthName } from "@/hooks/useSpendingData";
import { format } from "date-fns";

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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  
  // Google Sheets state
  const [connections, setConnections] = useState<SheetConnection[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // In-app spending data
  const { entries, loading, addEntry, deleteEntry, totalByCategory, totalByMonth, grandTotal } = useSpendingData(parseInt(selectedYear));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setSheetsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("google-sheets-spending", {
        body: { action: "get_connections" },
      });
      if (res.data?.connections) setConnections(res.data.connections);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setSheetsLoading(false);
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
        toast({ title: "Spreadsheet created!", description: "Your spending tracker is ready in Google Sheets." });
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
  const monthEntries = entries.filter(e => e.month === parseInt(selectedMonth));

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Track Spending"
        subtitle="Log expenses, see where your money goes, and export to Google Sheets"
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Top bar: Year + Add + Export */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AddSpendingDialog onAdd={addEntry} />
          </div>
          <div className="flex items-center gap-2">
            {currentYearSheet ? (
              <Button variant="outline" onClick={() => window.open(currentYearSheet.spreadsheet_url, "_blank")} className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open in Sheets
              </Button>
            ) : (
              <Button variant="outline" onClick={createSpreadsheet} disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export to Google Sheets
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total {selectedYear}</p>
              <p className="text-2xl font-bold">£{grandTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Avg per Month</p>
              <p className="text-2xl font-bold">£{(grandTotal / 12).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold">{entries.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-lg font-bold truncate">
                {totalByCategory.sort((a, b) => b.total - a.total)[0]?.total > 0
                  ? totalByCategory.sort((a, b) => b.total - a.total)[0].category
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <SpendingCharts totalByCategory={totalByCategory} totalByMonth={totalByMonth} />

        {/* Tabs: Overview + Monthly */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Annual Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Detail</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Annual Spend (£)</TableHead>
                      <TableHead className="text-right">Avg per Month (£)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalByCategory.map(({ category, total }) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right">£{total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">£{(total / 12).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-secondary/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">£{grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">£{(grandTotal / 12).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{getMonthName(parseInt(selectedMonth))} {selectedYear}</CardTitle>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{getMonthName(i + 1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {monthEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No entries for {getMonthName(parseInt(selectedMonth))} yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount (£)</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.date), "dd MMM")}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.category}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{entry.description || "—"}</TableCell>
                          <TableCell className="text-right font-medium">£{Number(entry.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-secondary/50 font-bold">
                        <TableCell colSpan={3}>TOTAL</TableCell>
                        <TableCell className="text-right">£{monthEntries.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SpendingPage;
