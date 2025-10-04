import React, { useState, useEffect } from 'react';
import { MapPin, Info } from 'lucide-react';
import Map from './Map';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { jobCategories } from '../../utils/config';

const JobsMap = ({
  jobs = [],
  userLocation = null,
  onJobClick,
  className = '',
  height = '500px',
  ...props
}) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    if (jobs.length > 0) {
      // Calculate center based on jobs
      const lats = jobs.map(job => job.location?.coordinates?.[1] || 0);
      const lngs = jobs.map(job => job.location?.coordinates?.[0] || 0);
      
      const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
      const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
      
      setMapCenter({ lat: avgLat, lng: avgLng });
    } else if (userLocation) {
      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [jobs, userLocation]);

  const getCategoryIcon = (category) => {
    const categoryData = jobCategories.find(cat => cat.value === category);
    return categoryData?.icon || '🔧';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'plumbing': 'blue',
      'electrical': 'yellow',
      'cleaning': 'green',
      'gardening': 'green',
      'moving': 'purple',
      'painting': 'orange',
      'repair': 'red',
      'other': 'gray'
    };
    return colors[category] || 'gray';
  };

  const markers = jobs.map(job => {
    const coordinates = job.location?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;

    return {
      lat: coordinates[1],
      lng: coordinates[0],
      title: job.title,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#${getCategoryColor(job.category) === 'blue' ? '3B82F6' : 
                                                      getCategoryColor(job.category) === 'green' ? '10B981' :
                                                      getCategoryColor(job.category) === 'yellow' ? 'F59E0B' :
                                                      getCategoryColor(job.category) === 'purple' ? '8B5CF6' :
                                                      getCategoryColor(job.category) === 'orange' ? 'F97316' :
                                                      getCategoryColor(job.category) === 'red' ? 'EF4444' : '6B7280'}" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial">${getCategoryIcon(job.category)}</text>
          </svg>
        `)}`,
        scaledSize: { width: 32, height: 32 },
        anchor: { x: 16, y: 32 }
      },
      job
    };
  }).filter(Boolean);

  const handleMarkerClick = (markerData, index) => {
    setSelectedJob(markerData.job);
    onJobClick?.(markerData.job);
  };

  const handleMapClick = () => {
    setSelectedJob(null);
  };

  return (
    <div className={className} {...props}>
      <Map
        center={mapCenter}
        zoom={jobs.length > 0 ? 12 : 10}
        markers={markers}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        height={height}
        className="rounded-lg border border-secondary-200 dark:border-secondary-700"
      />

      {/* Selected Job Info */}
      {selectedJob && (
        <div className="mt-4">
          <Card>
            <Card.Header>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{selectedJob.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" size="sm">
                      {getCategoryIcon(selectedJob.category)} {jobCategories.find(cat => cat.value === selectedJob.category)?.label || selectedJob.category}
                    </Badge>
                    <Badge variant={selectedJob.status === 'open' ? 'success' : 'warning'} size="sm">
                      {selectedJob.status}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </Card.Header>
            
            <Card.Content>
              <div className="space-y-3">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {selectedJob.description.substring(0, 100)}...
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary-600">
                    ${selectedJob.budget?.min || 0} - ${selectedJob.budget?.max || 0}
                  </span>
                  <span className="text-secondary-500">
                    {selectedJob.location?.address?.formatted || 'Location not specified'}
                  </span>
                </div>
                
                {onJobClick && (
                  <button
                    onClick={() => onJobClick(selectedJob)}
                    className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Map Legend */}
      {jobs.length > 0 && (
        <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Job Categories</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {jobCategories.slice(0, 6).map(category => (
              <div key={category.value} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getCategoryColor(category.value) === 'blue' ? '#3B82F6' :
                                   getCategoryColor(category.value) === 'green' ? '#10B981' :
                                   getCategoryColor(category.value) === 'yellow' ? '#F59E0B' :
                                   getCategoryColor(category.value) === 'purple' ? '#8B5CF6' :
                                   getCategoryColor(category.value) === 'orange' ? '#F97316' :
                                   getCategoryColor(category.value) === 'red' ? '#EF4444' : '#6B7280'
                  }}
                />
                <span>{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsMap; 