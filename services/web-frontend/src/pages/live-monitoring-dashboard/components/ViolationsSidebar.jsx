import React from 'react';

const ViolationsSidebar = ({ violations, onViolationClick, alertFilter }) => {
  const filteredViolations = violations.filter(violation => {
    if (alertFilter === 'unacknowledged') {
      return violation.status !== 'acknowledged';
    }
    return true;
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-card border border-border rounded-lg">
      <h3 className="text-lg font-semibold text-foreground">Live Violations</h3>
      {filteredViolations.length === 0 ? (
        <p className="text-muted-foreground">No live violations to display.</p>
      ) : (
        filteredViolations.map(violation => (
          <div 
            key={violation.id} 
            className="border border-border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => onViolationClick(violation)}
          >
            <p className="text-sm font-medium">Violation: {violation.violationType}</p>
            <p className="text-xs text-muted-foreground">Camera: {violation.cameraName}</p>
            <p className="text-xs text-muted-foreground">Time: {new Date(violation.timestamp).toLocaleTimeString()}</p>
            {/* Add snapshot and more details here later */}
          </div>
        ))
      )}
    </div>
  );
};

export default ViolationsSidebar;