import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function Charts({ type, data, width = 400, height = 400 }) {
  console.log(type, data)
    switch (type) {
    case "line":
      return (
        <LineChart data={data} width={width} height={height}>
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="y" dot={false} />
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={data} width={width} height={height}>
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="y" />
        </AreaChart>
      );
    case "bar":
      return (
        <BarChart data={data} width={width} height={height}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#4caf50" />
        </BarChart>
      );
    case "pie":
      return (
        <PieChart width={width} height={height}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={20}
            outerRadius={40}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      );
    default:
      return null;
  }
}
