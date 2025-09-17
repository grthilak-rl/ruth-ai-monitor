import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';
import Select from './ui/Select';

const ViolationsSidebar = ({ violations, onViewDetails, alertFilter, setAlertFilter }) => {
  const filteredViolations = alertFilter === 'all' ? violations : violations.filter(v => v.alertType === alertFilter);

  const filterOptions = [
    { value: 'all', label: 'All Violations' },
    { value: 'unacknowledged', label: 'Unacknowledged' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Violations
          <Link to="/violation-history">
            <Button variant="outline" size="sm" iconName="ArrowRight" iconPosition="right">
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select
            label="Filter by Status"
            options={filterOptions}
            value={alertFilter}
            onChange={setAlertFilter}
          />
        </div>
        <div className="space-y-4">
          {filteredViolations && filteredViolations.length > 0 ? (
            filteredViolations.map((violation) => (
              <div key={violation.id} className="flex items-center space-x-3 bg-card shadow-sm rounded-lg overflow-hidden border border-border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewDetails(violation)}
              >
                <img src={violation.thumbnail || '/assets/images/placeholder.svg'} alt="Violation Snapshot" className="w-20 h-20 object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold truncate">{violation.violationType?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{violation.cameraLocation}</p>
                  <p className="text-xs text-muted-foreground">{new Date(violation.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent violations to display.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViolationsSidebar;