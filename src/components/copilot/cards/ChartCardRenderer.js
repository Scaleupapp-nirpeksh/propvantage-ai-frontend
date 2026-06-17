// File: src/components/copilot/cards/ChartCardRenderer.js
// Renders Recharts charts (bar, line, area, pie) from copilot response data

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

// Compact INR formatter for chart axis
const fmtAxisValue = (value) => {
  if (typeof value !== 'number') return value;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return value;
};

const ChartCardRenderer = ({ card }) => {
  const theme = useTheme();
  const chartColors = theme.custom?.chartColors || [
    '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#e53935',
  ];

  const { chartType, data, xKey, yKeys, title } = card;

  const renderChart = () => {
    const commonXAxis = (
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
    );
    const commonYAxis = (
      <YAxis
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={fmtAxisValue}
        width={50}
      />
    );
    const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />;
    const commonTooltip = <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />;

    if (chartType === 'pie') {
      const valueKey = yKeys[0];
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={35}
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            style={{ fontSize: 9 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={chartColors[i % chartColors.length]} />
            ))}
          </Pie>
          {commonTooltip}
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart data={data}>
          {commonGrid}
          {commonXAxis}
          {commonYAxis}
          {commonTooltip}
          {yKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={chartColors[i % chartColors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart data={data}>
          {commonGrid}
          {commonXAxis}
          {commonYAxis}
          {commonTooltip}
          {yKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              fill={chartColors[i % chartColors.length]}
              fillOpacity={0.15}
              stroke={chartColors[i % chartColors.length]}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    }

    // Default: bar
    return (
      <BarChart data={data}>
        {commonGrid}
        {commonXAxis}
        {commonYAxis}
        {commonTooltip}
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={chartColors[i % chartColors.length]}
            radius={[4, 4, 0, 0]}
            barSize={yKeys.length > 1 ? 16 : 24}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <Box sx={{ mb: 1 }}>
      {title && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            mb: 0.75,
            display: 'block',
            fontSize: '0.688rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Typography>
      )}
      <Box
        sx={{
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          p: 1,
          bgcolor: 'background.paper',
        }}
      >
        <ResponsiveContainer width="100%" height={180}>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ChartCardRenderer;
