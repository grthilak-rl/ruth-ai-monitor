import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CameraPerformanceChart = ({ data, loading = false }) => {
  const chartData = [
    { camera: 'CAM-001', violations: 45, uptime: 98.5, accuracy: 94.2 },
    { camera: 'CAM-002', violations: 32, uptime: 99.1, accuracy: 96.8 },
    { camera: 'CAM-003', violations: 67, uptime: 97.3, accuracy: 92.1 },
    { camera: 'CAM-004', violations: 28, uptime: 99.8, accuracy: 95.4 },
    { camera: 'CAM-005', violations: 51, uptime: 96.7, accuracy: 93.6 },
    { camera: 'CAM-006', violations: 39, uptime: 98.9, accuracy: 97.2 },
    { camera: 'CAM-007', violations: 43, uptime: 99.2, accuracy: 94.8 },
    { camera: 'CAM-008', violations: 36, uptime: 97.8, accuracy: 95.1 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">{`Camera: ${label}`}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.dataKey === 'violations' && `Violations: ${entry?.value}`}
              {entry?.dataKey === 'uptime' && `Uptime: ${entry?.value}%`}
              {entry?.dataKey === 'accuracy' && `Accuracy: ${entry?.value}%`}
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
        <h3 className="text-lg font-semibold text-foreground">Camera Performance</h3>
        <div className="text-sm text-muted-foreground">
          Last 30 days
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="camera" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="violations" 
              fill="var(--color-primary)" 
              name="Violations Detected"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="uptime" 
              fill="var(--color-success)" 
              name="Uptime %"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="accuracy" 
              fill="var(--color-accent)" 
              name="AI Accuracy %"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CameraPerformanceChart;