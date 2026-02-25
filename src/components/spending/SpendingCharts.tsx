import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const hasData = pieData.length > 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Monthly Spending</CardTitle></CardHeader>
        <CardContent>
          {totalByMonth.some(m => m.total > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={totalByMonth}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `£${v}`} />
                <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, "Spent"]} />
                <Bar dataKey="total" fill="hsl(175 26% 34%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No spending data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category.split("/")[0].trim()} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No spending data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingCharts;
