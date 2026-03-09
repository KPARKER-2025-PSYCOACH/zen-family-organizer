import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PoundSterling, Download, Plus, Trash2, Pencil,
  TrendingUp, BarChart3, Calendar, Hash,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import AddSpendingDialog from "@/components/spending/AddSpendingDialog";
import EditSpendingDialog from "@/components/spending/EditSpendingDialog";
import DeleteConfirmDialog from "@/components/spending/DeleteConfirmDialog";
import SpendingCharts from "@/components/spending/SpendingCharts";
import {
  useSpendingData, SPENDING_CATEGORIES, getMonthName, formatGBP,
  type SpendingEntry,
} from "@/hooks/useSpendingData";
import { exportSpendingToXlsx } from "@/lib/exportSpending";
import { format } from "date-fns";

const SpendingPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit / Delete state
  const [editEntry, setEditEntry] = useState<SpendingEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    entries, loading, addEntry, updateEntry, deleteEntry,
    totalByCategory, totalByMonth, grandTotal, topCategory, avgPerMonth, entryCount,
  } = useSpendingData(parseInt(selectedYear));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Filtered monthly entries
  const monthEntries = useMemo(() => {
    let filtered = entries.filter(e => e.month === parseInt(selectedMonth));
    if (categoryFilter !== "all") {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.description || "").toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entries, selectedMonth, categoryFilter, searchQuery]);

  const monthTotal = useMemo(() =>
    monthEntries.reduce((s, e) => s + Number(e.amount), 0), [monthEntries]);

  const monthCategoryTotals = useMemo(() =>
    SPENDING_CATEGORIES.map(cat => ({
      category: cat,
      total: entries.filter(e => e.month === parseInt(selectedMonth) && e.category === cat)
        .reduce((s, e) => s + Number(e.amount), 0),
    })).filter(c => c.total > 0), [entries, selectedMonth]);

  const handleEdit = (entry: SpendingEntry) => {
    setEditEntry(entry);
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteEntry(deleteId);
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    exportSpendingToXlsx(entries, parseInt(selectedYear));
  };

  // Summary cards data
  const summaryCards = [
    { label: `Total ${selectedYear}`, value: formatGBP(grandTotal), icon: PoundSterling },
    { label: "Avg per Month", value: formatGBP(avgPerMonth), icon: TrendingUp },
    { label: "Entries", value: String(entryCount), icon: Hash },
    { label: "Top Category", value: topCategory || "—", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Track Spending"
        subtitle="Log expenses, track your budget, and download reports"
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Top bar */}
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
          <Button variant="outline" onClick={handleExport} disabled={entries.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Export to Excel
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-soft hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold truncate">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <SpendingCharts totalByCategory={totalByCategory} totalByMonth={totalByMonth} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview">Annual Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Detail</TabsTrigger>
          </TabsList>

          {/* Annual Overview */}
          <TabsContent value="overview" className="mt-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
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
                      <TableRow key={category} className={total > 0 ? "" : "text-muted-foreground"}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right">{formatGBP(total)}</TableCell>
                        <TableCell className="text-right">{formatGBP(total / 12)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatGBP(grandTotal)}</TableCell>
                      <TableCell className="text-right">{formatGBP(grandTotal / 12)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Detail */}
          <TabsContent value="monthly" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{getMonthName(i + 1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {SPENDING_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
            </div>

            {/* Month summary strip */}
            <div className="flex flex-wrap gap-3">
              <Card className="shadow-soft flex-1 min-w-[140px]">
                <CardContent className="py-3 px-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{getMonthName(parseInt(selectedMonth))} {selectedYear}</span>
                </CardContent>
              </Card>
              <Card className="shadow-soft flex-1 min-w-[140px]">
                <CardContent className="py-3 px-4">
                  <span className="text-xs text-muted-foreground">Month Total</span>
                  <p className="text-lg font-bold">{formatGBP(monthTotal)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-soft flex-1 min-w-[140px]">
                <CardContent className="py-3 px-4">
                  <span className="text-xs text-muted-foreground">Entries</span>
                  <p className="text-lg font-bold">{monthEntries.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Category subtotals for month */}
            {monthCategoryTotals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {monthCategoryTotals.map(({ category, total }) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setCategoryFilter(category === categoryFilter ? "all" : category)}
                  >
                    {category.split("/")[0].split("&")[0].trim()}: {formatGBP(total)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Entries table */}
            <Card className="shadow-soft">
              <CardContent className="pt-4 overflow-x-auto">
                {monthEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <PoundSterling className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No expenses this month</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {categoryFilter !== "all" || searchQuery
                        ? "Try adjusting your filters"
                        : "Add your first expense to get started"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[90px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount (£)</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthEntries.map(entry => (
                        <TableRow key={entry.id} className="group hover:bg-accent/30 transition-colors">
                          <TableCell className="text-sm">{format(new Date(entry.date), "dd MMM")}</TableCell>
                          <TableCell className="text-sm">{entry.description || <span className="text-muted-foreground italic">No description</span>}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatGBP(Number(entry.amount))}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(entry.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                        <TableCell colSpan={3}>TOTAL</TableCell>
                        <TableCell className="text-right">{formatGBP(monthTotal)}</TableCell>
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

      {/* Dialogs */}
      <EditSpendingDialog
        entry={editEntry}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={updateEntry}
      />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default SpendingPage;
