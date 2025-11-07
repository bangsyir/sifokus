// app/routes/dashboard.tsx
import { data, useLoaderData } from "react-router";
import { db } from "~/db/drizzle";
import { taskSessions } from "~/db/schema";
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
    .from(taskSessions)
    .orderBy(taskSessions.completedAt);
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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Focus Dashboard</h1>
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
