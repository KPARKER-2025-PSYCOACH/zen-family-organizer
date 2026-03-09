import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { PoundSterling } from "lucide-react";

const COLORS = [
  "hsl(175 26% 34%)", "hsl(103 14% 68%)", "hsl(17 51% 58%)", "hsl(40 28% 60%)",
  "hsl(206 11% 50%)", "hsl(175 26% 50%)", "hsl(103 20% 45%)", "hsl(17 40% 45%)",
  "hsl(40 28% 45%)", "hsl(196 19% 35%)", "hsl(175 30% 60%)", "hsl(103 14% 55%)",
  "hsl(17 51% 68%)", "hsl(40 28% 75%)",
];

interface Props {
  totalByCategory: { category: string; total: number }[];
  totalByMonth: { month: number; name: string; total: number }[];
}

const SpendingCharts = ({ totalByCategory, totalByMonth }: Props) => {
  const pieData = totalByCategory.filter(c => c.total > 0);
  const hasBarData = totalByMonth.some(m => m.total > 0);
  const hasPieData = pieData.length > 0;

  if (!hasBarData && !hasPieData) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <PoundSterling className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No spending data yet</h3>
          <p className="text-sm text-muted-foreground">Add your first expense to see charts and insights here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
        <CardContent>
          {hasBarData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={totalByMonth}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v}`} width={60} />
                <Tooltip
                  formatter={(v: number) => [`£${v.toFixed(2)}`, "Spent"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(40 20% 85%)" }}
                />
                <Bar dataKey="total" fill="hsl(175 26% 34%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No monthly data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          {hasPieData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  label={({ category, percent }) => `${category.split("/")[0].split("&")[0].trim()} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No category data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingCharts;
