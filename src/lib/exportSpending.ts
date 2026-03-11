import * as XLSX from "xlsx";
import { SpendingEntry, SPENDING_CATEGORIES, getMonthName } from "@/hooks/useSpendingData";

export function exportSpendingToXlsx(entries: SpendingEntry[], year: number) {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Annual Overview ---
  const catRows = SPENDING_CATEGORIES.map(cat => {
    const total = entries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    const monthsUsed = new Set(entries.filter(e => e.category === cat).map(e => e.month)).size;
    return {
      Category: cat as string,
      "Annual Spend (£)": total,
      "Avg per Month (£)": monthsUsed > 0 ? Math.round((total / monthsUsed) * 100) / 100 : 0,
    };
  });
  const grandTotal = entries.reduce((s, e) => s + Number(e.amount), 0);
  catRows.push({
    Category: "TOTAL",
    "Annual Spend (£)": grandTotal,
    "Avg per Month (£)": Math.round((grandTotal / 12) * 100) / 100,
  });
  const overviewWs = XLSX.utils.json_to_sheet(catRows);
  overviewWs["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, overviewWs, "Annual Overview");

  // --- Sheet 2: Charts Data ---
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
    Month: getMonthName(i + 1),
    "Total (£)": entries.filter(e => e.month === i + 1).reduce((s, e) => s + Number(e.amount), 0),
  }));
  const chartsWs = XLSX.utils.json_to_sheet(monthlyTotals);
  chartsWs["!cols"] = [{ wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, chartsWs, "Charts Data");

  // --- Sheets 3-14: Monthly sheets with CATEGORY COLUMNS ---
  const catHeaders = SPENDING_CATEGORIES.map(c => c as string);
  const headers = ["Date", "Description", ...catHeaders];

  for (let m = 1; m <= 12; m++) {
    const monthEntries = entries
      .filter(e => e.month === m)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows: (string | number)[][] = [];
    rows.push(headers);

    for (const e of monthEntries) {
      const row: (string | number)[] = [
        new Date(e.date).toLocaleDateString("en-GB"),
        e.description || "",
      ];
      for (const cat of SPENDING_CATEGORIES) {
        row.push(e.category === cat ? Number(e.amount) : "");
      }
      rows.push(row);
    }

    // Blank row then totals
    rows.push([]);
    const totalsRow: (string | number)[] = ["", "TOTALS"];
    for (const cat of SPENDING_CATEGORIES) {
      const catTotal = monthEntries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
      totalsRow.push(catTotal > 0 ? catTotal : "");
    }
    rows.push(totalsRow);

    const monthTotal = monthEntries.reduce((s, e) => s + Number(e.amount), 0);
    const grandRow: (string | number)[] = ["", "MONTH TOTAL"];
    // Put month total in first category column
    grandRow.push(monthTotal);
    rows.push(grandRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = [{ wch: 12 }, { wch: 22 }];
    for (let i = 0; i < SPENDING_CATEGORIES.length; i++) {
      colWidths.push({ wch: 14 });
    }
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, getMonthName(m));
  }

  XLSX.writeFile(wb, `Spending_Tracker_${year}.xlsx`);
}
