import React from 'react';

const HeatMapChart = ({ data, loading = false }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const heatmapData = [
    [2, 1, 0, 0, 0, 1, 3, 8, 12, 15, 18, 22, 25, 28, 24, 20, 16, 12, 8, 5, 3, 2, 1, 1],
    [1, 0, 0, 0, 1, 2, 5, 10, 16, 20, 24, 28, 32, 30, 26, 22, 18, 14, 10, 6, 4, 2, 1, 0],
    [0, 0, 1, 0, 1, 3, 6, 12, 18, 22, 26, 30, 35, 32, 28, 24, 20, 16, 12, 8, 5, 3, 1, 1],
    [1, 1, 0, 1, 2, 4, 7, 14, 20, 25, 28, 33, 38, 35, 30, 26, 22, 18, 14, 10, 6, 4, 2, 1],
    [2, 0, 1, 0, 1, 3, 8, 15, 22, 27, 30, 35, 40, 37, 32, 28, 24, 20, 16, 12, 8, 5, 3, 2],
    [1, 1, 0, 0, 0, 1, 4, 8, 12, 16, 20, 24, 28, 25, 22, 18, 14, 10, 6, 4, 2, 1, 1, 0],
    [0, 0, 0, 0, 1, 2, 3, 6, 10, 14, 18, 22, 26, 23, 20, 16, 12, 8, 5, 3, 2, 1, 0, 0]
  ];

  const getIntensityColor = (value) => {
    if (value === 0) return 'bg-muted';
    if (value <= 5) return 'bg-success/20';
    if (value <= 15) return 'bg-warning/40';
    if (value <= 25) return 'bg-warning/60';
    if (value <= 35) return 'bg-error/60';
    return 'bg-error/80';
  };

  const getIntensityLabel = (value) => {
    if (value === 0) return 'No violations';
    if (value <= 5) return 'Low activity';
    if (value <= 15) return 'Moderate activity';
    if (value <= 25) return 'High activity';
    if (value <= 35) return 'Very high activity';
    return 'Critical activity';
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
        <h3 className="text-lg font-semibold text-foreground">Violation Heat Map</h3>
        <div className="text-sm text-muted-foreground">
          Peak hours: 12:00-15:00
        </div>
      </div>
      <div className="space-y-4">
        {/* Time labels */}
        <div className="flex items-center space-x-1 ml-12">
          {hours?.map((hour) => (
            <div key={hour} className="w-4 text-xs text-muted-foreground text-center">
              {hour % 6 === 0 ? `${hour}:00` : ''}
            </div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="space-y-1">
          {days?.map((day, dayIndex) => (
            <div key={day} className="flex items-center space-x-1">
              <div className="w-10 text-xs font-medium text-muted-foreground text-right">
                {day}
              </div>
              <div className="flex space-x-1">
                {hours?.map((hour) => {
                  const value = heatmapData?.[dayIndex]?.[hour];
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-4 h-4 rounded-sm ${getIntensityColor(value)} cursor-pointer hover:ring-2 hover:ring-ring transition-all duration-150`}
                      title={`${day} ${hour}:00 - ${value} violations (${getIntensityLabel(value)})`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Violations per hour
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-sm bg-muted"></div>
              <div className="w-3 h-3 rounded-sm bg-success/20"></div>
              <div className="w-3 h-3 rounded-sm bg-warning/40"></div>
              <div className="w-3 h-3 rounded-sm bg-warning/60"></div>
              <div className="w-3 h-3 rounded-sm bg-error/60"></div>
              <div className="w-3 h-3 rounded-sm bg-error/80"></div>
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatMapChart;