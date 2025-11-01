'use client';

import type { BudgetEstimate } from "@/lib/types/plan";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#0f172a", "#6366f1", "#22d3ee", "#f97316", "#10b981"];

interface BudgetSummaryProps {
  budget: BudgetEstimate;
}

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  const data = [
    { name: "交通", value: budget.transportation },
    { name: "住宿", value: budget.lodging },
    { name: "活动", value: budget.activities },
    { name: "餐饮", value: budget.dining },
    { name: "预留", value: budget.contingency },
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toLocaleString()} ${budget.currency}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
