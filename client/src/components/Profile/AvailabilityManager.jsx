import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Save
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';

const AvailabilityManager = ({ user, onUpdate }) => {
  const [availability, setAvailability] = useState({
    monday: { available: true, start: '09:00', end: '17:00' },
    tuesday: { available: true, start: '09:00', end: '17:00' },
    wednesday: { available: true, start: '09:00', end: '17:00' },
    thursday: { available: true, start: '09:00', end: '17:00' },
    friday: { available: true, start: '09:00', end: '17:00' },
    saturday: { available: false, start: '09:00', end: '17:00' },
    sunday: { available: false, start: '09:00', end: '17:00' }
  });
  const queryClient = useQueryClient();

  const updateAvailabilityMutation = useMutation({
    mutationFn: (data) => api.auth.updateAvailability(data),
    onSuccess: () => {
      toast.success('Availability updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    }
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleDayToggle = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(availability);
  };

  const getAvailableDays = () => {
    return days.filter(day => availability[day.key].available).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Availability Schedule
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set your working hours and availability
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateAvailabilityMutation.isLoading}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Save Schedule
        </Button>
      </div>

      <Card>
        <Card.Content>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={availability[day.key].available}
                    onChange={() => handleDayToggle(day.key)}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {day.label}
                  </span>
                  {availability[day.key].available && (
                    <Badge variant="success" size="sm">
                      Available
                    </Badge>
                  )}
                </div>
                
                {availability[day.key].available && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={availability[day.key].start}
                      onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={availability[day.key].end}
                      onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Summary */}
      <Card>
        <Card.Header>
          <Card.Title>Availability Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Calendar className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                {getAvailableDays()} Days
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available per week
              </p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Flexible Hours
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customizable schedule
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Auto-Update
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time availability
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AvailabilityManager; 