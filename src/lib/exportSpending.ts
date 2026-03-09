import * as XLSX from "xlsx";
import { SpendingEntry, SPENDING_CATEGORIES, getMonthName, formatGBP } from "@/hooks/useSpendingData";

export function exportSpendingToXlsx(entries: SpendingEntry[], year: number) {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Annual Overview ---
  const catRows: { Category: string; "Annual Spend (£)": number; "Avg per Month (£)": number }[] = SPENDING_CATEGORIES.map(cat => {
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

  // --- Sheets 3-14: Monthly sheets ---
  for (let m = 1; m <= 12; m++) {
    const monthEntries = entries
      .filter(e => e.month === m)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows = monthEntries.map(e => ({
      Date: new Date(e.date).toLocaleDateString("en-GB"),
      Description: e.description || "",
      Category: e.category,
      "Amount (£)": Number(e.amount),
    }));

    // Add category subtotals
    rows.push({ Date: "", Description: "", Category: "", "Amount (£)": 0 });
    rows.push({ Date: "", Description: "CATEGORY TOTALS", Category: "", "Amount (£)": 0 });
    SPENDING_CATEGORIES.forEach(cat => {
      const catTotal = monthEntries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
      if (catTotal > 0) {
        rows.push({ Date: "", Description: "", Category: cat, "Amount (£)": catTotal });
      }
    });
    const monthTotal = monthEntries.reduce((s, e) => s + Number(e.amount), 0);
    rows.push({ Date: "", Description: "MONTH TOTAL", Category: "", "Amount (£)": monthTotal });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 28 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, getMonthName(m));
  }

  XLSX.writeFile(wb, `Spending_Tracker_${year}.xlsx`);
}
