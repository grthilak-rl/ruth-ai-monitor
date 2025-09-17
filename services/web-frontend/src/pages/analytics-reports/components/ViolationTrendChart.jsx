import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ViolationTrendChart = ({ data, loading = false }) => {
  const chartData = [
    { date: '08/01', ppe: 12, fire: 3, fall: 8, total: 23 },
    { date: '08/05', ppe: 18, fire: 1, fall: 12, total: 31 },
    { date: '08/10', ppe: 15, fire: 5, fall: 6, total: 26 },
    { date: '08/15', ppe: 22, fire: 2, fall: 14, total: 38 },
    { date: '08/20', ppe: 19, fire: 4, fall: 9, total: 32 },
    { date: '08/25', ppe: 16, fire: 1, fall: 11, total: 28 },
    { date: '08/30', ppe: 14, fire: 3, fall: 7, total: 24 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">{`Date: ${label}`}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {`${entry?.name}: ${entry?.value} violations`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Violation Trends</h3>
        <div className="text-sm text-muted-foreground">
          Last 30 days
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data || chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              name="Total Violations"
              dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="ppe" 
              stroke="var(--color-warning)" 
              strokeWidth={2}
              name="PPE Violations"
              dot={{ fill: 'var(--color-warning)', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="fire" 
              stroke="var(--color-error)" 
              strokeWidth={2}
              name="Fire/Smoke"
              dot={{ fill: 'var(--color-error)', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="fall" 
              stroke="var(--color-accent)" 
              strokeWidth={2}
              name="Fall Detection"
              dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ViolationTrendChart;