import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CATEGORIES = [
  "Rent/Mortgage","Council Tax","Gas & Electricity","Water","Internet & TV","Mobile Phone",
  "Groceries","Household Supplies","Fuel/Commuting","Car Insurance/Tax",
  "Life & Home Insurance","Childcare/Nursery Fees","School Clubs & Sports Teams",
  "Music & Art Lessons","Tutoring/Learning Apps","School Uniforms & Gear",
  "School Lunches/Trips","Nappies/Baby Essentials","Kids' Clothes & Shoes",
  "Toys & Books","Kids' Pocket Money","Birthday Party Gifts (for others)",
  "Dining & Takeaways","Streaming Subscriptions","Family Outings",
  "Personal Care/Haircuts","Gym/Fitness","Medical/Dental",
  "Emergency Fund Contribution","Holiday/Vacation Savings","Christmas/Birthday Pot",
  "Debt/Loan Repayments"
];

function buildMonthSheet(monthName: string, monthIndex: number): any {
  const rows: any[][] = [];
  
  // Header row
  rows.push([
    { userEnteredValue: { stringValue: "Category" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Item Name" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Budgeted Amount" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Actual Amount" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Difference" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Payment Method" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Status" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Date" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
    { userEnteredValue: { stringValue: "Description" }, userEnteredFormat: { backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
  ]);

  // Category rows with formulas
  for (let i = 0; i < CATEGORIES.length; i++) {
    const rowNum = i + 2;
    rows.push([
      { userEnteredValue: { stringValue: CATEGORIES[i] } },
      { userEnteredValue: { stringValue: CATEGORIES[i] } },
      { userEnteredValue: { numberValue: 0 }, userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } } },
      { userEnteredValue: { numberValue: 0 }, userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } } },
      { userEnteredValue: { formulaValue: `=C${rowNum}-D${rowNum}` }, userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } } },
      { userEnteredValue: { stringValue: "" } },
      { userEnteredValue: { stringValue: "Pending" } },
      { userEnteredValue: { stringValue: "" } },
      { userEnteredValue: { stringValue: "" } },
    ]);
  }

  // Totals row
  const totalRow = CATEGORIES.length + 2;
  rows.push([
    { userEnteredValue: { stringValue: "TOTAL MONTHLY SPEND" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { formulaValue: `=SUM(C2:C${totalRow - 1})` }, userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { formulaValue: `=SUM(D2:D${totalRow - 1})` }, userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { formulaValue: `=C${totalRow}-D${totalRow}` }, userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    { userEnteredValue: { stringValue: "" }, userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
  ]);

  return {
    properties: {
      title: monthName,
      gridProperties: { frozenRowCount: 1 },
      sheetId: monthIndex,
    },
    data: [{ startRow: 0, startColumn: 0, rowData: rows.map(r => ({ values: r })) }],
    conditionalFormats: [
      {
        ranges: [{ sheetId: monthIndex, startRowIndex: 1, endRowIndex: totalRow, startColumnIndex: 4, endColumnIndex: 5 }],
        booleanRule: {
          condition: { type: "NUMBER_LESS", values: [{ userEnteredValue: "0" }] },
          format: { textFormat: { foregroundColor: { red: 0.8, green: 0.2, blue: 0.2 } }, backgroundColor: { red: 1, green: 0.9, blue: 0.9 } }
        }
      },
      {
        ranges: [{ sheetId: monthIndex, startRowIndex: 1, endRowIndex: totalRow, startColumnIndex: 4, endColumnIndex: 5 }],
        booleanRule: {
          condition: { type: "NUMBER_GREATER", values: [{ userEnteredValue: "0" }] },
          format: { textFormat: { foregroundColor: { red: 0.2, green: 0.6, blue: 0.2 } }, backgroundColor: { red: 0.9, green: 1, blue: 0.9 } }
        }
      }
    ]
  };
}

function buildYearlySummarySheet(year: number): any {
  const rows: any[][] = [];
  
  // Title
  rows.push([
    { userEnteredValue: { stringValue: `${year} Annual Summary` }, userEnteredFormat: { textFormat: { bold: true, fontSize: 14 }, backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 } } }
  ]);
  rows.push([]);
  
  // Headers
  rows.push([
    { userEnteredValue: { stringValue: "Category" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } },
    ...MONTHS.map(m => ({ userEnteredValue: { stringValue: m.substring(0, 3) }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.82, blue: 0.78 } } })),
    { userEnteredValue: { stringValue: "YTD Total" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
  ]);

  // Category rows with cross-sheet SUMIF references
  for (let i = 0; i < CATEGORIES.length; i++) {
    const catName = CATEGORIES[i];
    const rowNum = i + 4;
    const monthCells = MONTHS.map((m, mi) => ({
      userEnteredValue: { formulaValue: `=SUMIF('${m}'!A:A,"${catName}",'${m}'!D:D)` },
      userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } }
    }));
    rows.push([
      { userEnteredValue: { stringValue: catName } },
      ...monthCells,
      { userEnteredValue: { formulaValue: `=SUM(B${rowNum}:M${rowNum})` }, userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } } },
    ]);
  }

  // Monthly totals row
  const totalRowNum = CATEGORIES.length + 4;
  const monthTotalCells = MONTHS.map((m, mi) => {
    const col = String.fromCharCode(66 + mi); // B=66
    return {
      userEnteredValue: { formulaValue: `=SUM(${col}4:${col}${totalRowNum - 1})` },
      userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } }
    };
  });

  rows.push([
    { userEnteredValue: { stringValue: "MONTHLY TOTALS" }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.88, blue: 0.84 } } },
    ...monthTotalCells,
    { userEnteredValue: { formulaValue: `=SUM(B${totalRowNum}:M${totalRowNum})` }, userEnteredFormat: { textFormat: { bold: true, fontSize: 12 }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" }, backgroundColor: { red: 0.24, green: 0.42, blue: 0.41 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
  ]);

  // YTD running total row
  rows.push([]);
  rows.push([
    { userEnteredValue: { stringValue: "YTD Running Total" }, userEnteredFormat: { textFormat: { bold: true, fontSize: 12 } } },
    ...MONTHS.map((m, mi) => {
      const cols = [];
      for (let j = 0; j <= mi; j++) {
        cols.push(`${String.fromCharCode(66 + j)}${totalRowNum}`);
      }
      return {
        userEnteredValue: { formulaValue: `=${cols.join("+")}` },
        userEnteredFormat: { textFormat: { bold: true }, numberFormat: { type: "CURRENCY", pattern: "£#,##0.00" } }
      };
    }),
    { userEnteredValue: { stringValue: "" } },
  ]);

  return {
    properties: {
      title: "Annual Summary",
      gridProperties: { frozenRowCount: 3 },
      sheetId: 12,
    },
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
      // Get access token from calendar_connections (reuses Google OAuth)
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

      // Refresh if expired
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

      // Build sheets: 12 months + annual summary
      const sheets = [
        ...MONTHS.map((m, i) => buildMonthSheet(m, i)),
        buildYearlySummarySheet(targetYear),
      ];

      const spreadsheetBody = {
        properties: { title: `Family Budget ${targetYear}` },
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

      // Save connection
      await serviceClient.from("sheets_connections").upsert({
        user_id: user.id,
        spreadsheet_id: spreadsheet.spreadsheetId,
        spreadsheet_url: spreadsheet.spreadsheetUrl,
        title: `Family Budget ${targetYear}`,
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
