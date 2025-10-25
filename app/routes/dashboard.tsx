// app/routes/dashboard.tsx
import { data, useLoaderData } from "react-router";
import { db } from "~/db/drizzle";
import { pomodoroSessions } from "~/db/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export async function loader() {
  const rows = await db
    .select()
    .from(pomodoroSessions)
    .orderBy(pomodoroSessions.completedAt);
  // aggregate by date (YYYY-MM-DD)
  const grouped: Record<string, number> = {};
  for (const r of rows) {
    const d = new Date(r.completedAt!).toISOString().slice(0, 10);
    grouped[d] = (grouped[d] || 0) + 1;
  }
  const chartData = Object.entries(grouped).map(([date, count]) => ({
    date,
    count,
  }));
  return data({ chartData });
}

export default function Dashboard() {
  const { chartData } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Focus Dashboard</h1>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
