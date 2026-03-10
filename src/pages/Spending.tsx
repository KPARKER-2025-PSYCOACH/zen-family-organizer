import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PoundSterling, Download, TrendingUp, BarChart3, Hash, ChevronLeft, ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import SpendsheetGrid from "@/components/spending/SpreadsheetGrid";
import SpendingCharts from "@/components/spending/SpendingCharts";
import {
  useSpendingData, SPENDING_CATEGORIES, getMonthName, getMonthShort, formatGBP,
} from "@/hooks/useSpendingData";
import { exportSpendingToXlsx } from "@/lib/exportSpending";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const SpendingPage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showSummary, setShowSummary] = useState(false);

  const {
    entries, loading, addEntry, updateEntry, deleteEntry,
    totalByCategory, totalByMonth, grandTotal, topCategory, avgPerMonth, entryCount, refetch,
  } = useSpendingData(parseInt(selectedYear));

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const monthEntries = useMemo(() =>
    entries.filter(e => e.month === selectedMonth), [entries, selectedMonth]);

  const handleExport = () => {
    exportSpendingToXlsx(entries, parseInt(selectedYear));
  };

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
        subtitle="Enter expenses directly — type, tab, paste from a spreadsheet"
      />

      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Top bar: year + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showSummary ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className="gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showSummary ? "Hide Summary" : "Annual Summary"}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={entries.length === 0} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export Excel
          </Button>
        </div>

        {/* Collapsible annual summary */}
        {showSummary && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summaryCards.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="shadow-soft">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-base font-bold truncate">{value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <SpendingCharts totalByCategory={totalByCategory} totalByMonth={totalByMonth} />

            {/* Category breakdown table */}
            <Card className="shadow-soft">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold">Category Breakdown — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Annual (£)</TableHead>
                      <TableHead className="text-xs text-right">Avg/Month (£)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalByCategory.map(({ category, total }) => (
                      <TableRow key={category} className={total > 0 ? "" : "text-muted-foreground/50"}>
                        <TableCell className="text-sm py-1.5">{category}</TableCell>
                        <TableCell className="text-sm text-right py-1.5">{formatGBP(total)}</TableCell>
                        <TableCell className="text-sm text-right py-1.5">{formatGBP(total / 12)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                      <TableCell className="py-1.5">TOTAL</TableCell>
                      <TableCell className="text-right py-1.5">{formatGBP(grandTotal)}</TableCell>
                      <TableCell className="text-right py-1.5">{formatGBP(grandTotal / 12)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MONTH TABS — the main feature */}
        <div className="space-y-1">
          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSelectedMonth(m => Math.max(1, m - 1))}
              disabled={selectedMonth === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <ScrollArea className="flex-1">
              <div className="flex gap-1 pb-1">
                {MONTHS.map(m => {
                  const monthTotal = totalByMonth.find(t => t.month === m)?.total || 0;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={cn(
                        "flex flex-col items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                        selectedMonth === m
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span>{getMonthShort(m)}</span>
                      {monthTotal > 0 && (
                        <span className={cn(
                          "text-[10px] mt-0.5",
                          selectedMonth === m ? "text-primary-foreground/70" : "text-muted-foreground/60"
                        )}>
                          {formatGBP(monthTotal)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSelectedMonth(m => Math.min(12, m + 1))}
              disabled={selectedMonth === 12}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month label */}
          <h2 className="text-lg font-semibold px-1">
            {getMonthName(selectedMonth)} {selectedYear}
          </h2>
        </div>

        {/* Spreadsheet grid — THE MAIN FEATURE */}
        <SpreadsheetGrid
          month={selectedMonth}
          year={parseInt(selectedYear)}
          entries={monthEntries}
          onAdd={addEntry}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
          onRefetch={refetch}
        />
      </div>
    </div>
  );
};

export default SpendingPage;
