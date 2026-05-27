"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

const DAYS = ["الخميس","الجمعة","السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"];

interface Props {
  data: number[];  // 7 values
}

export default function ActivityChart({ data }: Props) {
  const chartData = DAYS.map((d, i) => ({ day: d, نشاط: data[i] ?? 0 }));

  return (
    <div className="card">
      <h3 className="section-title">نشاطك التعليمي</h3>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,.3)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,.3)" }}
            axisLine={false} tickLine={false}
            domain={[0, 1]}
          />
          <Tooltip
            contentStyle={{
              background: "#1e2640",
              border: "1px solid rgba(232,25,124,.3)",
              borderRadius: 10,
              fontSize: 12,
              direction: "rtl",
            }}
          />
          <Line
            type="monotone"
            dataKey="نشاط"
            stroke="#e8197c"
            strokeWidth={2}
            dot={{ fill: "#e8197c", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-center mt-2 text-gray-400 dark:text-white/25">
        *ابدأ أول كورس علشان نعرضلك بياناتك التعليمية بشكل دقيق!
      </p>
    </div>
  );
}
