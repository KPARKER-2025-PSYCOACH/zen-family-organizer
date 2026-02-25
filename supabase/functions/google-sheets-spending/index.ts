import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CATEGORIES = [
  "Bills","Groceries","Car/ Transport Costs","Insurance/Tax","Childcare/Nursery Fees",
  "Clubs/ Sports","Clothes & Shoes","Dining & Takeaways","Subscriptions/Memberships",
  "Outings/ Leisure","Savings Contribution","Holiday/Vacation","Debt/Loan Repayments","Other"
];

const headerFormat = {
  backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 },
  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
};

const currencyFormat = { numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } };

function buildMonthSheet(monthName: string, monthIndex: number): any {
  const rows: any[][] = [];
  const DATA_ROWS = 40; // blank rows for data entry per category

  // Each category gets 3 columns: Date, Description, Amount
  // Header row with category names spanning 3 cols each
  const catHeaderRow: any[] = [];
  for (const cat of CATEGORIES) {
    catHeaderRow.push(
      { userEnteredValue: { stringValue: cat }, userEnteredFormat: { ...headerFormat, horizontalAlignment: "CENTER" } },
      { userEnteredValue: { stringValue: "" }, userEnteredFormat: headerFormat },
      { userEnteredValue: { stringValue: "" }, userEnteredFormat: headerFormat },
    );
  }
  rows.push(catHeaderRow);

  // Sub-header row: Date | Description | Amount repeated
  const subHeaderRow: any[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    subHeaderRow.push(
      { userEnteredValue: { stringValue: "Date" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
      { userEnteredValue: { stringValue: "Description" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
      { userEnteredValue: { stringValue: "Amount (£)" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    );
  }
  rows.push(subHeaderRow);

  // Empty data rows
  for (let r = 0; r < DATA_ROWS; r++) {
    const row: any[] = [];
    for (let i = 0; i < CATEGORIES.length; i++) {
      row.push(
        { userEnteredValue: { stringValue: "" } },
        { userEnteredValue: { stringValue: "" } },
        { userEnteredValue: { numberValue: 0 }, userEnteredFormat: currencyFormat },
      );
    }
    rows.push(row);
  }

  // Totals row
  const totalRowNum = DATA_ROWS + 3; // 1-indexed: header=1, subheader=2, data starts at 3
  const totalRow: any[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const amountCol = String.fromCharCode(65 + i * 3 + 2); // C, F, I, ...
    // Use INDIRECT for cols beyond Z
    const colRef = getColLetter(i * 3 + 2);
    totalRow.push(
      { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
      { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
      { userEnteredValue: { formulaValue: `=SUM(${colRef}3:${colRef}${totalRowNum - 1})` }, userEnteredFormat: { ...currencyFormat, textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    );
  }
  rows.push(totalRow);

  // Merge cells for category headers
  const merges = CATEGORIES.map((_, i) => ({
    sheetId: monthIndex + 2, // offset by 2 for overview + dashboard sheets
    startRowIndex: 0,
    endRowIndex: 1,
    startColumnIndex: i * 3,
    endColumnIndex: i * 3 + 3,
  }));

  return {
    properties: {
      title: monthName,
      gridProperties: { frozenRowCount: 2, columnCount: CATEGORIES.length * 3 },
      sheetId: monthIndex + 2,
    },
    data: [{ startRow: 0, startColumn: 0, rowData: rows.map(r => ({ values: r })) }],
    merges,
  };
}

function getColLetter(index: number): string {
  let result = "";
  let i = index;
  while (i >= 0) {
    result = String.fromCharCode(65 + (i % 26)) + result;
    i = Math.floor(i / 26) - 1;
  }
  return result;
}

function buildAnnualOverviewSheet(year: number): any {
  const rows: any[][] = [];

  // Title
  rows.push([
    { userEnteredValue: { stringValue: `Annual Family Spending Overview` }, userEnteredFormat: { textFormat: { bold: true, fontSize: 14 }, ...headerFormat } },
  ]);
  rows.push([]);

  // Headers
  rows.push([
    { userEnteredValue: { stringValue: "Category" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
    { userEnteredValue: { stringValue: "Annual Spend (£)" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
    { userEnteredValue: { stringValue: "Average per Month (£)" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
  ]);

  // Category rows pulling from dashboard sheet
  for (let i = 0; i < CATEGORIES.length; i++) {
    const rowNum = i + 4;
    rows.push([
      { userEnteredValue: { stringValue: CATEGORIES[i] } },
      { userEnteredValue: { formulaValue: `='Spending Dashboard'!B${i + 3}` }, userEnteredFormat: currencyFormat },
      { userEnteredValue: { formulaValue: `=B${rowNum}/12` }, userEnteredFormat: currencyFormat },
    ]);
  }

  // Total row
  const totalRow = CATEGORIES.length + 4;
  rows.push([
    { userEnteredValue: { stringValue: "TOTAL" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { formulaValue: `=SUM(B4:B${totalRow - 1})` }, userEnteredFormat: { ...currencyFormat, textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { formulaValue: `=SUM(C4:C${totalRow - 1})` }, userEnteredFormat: { ...currencyFormat, textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
  ]);

  return {
    properties: { title: "Annual Overview", gridProperties: { frozenRowCount: 3 }, sheetId: 0 },
    data: [{ startRow: 0, startColumn: 0, rowData: rows.map(r => ({ values: r })) }],
  };
}

function buildDashboardSheet(): any {
  const rows: any[][] = [];

  rows.push([
    { userEnteredValue: { stringValue: "Spending Dashboard" }, userEnteredFormat: { textFormat: { bold: true, fontSize: 14 }, ...headerFormat } },
  ]);
  rows.push([
    { userEnteredValue: { stringValue: "Category" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
    { userEnteredValue: { stringValue: "Annual Spend (£)" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
  ]);

  // Each category: sum from all 12 monthly sheets
  for (let i = 0; i < CATEGORIES.length; i++) {
    const catIndex = i;
    const amountColIndex = catIndex * 3 + 2; // 0-indexed column for Amount
    const colLetter = getColLetter(amountColIndex);
    const totalRowNum = 43; // row 43 is the totals row in monthly sheets

    const monthRefs = MONTHS.map(m => `'${m}'!${colLetter}${totalRowNum}`);
    rows.push([
      { userEnteredValue: { stringValue: CATEGORIES[i] } },
      { userEnteredValue: { formulaValue: `=${monthRefs.join("+")}` }, userEnteredFormat: currencyFormat },
    ]);
  }

  return {
    properties: { title: "Spending Dashboard", gridProperties: { frozenRowCount: 2 }, sheetId: 1 },
    data: [{ startRow: 0, startColumn: 0, rowData: rows.map(r => ({ values: r })) }],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, year } = await req.json();
    const targetYear = year || new Date().getFullYear();

    if (action === "get_auth_url") {
      const clientId = Deno.env.get("OAuth_Client_ID");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      if (!clientId) {
        return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-auth`;
      const scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/userinfo.email"
      ];

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes.join(" "),
        access_type: "offline",
        prompt: "consent",
        state: JSON.stringify({ userId: user.id, connectionType: "sheets" }),
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_spreadsheet") {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: conn } = await serviceClient
        .from("calendar_connections")
        .select("access_token, refresh_token, token_expires_at")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: "No Google connection found. Please connect Google first via Calendar or Email." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let accessToken = conn.access_token;

      if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
        const clientId = Deno.env.get("OAuth_Client_ID");
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: conn.refresh_token!,
            grant_type: "refresh_token",
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          await serviceClient.from("calendar_connections").update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          }).eq("user_id", user.id).eq("provider", "google");
        }
      }

      // Build sheets matching template: Annual Overview, Dashboard, 12 months
      const sheets = [
        buildAnnualOverviewSheet(targetYear),
        buildDashboardSheet(),
        ...MONTHS.map((m, i) => buildMonthSheet(m, i)),
      ];

      const spreadsheetBody = {
        properties: { title: `Spending Tracker ${targetYear}` },
        sheets,
      };

      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(spreadsheetBody),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error("Sheets API error:", err);
        return new Response(JSON.stringify({ error: "Failed to create spreadsheet. Make sure Google Sheets API is enabled." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const spreadsheet = await createRes.json();

      await serviceClient.from("sheets_connections").upsert({
        user_id: user.id,
        spreadsheet_id: spreadsheet.spreadsheetId,
        spreadsheet_url: spreadsheet.spreadsheetUrl,
        title: `Spending Tracker ${targetYear}`,
        year: targetYear,
      }, { onConflict: "user_id,year", ignoreDuplicates: false });

      return new Response(JSON.stringify({
        success: true,
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: spreadsheet.spreadsheetUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_connections") {
      const { data: connections } = await supabase
        .from("sheets_connections")
        .select("*")
        .order("year", { ascending: false });

      return new Response(JSON.stringify({ connections: connections || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-sheets-spending error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
